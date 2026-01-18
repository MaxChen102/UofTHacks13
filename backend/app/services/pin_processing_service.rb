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

    # Step 1: Extract text and parse details from image
    image_base64 = Base64.strict_encode64(download_image_bytes(image_url))
    result = VisionToGeminiService.new(image_base64: image_base64).call

    details = parse_json(result[:json_text])
    metadata = build_metadata(result, details)

    # Step 2: Determine pin type and title
    title = details["title"]
    pin_type = determine_pin_type(details)

    # Step 3: Search and summarize with Gemini Flash (if we have a title)
    search_summary = nil
    if title.is_a?(String) && !title.strip.empty?
      search_summary = perform_search_and_summarize(title, details, pin_type)
    end

    # Step 4: Build update attributes
    update_attrs = build_update_attrs(details, result, metadata, search_summary, pin_type)

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

  def determine_pin_type(details)
    # Default to restaurant for now, can be expanded based on content analysis
    extra = details["extra"].to_s.downcase
    
    return "concert" if extra.include?("concert") || extra.include?("show") || extra.include?("music")
    return "sports" if extra.include?("game") || extra.include?("match") || extra.include?("stadium")
    return "event" if extra.include?("event") || extra.include?("festival")
    
    "restaurant"
  end

  def perform_search_and_summarize(title, details, pin_type)
    address = details["address"]
    
    SearchSummaryService.search_and_summarize(
      name: title,
      address: address,
      place_type: pin_type
    )
  rescue Errors::GoogleSearchError => e
    Rails.logger.warn("Google Search failed for pin #{@pin.id}: #{e.message}")
    nil
  rescue Errors::GeminiError => e
    Rails.logger.warn("Gemini summarization failed for pin #{@pin.id}: #{e.message}")
    nil
  end

  def build_update_attrs(details, result, metadata, search_summary, pin_type)
    update_attrs = { 
      processing_status: "complete", 
      metadata: metadata,
      pin_type: pin_type
    }

    # Title from extracted details
    if details["title"].is_a?(String) && !details["title"].strip.empty?
      update_attrs[:title] = details["title"]
    end

    # Location from extracted details
    location = build_location(details)
    update_attrs[:location] = location if location

    # If search summary available, use enriched data matching Pin model structure
    if search_summary
      # summary: String
      update_attrs[:summary] = search_summary[:summary]
      
      # links: Hash { website, tickets, menu, reviews }
      update_attrs[:links] = search_summary[:links] if search_summary[:links].present?
      
      # metadata: Hash - merge extracted data with search metadata
      update_attrs[:metadata] = metadata.merge(search_summary[:metadata] || {})
    else
      # Fallback to basic summary from extracted text
      update_attrs[:summary] = build_summary(details, result[:text])
    end

    update_attrs
  end
end
