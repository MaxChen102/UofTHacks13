# app/controllers/concerns/webhook_authenticatable.rb
module WebhookAuthenticatable
  extend ActiveSupport::Concern

  included do
    before_action :verify_webhook_signature, only: [:create]
  end

  private

  def verify_webhook_signature
    # Extract Svix headers
    svix_id = request.headers['svix-id']
    svix_timestamp = request.headers['svix-timestamp']
    svix_signature = request.headers['svix-signature']

    Rails.logger.info("Webhook headers - ID: #{svix_id}, Timestamp: #{svix_timestamp}, Signature: #{svix_signature&.truncate(50)}")

    # Validate required headers are present
    unless svix_id && svix_timestamp && svix_signature
      Rails.logger.error("Webhook verification failed: Missing required Svix headers")
      render json: { error: 'Unauthorized' }, status: :unauthorized
      return
    end

    # Get the raw request body
    payload = request.raw_post
    Rails.logger.info("Webhook payload length: #{payload.length}")

    # Verify the signature
    if verify_svix_signature(payload, svix_id, svix_timestamp, svix_signature)
      Rails.logger.info("Webhook signature verified successfully")
    else
      Rails.logger.error("Webhook verification failed: Invalid signature")
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  rescue StandardError => e
    Rails.logger.error("Webhook verification error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    render json: { error: 'Unauthorized' }, status: :unauthorized
  end

  def verify_svix_signature(payload, svix_id, svix_timestamp, svix_signature)
    # Construct the signed content
    signed_content = "#{svix_id}.#{svix_timestamp}.#{payload}"

    # Get the webhook secret from environment
    secret = ENV['CLERK_WEBHOOK_SECRET'] || ENV['CLERK_SECRET_KEY']

    unless secret
      Rails.logger.error("CLERK_WEBHOOK_SECRET not configured")
      return false
    end

    Rails.logger.info("Using webhook secret starting with: #{secret[0..10]}...")

    # Check if it's the wrong type of secret
    if secret.start_with?('sk_test_') || secret.start_with?('sk_live_')
      Rails.logger.error("ERROR: Using API secret instead of webhook secret! Webhook secrets start with 'whsec_'")
      return false
    end

    # Remove 'whsec_' prefix if present (Clerk webhook secrets start with this)
    secret = secret.delete_prefix('whsec_')

    # Decode the base64 secret
    secret_bytes = Base64.decode64(secret)

    # Generate expected signature using HMAC SHA256
    expected_signature = Base64.strict_encode64(
      OpenSSL::HMAC.digest('SHA256', secret_bytes, signed_content)
    )

    Rails.logger.info("Expected signature: #{expected_signature[0..20]}...")

    # Extract signature(s) from header (format: v1,signature1 v1,signature2)
    signatures = svix_signature.split(' ').map { |sig| sig.split(',')[1] }
    Rails.logger.info("Received signatures: #{signatures.map { |s| s[0..20] }.join(', ')}...")

    # Check if any signature matches (Svix sends multiple signatures)
    match = signatures.any? { |sig| ActiveSupport::SecurityUtils.secure_compare(sig, expected_signature) }
    Rails.logger.info("Signature match: #{match}")
    match
  end
end
