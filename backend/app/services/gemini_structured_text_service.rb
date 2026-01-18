# app/services/gemini_structured_text_service.rb
require "net/http"
require "json"

class GeminiStructuredTextService
  DEFAULT_MODEL = "gemini-2.0-flash"

  def initialize(text:, schema_hint: nil, entity_type: nil)
    @text = text.to_s.strip
    @schema_hint = schema_hint.to_s.strip
    @entity_type = entity_type.to_s.strip
  end

  def call
    raise Errors::ValidationError, "text is required" if @text.empty?

    api_key = ENV["GEMINI_API_KEY"]
    raise Errors::GeminiError, "GEMINI_API_KEY not set" if api_key.nil? || api_key.empty?

    prompt = build_prompt
    response = post_to_gemini(api_key, prompt)

    text = response.dig("candidates", 0, "content", "parts", 0, "text")
    raise Errors::GeminiError, "Gemini response missing text" if text.nil? || text.strip.empty?

    # Clean up response - remove markdown code blocks if present
    cleaned = text.strip.gsub(/```json\s*/i, "").gsub(/```\s*/, "").strip
    cleaned
  end

  private

  def build_prompt
    schema = resolve_schema_hint
    entity_label = @entity_type.empty? ? "place" : @entity_type

    <<~PROMPT
      Extract structured information from this text and return valid JSON only.
      No markdown, no code blocks, just raw JSON.
      If a field is unknown or not present, use null.

      Required JSON schema:
      {
        "title": "name of place, restaurant, or event",
        "address": "full street address if present, or null",
        "time": "date/time if present, or null",
        "extra": "type of cuisine, category, or other useful details"
      }

      Text to parse:
      #{@text[0..2000]}

      Return only the JSON object, nothing else.
    PROMPT
  end

  def resolve_schema_hint
    return @schema_hint unless @schema_hint.empty?

    pin_schema_hint
  end

  def pin_schema_hint
    <<~SCHEMA
      {
        "title": string | null,
        "address": string | null,
        "time": string | null,
        "extra": string | null
      }
    SCHEMA
  end

  def post_to_gemini(api_key, prompt)
    model = ENV.fetch("GEMINI_MODEL", DEFAULT_MODEL)
    uri = URI.parse("https://generativelanguage.googleapis.com/v1beta/models/#{model}:generateContent?key=#{api_key}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 30

    request = Net::HTTP::Post.new(uri.request_uri)
    request["Content-Type"] = "application/json"
    request.body = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024
      }
    }.to_json

    response = http.request(request)
    unless response.is_a?(Net::HTTPSuccess)
      raise Errors::GeminiError, "Gemini API error: #{response.code} - #{response.body}"
    end

    JSON.parse(response.body)
  rescue JSON::ParserError => e
    raise Errors::GeminiError, "Invalid Gemini response: #{e.message}"
  end
end
