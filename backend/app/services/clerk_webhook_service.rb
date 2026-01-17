# app/services/clerk_webhook_service.rb
class ClerkWebhookService
  def initialize(event_type, data)
    @event_type = event_type
    @data = data
  end

  def call
    case @event_type
    when 'user.created'
      handle_user_created
    when 'user.updated'
      handle_user_updated
    when 'user.deleted'
      handle_user_deleted
    else
      Rails.logger.warn("Unhandled webhook event type: #{@event_type}")
      Result.new(success: true, data: { message: "Event type #{@event_type} ignored" })
    end
  rescue StandardError => e
    Rails.logger.error("Webhook processing error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    Result.new(success: false, errors: [e.message])
  end

  private

  def handle_user_created
    clerk_id = @data['id']
    email = extract_email
    name = extract_name

    # Validate required fields
    unless clerk_id && email
      return Result.new(
        success: false,
        errors: ['Missing required fields: clerk_id or email']
      )
    end

    # Use find_or_create_by for idempotency
    user = User.find_or_create_by(clerk_id: clerk_id) do |u|
      u.email = email
      u.name = name
    end

    if user.persisted?
      Rails.logger.info("User created/found: #{user.id} (clerk_id: #{clerk_id})")
      Result.new(success: true, data: user)
    else
      Rails.logger.error("Failed to create user: #{user.errors.full_messages}")
      Result.new(success: false, errors: user.errors.full_messages)
    end
  end

  def handle_user_updated
    clerk_id = @data['id']

    user = User.find_by(clerk_id: clerk_id)

    unless user
      Rails.logger.warn("User not found for update: #{clerk_id}")
      return Result.new(
        success: true,
        data: { message: "User not found, skipping update" }
      )
    end

    email = extract_email
    name = extract_name

    # Build update attributes
    update_attrs = {}
    update_attrs[:email] = email if email
    update_attrs[:name] = name if name.present?

    if user.update(update_attrs)
      Rails.logger.info("User updated: #{user.id} (clerk_id: #{clerk_id})")
      Result.new(success: true, data: user)
    else
      Rails.logger.error("Failed to update user: #{user.errors.full_messages}")
      Result.new(success: false, errors: user.errors.full_messages)
    end
  end

  def handle_user_deleted
    clerk_id = @data['id']

    user = User.find_by(clerk_id: clerk_id)

    unless user
      Rails.logger.warn("User not found for deletion: #{clerk_id}")
      return Result.new(
        success: true,
        data: { message: "User not found, already deleted" }
      )
    end

    # dependent: :destroy on collections and pins will cascade the deletion
    if user.destroy
      Rails.logger.info("User deleted: #{clerk_id}")
      Result.new(success: true, data: { message: "User deleted successfully" })
    else
      Rails.logger.error("Failed to delete user: #{user.errors.full_messages}")
      Result.new(success: false, errors: user.errors.full_messages)
    end
  end

  def extract_email
    # Clerk provides email in email_addresses array
    email_addresses = @data['email_addresses']
    return nil unless email_addresses.is_a?(Array) && email_addresses.any?

    # Get the primary email or first email
    primary_email = email_addresses.find { |e| e['id'] == @data['primary_email_address_id'] }
    email_obj = primary_email || email_addresses.first

    email_obj['email_address']
  end

  def extract_name
    # Combine first_name and last_name if available
    first_name = @data['first_name']
    last_name = @data['last_name']

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
