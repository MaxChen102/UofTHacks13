class PinProcessorJob < ApplicationJob
  queue_as :default
  retry_on StandardError, wait: 5.seconds, attempts: 3

  def perform(pin_id)
    pin = Pin.find(pin_id.to_s)
    return if pin.processing_status == "complete"

    PinProcessingService.new(pin).call
  rescue StandardError => e
    Rails.logger.error("PinProcessorJob failed for pin #{pin_id}: #{e.message}")
    pin.update!(processing_status: "failed", metadata: (pin.metadata || {}).merge("processing_error" => e.message))
    raise e
  end
end
