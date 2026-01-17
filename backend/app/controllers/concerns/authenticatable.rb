# app/controllers/concerns/authenticatable.rb
module Authenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!, unless: :skip_authentication?
  end

  private

  def authenticate_user!
    token = extract_token_from_header

    unless token
      Rails.logger.warn("Authentication failed: No token provided")
      render json: { error: "Authentication token required" }, status: :unauthorized
      return
    end

    decode_and_set_user(token)
  rescue JWT::DecodeError => e
    Rails.logger.error("JWT decode error: #{e.message}")
    render json: { error: "Invalid or expired token" }, status: :unauthorized
  rescue Errors::AuthenticationError => e
    Rails.logger.warn("Authentication error: #{e.message}")
    render json: { error: e.message }, status: :unauthorized
  rescue StandardError => e
    Rails.logger.error("Unexpected authentication error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    render json: { error: "Authentication failed" }, status: :unauthorized
  end

  def current_user
    @current_user
  end

  def extract_token_from_header
    auth_header = request.headers["Authorization"]
    return nil unless auth_header

    # Extract token from "Bearer <token>" format
    auth_header.split(" ").last if auth_header.start_with?("Bearer ")
  end

  def decode_and_set_user(token)
    # For hackathon/development: decode without verification
    # In production, you should verify with Clerk's JWKS public keys
    # See: https://clerk.com/docs/backend-requests/handling/manual-jwt

    begin
      # Decode without verification (RS256 requires public key from JWKS)
      decoded_token = JWT.decode(
        token,
        nil,
        false  # Skip signature verification for now
      )

      Rails.logger.info("Token decoded successfully")
    rescue JWT::DecodeError => e
      Rails.logger.error("JWT decode failed: #{e.message}")
      raise Errors::AuthenticationError, "Invalid or expired token"
    end

    # Extract Clerk user ID from 'sub' claim
    clerk_id = decoded_token.first["sub"]

    unless clerk_id
      Rails.logger.error("Token missing 'sub' claim. Token payload: #{decoded_token.first.inspect}")
      raise Errors::AuthenticationError, "Invalid token format"
    end

    # Verify token issuer matches your Clerk instance (basic security check)
    issuer = decoded_token.first["iss"]
    expected_issuer = "https://internal-racer-63.clerk.accounts.dev"

    if issuer != expected_issuer
      Rails.logger.warn("Token issuer mismatch: #{issuer} != #{expected_issuer}")
      render json: { error: "Invalid token issuer" }, status: :unauthorized
      return
    end

    # Check token expiration
    exp = decoded_token.first["exp"]
    if exp && Time.at(exp) < Time.now
      Rails.logger.warn("Token expired at #{Time.at(exp)}")
      render json: { error: "Token expired" }, status: :unauthorized
      return
    end

    # Find user by Clerk ID
    # Note: Mongoid may raise DocumentNotFound instead of returning nil
    begin
      @current_user = User.find_by(clerk_id: clerk_id)
    rescue Mongoid::Errors::DocumentNotFound
      @current_user = nil
    end

    # Auto-sync only if user doesn't exist
    # The sync service uses timestamp-based conditional updates to avoid unnecessary writes
    unless @current_user
      Rails.logger.warn("User not found in MongoDB for clerk_id: #{clerk_id}")
      Rails.logger.info("Attempting auto-sync from Clerk API...")

      # Auto-heal: sync user from Clerk (service will check timestamps to avoid unnecessary updates)
      sync_result = SyncUserFromClerkService.new(clerk_id).call

      if sync_result.success?
        @current_user = sync_result.data
        Rails.logger.info("User auto-synced successfully: #{@current_user.email}")
      else
        Rails.logger.error("Auto-sync failed: #{sync_result.errors.join(', ')}")
        render json: {
          error: "User account sync failed. Please contact support.",
          details: sync_result.errors
        }, status: :service_unavailable
        return
      end
    end

    Rails.logger.info("Authenticated user: #{@current_user.email} (#{@current_user.clerk_id})")
  end

  def skip_authentication?
    false
  end
end
