# app/services/create_pin_service.rb
class CreatePinService
  def initialize(user, params)
    @user = user
    @params = params
  end

  def call
    validation_result = validate_collection_ownership
    return validation_result if validation_result

    build_pin
    save_pin
  rescue StandardError => e
    Rails.logger.error("Pin creation error: #{e.message}")
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

  def build_pin
    @pin = @user.pins.build(collection_id: @params[:collection_id])

    # Transform image_url param to source_images array
    if @params[:image_url].present?
      @pin.source_images = [@params[:image_url]]
    end

    # Set initial processing status
    @pin.processing_status = 'processing'
  end

  def save_pin
    if @pin.save
      Rails.logger.info("Pin created: #{@pin.id} for user #{@user.email}")
      enqueue_processing_job
      Result.new(success: true, data: @pin)
    else
      Rails.logger.warn("Pin creation failed: #{@pin.errors.full_messages.join(', ')}")
      Result.new(success: false, errors: @pin.errors.full_messages)
    end
  end

  def enqueue_processing_job
    PinProcessorJob.perform_later(@pin.id.to_s)
  rescue StandardError => e
    Rails.logger.error("Failed to enqueue PinProcessorJob for pin #{@pin.id}: #{e.message}")
    @pin.update(
      processing_status: "failed",
      metadata: (@pin.metadata || {}).merge("processing_error" => e.message)
    )
  end
end
