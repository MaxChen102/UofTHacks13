class PinTitleGenerationService
  MAX_TITLE_LENGTH = 50

  def initialize(place_name:, pin_type:, summary:, extracted_text: nil)
    @place_name = place_name.to_s.strip
    @pin_type = pin_type.to_s.strip
    @summary = summary.to_s.strip
    @extracted_text = extracted_text.to_s.strip
  end

  def call
    return default_title if @place_name.empty?

    generate_contextual_title
  rescue StandardError => e
    Rails.logger.error("Title generation error: #{e.message}")
    raise Errors::GeminiError, "Failed to generate title: #{e.message}"
  end

  private

  def default_title
    @place_name
  end

  def generate_contextual_title
    prompt = build_title_prompt
    response = call_gemini_api(prompt)
    parse_title_response(response)
  end

  def build_title_prompt
    <<~PROMPT
      Create a concise title (max 10 words) for this #{@pin_type}.

      Place: #{@place_name}
      Summary: #{@summary.first(300)}

      Examples:
      - Restaurant: "Dinner at [Name]"
      - Concert: "[Artist] Concert"
      - Sports: "[Team] vs. [Team]"

      Return JSON: {"title": "generated title"}
    PROMPT
  end

  def call_gemini_api(prompt)
    uri = URI("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=#{ENV['GEMINI_API_KEY']}")

    request_body = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 512,
        responseMimeType: "application/json"
      }
    }

    response = Net::HTTP.post(uri, request_body.to_json, { "Content-Type" => "application/json" })

    unless response.is_a?(Net::HTTPSuccess)
      raise Errors::GeminiError, "Gemini API error: #{response.code} - #{response.body}"
    end

    JSON.parse(response.body)
  end

  def parse_title_response(response)
    content = response.dig("candidates", 0, "content", "parts", 0, "text")

    unless content
      Rails.logger.warn("Empty title response from Gemini API")
      return default_title
    end

    # Clean up any prefix text before JSON (e.g., "Here is the JSON: {...}")
    cleaned = content.strip
    # Try to extract JSON object if there's prefix text
    if cleaned.include?('{')
      json_start = cleaned.index('{')
      cleaned = cleaned[json_start..-1]
    end

    result = JSON.parse(cleaned)
    title = result["title"].to_s.strip

    # Validate and truncate if needed
    if title.empty?
      Rails.logger.warn("Generated title is empty, using default")
      return default_title
    end

    # Truncate if too long
    title = title.first(MAX_TITLE_LENGTH) if title.length > MAX_TITLE_LENGTH

    title
  rescue JSON::ParserError => e
    Rails.logger.error("Failed to parse Gemini title response: #{e.message}")
    default_title
  end
end
