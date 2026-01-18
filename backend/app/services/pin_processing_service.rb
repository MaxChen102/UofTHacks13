require "base64"
require "json"
require "net/http"
require "uri"

class PinProcessingService
  def initialize(pin)
    @pin = pin
  end

  def call
    return if @pin.processing_status == "complete"

    image_url = @pin.source_images.first
    raise Errors::ValidationError, "Pin has no source image" if image_url.to_s.strip.empty?

    @pin.update!(processing_status: "processing") unless @pin.processing_status == "processing"

    image_base64 = Base64.strict_encode64(download_image_bytes(image_url))
    result = VisionToGeminiService.new(image_base64: image_base64).call

    details = parse_json(result[:json_text])
    summary = build_summary(details, result[:text])
    metadata = build_metadata(result, details)

    update_attrs = { processing_status: "complete", metadata: metadata }
    update_attrs[:title] = details["title"] if details["title"].is_a?(String) && !details["title"].strip.empty?
    update_attrs[:summary] = summary if summary
    location = build_location(details)
    update_attrs[:location] = location if location

    @pin.update!(update_attrs)
  end

  private

  def download_image_bytes(url)
    uri = URI.parse(url)
    unless uri.is_a?(URI::HTTP) || uri.is_a?(URI::HTTPS)
      raise Errors::ValidationError, "Unsupported image URL"
    end

    response = fetch_with_redirects(uri, 3)
    unless response.is_a?(Net::HTTPSuccess)
      raise Errors::VisionError, "Image download failed: #{response.code}"
    end

    response.body
  end

  def fetch_with_redirects(uri, limit)
    raise Errors::VisionError, "Too many redirects" if limit < 0

    response = Net::HTTP.get_response(uri)
    return response unless response.is_a?(Net::HTTPRedirection)

    location = response["location"]
    raise Errors::VisionError, "Redirect without location" if location.nil?

    fetch_with_redirects(URI.parse(location), limit - 1)
  end

  def parse_json(json_text)
    JSON.parse(json_text.to_s)
  rescue JSON::ParserError => e
    Rails.logger.warn("Gemini JSON parse failed for pin #{@pin.id}: #{e.message}")
    {}
  end

  def build_summary(details, extracted_text)
    parts = []
    extra = details["extra"]
    address = details["address"]
    time = details["time"]

    parts << extra if extra.is_a?(String) && !extra.strip.empty?
    parts << "Address: #{address}" if address.is_a?(String) && !address.strip.empty?
    parts << "Time: #{time}" if time.is_a?(String) && !time.strip.empty?

    if parts.empty?
      text = extracted_text.to_s.strip
      return nil if text.empty?
      return text
    end

    parts.join(" • ")
  end

  def build_metadata(result, details)
    current = @pin.metadata || {}
    current.merge(
      "extracted_text" => result[:text],
      "json_text" => result[:json_text],
      "parsed" => details
    )
  end

  def build_location(details)
    address = details["address"]
    return nil unless address.is_a?(String) && !address.strip.empty?

    {
      "address" => address.strip
    }
  end
end
