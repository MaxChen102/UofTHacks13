# app/services/vision_ocr_service.rb
require "base64"
require "stringio"
require "google/cloud/vision"

class VisionOcrService
  def initialize(image_base64:)
    @image_base64 = image_base64.to_s
  end

  def call
    raise Errors::ValidationError, "image_base64 is required" if @image_base64.empty?

    image_bytes = decode_base64(@image_base64)
    vision = Google::Cloud::Vision.image_annotator

    image_io = StringIO.new(image_bytes)
    response = vision.text_detection(image: image_io)

    annotation = response.responses&.first&.full_text_annotation
    text = annotation&.text.to_s.strip

    if text.empty?
      raise Errors::VisionError, "No text detected"
    end

    text
  rescue Google::Cloud::Error => e
    raise Errors::VisionError, e.message
  end

  private

  def decode_base64(value)
    sanitized = value.sub(/\Adata:.*;base64,/, "")
    Base64.decode64(sanitized)
  rescue ArgumentError
    raise Errors::ValidationError, "Invalid base64 image"
  end
end
