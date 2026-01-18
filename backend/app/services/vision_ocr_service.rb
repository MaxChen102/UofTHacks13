# app/services/vision_ocr_service.rb
# Uses Gemini Vision (multimodal) for OCR - only requires GEMINI_API_KEY
require "base64"
require "net/http"
require "json"

class VisionOcrService
  DEFAULT_MODEL = "gemini-2.0-flash"

  def initialize(image_base64:)
    @image_base64 = image_base64.to_s
  end

  def call
    raise Errors::ValidationError, "image_base64 is required" if @image_base64.empty?

    api_key = ENV["GEMINI_API_KEY"]
    raise Errors::VisionError, "GEMINI_API_KEY not set" if api_key.nil? || api_key.empty?

    # Clean base64 string (remove data URI prefix if present)
    clean_base64 = @image_base64.sub(/\Adata:.*;base64,/, "")

    response = post_to_gemini(api_key, clean_base64)

    text = response.dig("candidates", 0, "content", "parts", 0, "text")
    
    if text.nil? || text.strip.empty?
      raise Errors::VisionError, "No text detected in image"
    end

    text.strip
  end

  private

  def post_to_gemini(api_key, image_base64)
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
          parts: [
            {
              inline_data: {
                mime_type: detect_mime_type(image_base64),
                data: image_base64
              }
            },
            {
              text: "Extract ALL text visible in this image. Return only the extracted text, nothing else. Preserve the original formatting and line breaks where possible."
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048
      }
    }.to_json

    response = http.request(request)
    
    unless response.is_a?(Net::HTTPSuccess)
      raise Errors::VisionError, "Gemini Vision API error: #{response.code} - #{response.body}"
    end

    JSON.parse(response.body)
  rescue JSON::ParserError => e
    raise Errors::VisionError, "Invalid Gemini response: #{e.message}"
  end

  def detect_mime_type(base64_data)
    # Try to detect image type from base64 header bytes
    decoded_start = Base64.decode64(base64_data[0..30]) rescue "".b
    
    # Force binary encoding for comparison
    jpeg_sig = "\xFF\xD8\xFF".b
    png_sig = "\x89PNG".b
    gif_sig = "GIF8".b
    riff_sig = "RIFF".b
    webp_sig = "WEBP".b
    
    if decoded_start.bytes[0..2] == jpeg_sig.bytes
      "image/jpeg"
    elsif decoded_start.bytes[0..3] == png_sig.bytes
      "image/png"
    elsif decoded_start.bytes[0..3] == gif_sig.bytes
      "image/gif"
    elsif decoded_start.bytes[0..3] == riff_sig.bytes && decoded_start.bytes[8..11] == webp_sig.bytes
      "image/webp"
    else
      "image/jpeg" # Default fallback
    end
  end
end
