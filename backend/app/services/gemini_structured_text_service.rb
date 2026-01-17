# app/services/gemini_structured_text_service.rb
require "net/http"
require "json"

class GeminiStructuredTextService
  DEFAULT_MODEL = "gemini-2.5-flash"

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

    text.strip
  end

  private

  def build_prompt
    schema = resolve_schema_hint
    entity_label = @entity_type.empty? ? "place" : @entity_type

    <<~PROMPT
      You are a parser. Convert the input into JSON only (no markdown).
      If a field is unknown, return null. Do not invent data.

      Schema:
      #{schema}

      Entity type (pin_type): #{entity_label}

      Input:
      #{@text}
    PROMPT
  end

  def resolve_schema_hint
    return @schema_hint unless @schema_hint.empty?

    pin_schema_hint
  end

  def pin_schema_hint
    <<~SCHEMA
      {
        "title": string | null,          // name of place/event
        "address": string | null,        // full address if present
        "time": string | null,           // ISO 8601 or raw time text
        "extra": string | null           // extra details useful for search
      }
    SCHEMA
  end

  def post_to_gemini(api_key, prompt)
    model = ENV.fetch("GEMINI_MODEL", DEFAULT_MODEL)
    uri = URI.parse("https://generativelanguage.googleapis.com/v1beta/models/#{model}:generateContent?key=#{api_key}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

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
        temperature: 0.2,
        maxOutputTokens: 512
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
