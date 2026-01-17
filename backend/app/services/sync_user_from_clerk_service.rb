# app/services/sync_user_from_clerk_service.rb
class SyncUserFromClerkService
  def initialize(clerk_id, api_client: ClerkApiClient.new, force: false)
    @clerk_id = clerk_id
    @api_client = api_client
    @force = force  # If true, always sync regardless of timestamp
  end

  def call
    # Check if user exists and if we need to sync
    user = find_user
    needs_sync = should_sync?(user)

    unless needs_sync
      Rails.logger.debug("User already up-to-date: #{user.email} (#{@clerk_id})")
      return Result.new(success: true, data: user)
    end

    # Fetch latest data from Clerk API
    clerk_user_data = @api_client.get_user(@clerk_id)
    clerk_updated_at = extract_updated_at(clerk_user_data)

    # Skip update only if:
    # 1. User exists
    # 2. User has clerk_updated_at field (not legacy data)
    # 3. Clerk's updated_at is available
    # 4. Clerk's updated_at is not newer than local timestamp
    if user && user.clerk_updated_at.present? && clerk_updated_at && clerk_updated_at <= user.clerk_updated_at
      Rails.logger.debug("User data is current (Clerk updated_at: #{clerk_updated_at}, local: #{user.clerk_updated_at})")
      return Result.new(success: true, data: user)
    end

    # Always update if clerk_updated_at field is missing (legacy data migration)
    if user && user.clerk_updated_at.nil?
      Rails.logger.info("User missing clerk_updated_at field, updating from Clerk: #{user.email} (#{@clerk_id})")
    end

    # Extract email and name using same logic as webhook service
    email = extract_email(clerk_user_data)
    name = extract_name(clerk_user_data)

    # Validate required fields
    unless email
      return Result.new(
        success: false,
        errors: [ "Missing required field: email" ]
      )
    end

    # Find or initialize user (handles both create and update cases)
    user ||= User.find_or_initialize_by(clerk_id: @clerk_id)

    # Update attributes from Clerk (Clerk is single source of truth)
    user.email = email if email
    user.name = name if name.present?
    user.clerk_updated_at = clerk_updated_at if clerk_updated_at

    # Save (creates if new, updates if existing)
    was_new_record = user.new_record?
    if user.save
      action = was_new_record ? "created" : "updated"
      Rails.logger.info("User #{action} from Clerk: #{user.email} (#{@clerk_id})")
      Result.new(success: true, data: user)
    else
      action = was_new_record ? "create" : "update"
      Rails.logger.error("Failed to #{action} user: #{user.errors.full_messages}")
      Result.new(success: false, errors: user.errors.full_messages)
    end

  rescue Errors::NotFoundError => e
    Rails.logger.error("User not found in Clerk: #{@clerk_id}")
    Result.new(success: false, errors: [ e.message ])
  rescue Errors::AuthenticationError => e
    Rails.logger.error("Clerk API authentication failed: #{e.message}")
    Result.new(success: false, errors: [ e.message ])
  rescue Errors::ApiError => e
    Rails.logger.error("Clerk API error: #{e.message}")
    Result.new(success: false, errors: [ e.message ])
  rescue StandardError => e
    Rails.logger.error("User sync error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    Result.new(success: false, errors: [ e.message ])
  end

  private

  def find_user
    begin
      User.find_by(clerk_id: @clerk_id)
    rescue Mongoid::Errors::DocumentNotFound
      nil
    end
  end

  def should_sync?(user)
    # Always sync if forced (e.g., from rake task)
    return true if @force

    # Always sync if user doesn't exist
    return true unless user

    # Sync if we don't have a timestamp (first sync or legacy data)
    return true unless user.clerk_updated_at

    # For existing users with timestamp, we'll check after fetching
    # (we need to make the API call to get Clerk's updated_at)
    true
  end

  def extract_updated_at(clerk_user_data)
    # Clerk API returns updated_at as Unix timestamp (milliseconds) or ISO 8601 string
    updated_at_str = clerk_user_data["updated_at"]
    return nil unless updated_at_str

    # Handle Unix timestamp (milliseconds)
    if updated_at_str.is_a?(Integer)
      Time.at(updated_at_str / 1000.0).utc
    # Handle ISO 8601 string
    elsif updated_at_str.is_a?(String)
      Time.parse(updated_at_str).utc
    else
      nil
    end
  rescue ArgumentError, TypeError => e
    Rails.logger.warn("Failed to parse Clerk updated_at: #{updated_at_str} - #{e.message}")
    nil
  end

  def extract_email(clerk_user_data)
    # Clerk provides email in email_addresses array
    email_addresses = clerk_user_data["email_addresses"]
    return nil unless email_addresses.is_a?(Array) && email_addresses.any?

    # Get the primary email or first email
    primary_email = email_addresses.find { |e| e["id"] == clerk_user_data["primary_email_address_id"] }
    email_obj = primary_email || email_addresses.first

    email_obj["email_address"]
  end

  def extract_name(clerk_user_data)
    # Combine first_name and last_name if available
    first_name = clerk_user_data["first_name"]
    last_name = clerk_user_data["last_name"]

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
