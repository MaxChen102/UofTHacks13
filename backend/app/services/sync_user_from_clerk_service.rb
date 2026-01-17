# app/services/sync_user_from_clerk_service.rb
class SyncUserFromClerkService
  def initialize(clerk_id, api_client: ClerkApiClient.new)
    @clerk_id = clerk_id
    @api_client = api_client
  end

  def call
    # Check if user already exists (idempotent)
    # Note: Mongoid may raise DocumentNotFound instead of returning nil
    begin
      existing_user = User.find_by(clerk_id: @clerk_id)
    rescue Mongoid::Errors::DocumentNotFound
      existing_user = nil
    end

    if existing_user
      Rails.logger.info("User already synced: #{existing_user.email} (#{@clerk_id})")
      return Result.new(success: true, data: existing_user)
    end

    # Fetch user data from Clerk API
    clerk_user_data = @api_client.get_user(@clerk_id)

    # Extract email and name using same logic as webhook service
    email = extract_email(clerk_user_data)
    name = extract_name(clerk_user_data)

    # Validate required fields
    unless email
      return Result.new(
        success: false,
        errors: ['Missing required field: email']
      )
    end

    # Use find_or_create_by for race condition safety
    user = User.find_or_create_by(clerk_id: @clerk_id) do |u|
      u.email = email
      u.name = name
    end

    if user.persisted?
      Rails.logger.info("User synced from Clerk: #{user.email} (#{@clerk_id})")
      Result.new(success: true, data: user)
    else
      Rails.logger.error("Failed to sync user: #{user.errors.full_messages}")
      Result.new(success: false, errors: user.errors.full_messages)
    end

  rescue Errors::NotFoundError => e
    Rails.logger.error("User not found in Clerk: #{@clerk_id}")
    Result.new(success: false, errors: [e.message])
  rescue Errors::AuthenticationError => e
    Rails.logger.error("Clerk API authentication failed: #{e.message}")
    Result.new(success: false, errors: [e.message])
  rescue Errors::ApiError => e
    Rails.logger.error("Clerk API error: #{e.message}")
    Result.new(success: false, errors: [e.message])
  rescue StandardError => e
    Rails.logger.error("User sync error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    Result.new(success: false, errors: [e.message])
  end

  private

  def extract_email(clerk_user_data)
    # Clerk provides email in email_addresses array
    email_addresses = clerk_user_data['email_addresses']
    return nil unless email_addresses.is_a?(Array) && email_addresses.any?

    # Get the primary email or first email
    primary_email = email_addresses.find { |e| e['id'] == clerk_user_data['primary_email_address_id'] }
    email_obj = primary_email || email_addresses.first

    email_obj['email_address']
  end

  def extract_name(clerk_user_data)
    # Combine first_name and last_name if available
    first_name = clerk_user_data['first_name']
    last_name = clerk_user_data['last_name']

    if first_name && last_name
      "#{first_name} #{last_name}".strip
    elsif first_name
      first_name
    elsif last_name
      last_name
    else
      nil
    end
  end
end
