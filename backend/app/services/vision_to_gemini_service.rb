class VisionToGeminiService
  def initialize(image_base64:, schema_hint: nil, entity_type: nil)
    @image_base64 = image_base64
    @schema_hint = schema_hint
    @entity_type = entity_type
  end

  def call
    text = VisionOcrService.new(image_base64: @image_base64).call
    json_text = GeminiStructuredTextService.new(
      text: text,
      schema_hint: @schema_hint,
      entity_type: @entity_type
    ).call

    {
      text: text,
      json_text: json_text
    }
  end
end
