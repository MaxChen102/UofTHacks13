# app/services/update_pin_service.rb
class UpdatePinService
  def initialize(pin, params, user)
    @pin = pin
    @params = params
    @user = user
  end

  def call
    validation_result = validate_collection_ownership
    return validation_result if validation_result

    update_pin
  rescue StandardError => e
    Rails.logger.error("Pin update error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    Result.new(success: false, errors: [e.message])
  end

  private

  def validate_collection_ownership
    return nil unless @params[:collection_id].present?

    collection = @user.collections.find(@params[:collection_id])

    unless collection
      return Result.new(
        success: false,
        errors: ["Collection not found or does not belong to user"]
      )
    end

    nil
  rescue Mongoid::Errors::DocumentNotFound
    Result.new(
      success: false,
      errors: ["Collection not found or does not belong to user"]
    )
  end

  def update_pin
    if @pin.update(@params)
      Rails.logger.info("Pin updated: #{@pin.id}")
      Result.new(success: true, data: @pin)
    else
      Rails.logger.warn("Pin update failed: #{@pin.errors.full_messages.join(', ')}")
      Result.new(success: false, errors: @pin.errors.full_messages)
    end
  end
end
