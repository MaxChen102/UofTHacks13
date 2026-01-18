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

    # Step 2: Google Places API - get accurate location data FIRST (lat/lng, place_id, etc.)
    title = details["title"]
    places_result = lookup_place(details, result[:text])

    # Step 3: Fetch search results using accurate location from Places API
    search_results = fetch_search_results(title, details, places_result)

    # Step 3b: Classify pin type with AI using all available data
    classification_result = classify_pin_type(result[:text], details, search_results)
    pin_type = classification_result[:pin_type]

    # Step 4: Summarize search results with OCR text AND Places API context for disambiguation
    search_summary = summarize_search_results(search_results, title, pin_type, result[:text], places_result)

    # Step 5: FINAL classification and title generation using enriched summary
    if search_summary && search_summary[:summary].present?
      # Reclassify with summary for better accuracy
      final_classification = classify_pin_type_with_summary(result[:text], details, search_results, search_summary[:summary])
      final_pin_type = final_classification[:pin_type]

      # Generate contextual title (e.g., "Dinner at Grappa" instead of just "Grappa")
      final_title = generate_contextual_title(title, final_pin_type, search_summary[:summary], result[:text])
    else
      # Fallback to initial classification and title if no summary
      final_classification = classification_result
      final_pin_type = pin_type
      final_title = title
    end

    # Step 6: Build update attributes with final classification and title
    update_attrs = build_update_attrs(details, result, metadata, places_result, search_summary, final_pin_type, final_classification, final_title)

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

  def build_location(details, places_result)
    address = details["address"]
    address = address.is_a?(String) ? address.strip : nil

    # If we have Places API result, use enriched location data
    if places_result
      return {
        "address" => places_result["formatted_address"] || address,
        "lat" => places_result["lat"],
        "lng" => places_result["lng"],
        "place_id" => places_result["place_id"],
        "name" => places_result["name"],
        "google_maps_url" => places_result["google_maps_url"]
      }.compact
    end

    # Fallback to just address from extracted details
    return nil unless address && !address.empty?
    { "address" => address }
  end

  def determine_pin_type_fallback(details)
    extra = details["extra"].to_s.downcase

    return "concert" if extra.include?("concert") || extra.include?("show") || extra.include?("music")
    return "sports" if extra.include?("game") || extra.include?("match") || extra.include?("stadium")
    return "event" if extra.include?("event") || extra.include?("festival")

    "restaurant"
  end

  # Fetch Google Custom Search results using accurate location from Places API
  def fetch_search_results(title, details, places_result)
    return nil if title.to_s.strip.empty?

    # Use Places API location (most accurate), fallback to details["address"]
    location = if places_result
                 places_result["formatted_address"] || places_result["name"]
               else
                 details["address"]
               end

    GoogleSearchService.search_restaurant(name: title, location: location)
  rescue Errors::GoogleSearchError => e
    Rails.logger.warn("Google Search failed for pin #{@pin.id}: #{e.message}")
    nil
  end

  # Classify pin type using AI with all available data
  def classify_pin_type(extracted_text, details, search_results)
    PinTypeClassificationService.new(
      extracted_text: extracted_text,
      structured_details: details,
      search_results: search_results
    ).call
  rescue Errors::GeminiError => e
    Rails.logger.warn("Pin classification failed for pin #{@pin.id}: #{e.message}")
    # Fallback to old keyword matching
    { pin_type: determine_pin_type_fallback(details), confidence: "low", reasoning: "Fallback due to API error" }
  end

  # FINAL classification with summary for maximum accuracy
  def classify_pin_type_with_summary(extracted_text, details, search_results, summary)
    PinTypeClassificationService.new(
      extracted_text: extracted_text,
      structured_details: details,
      search_results: search_results,
      summary: summary
    ).call
  rescue Errors::GeminiError => e
    Rails.logger.warn("Final classification failed for pin #{@pin.id}: #{e.message}")
    # Fallback to initial classification
    classify_pin_type(extracted_text, details, search_results)
  end

  # Generate contextual title (e.g., "Dinner at Grappa" instead of "Grappa")
  def generate_contextual_title(place_name, pin_type, summary, extracted_text)
    PinTitleGenerationService.new(
      place_name: place_name,
      pin_type: pin_type,
      summary: summary,
      extracted_text: extracted_text
    ).call
  rescue Errors::GeminiError => e
    Rails.logger.warn("Title generation failed for pin #{@pin.id}: #{e.message}")
    # Fallback to original title
    place_name
  end

  # Summarize search results using search data, OCR text, and Places API context
  def summarize_search_results(search_results, title, pin_type, extracted_text, places_result)
    return nil unless search_results

    SearchSummaryService.new(
      search_results: search_results,
      place_name: title,
      place_type: pin_type,
      extracted_text: extracted_text,
      places_data: places_result
    ).call
  rescue Errors::GeminiError => e
    Rails.logger.warn("Gemini summarization failed for pin #{@pin.id}: #{e.message}")
    nil
  end

  # Google Places API lookup for location data
  def lookup_place(details, extracted_text)
    query = build_places_query(details, extracted_text)
    return nil if query.nil?

    GooglePlacesLookupService.new(query: query).call
  rescue StandardError => e
    Rails.logger.warn("Places lookup failed for pin #{@pin.id}: #{e.message}")
    nil
  end

  def build_places_query(details, extracted_text)
    title = details["title"]
    address = details["address"]

    if title.is_a?(String) && address.is_a?(String)
      combined = "#{title} #{address}".strip
      return combined unless combined.empty?
    end

    if address.is_a?(String)
      trimmed = address.strip
      return trimmed unless trimmed.empty?
    end

    if title.is_a?(String)
      trimmed = title.strip
      return trimmed unless trimmed.empty?
    end

    fallback = extracted_text.to_s.strip
    return nil if fallback.empty?

    fallback
  end

  # Google Custom Search + Gemini Flash summarization
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

  def build_update_attrs(details, result, metadata, places_result, search_summary, pin_type, classification_result, final_title = nil)
    update_attrs = {
      processing_status: "complete",
      metadata: metadata,
      pin_type: pin_type
    }

    # Title: Use final generated title if available, otherwise use extracted title
    if final_title.present?
      update_attrs[:title] = final_title
    elsif details["title"].is_a?(String) && !details["title"].strip.empty?
      update_attrs[:title] = details["title"]
    end

    # Location from Google Places API (with lat/lng) or fallback to extracted address
    location = build_location(details, places_result)
    update_attrs[:location] = location if location

    # Add classification metadata
    if classification_result
      update_attrs[:metadata] = metadata.merge(
        "classification" => {
          "pin_type" => classification_result[:pin_type],
          "confidence" => classification_result[:confidence],
          "reasoning" => classification_result[:reasoning],
          "timestamp" => Time.current.iso8601
        }
      )
      metadata = update_attrs[:metadata]
    end

    # Add places data to metadata
    if places_result
      update_attrs[:metadata] = metadata.merge("places" => places_result)
    end

    # If search summary available, use enriched data from Gemini Flash
    if search_summary
      # summary: String - AI-generated summary from search results
      update_attrs[:summary] = search_summary[:summary]

      # links: Hash { website, tickets, menu, reviews }
      update_attrs[:links] = search_summary[:links] if search_summary[:links].present?

      # metadata: Hash - merge with search metadata (highlights, rating, etc.)
      update_attrs[:metadata] = (update_attrs[:metadata] || metadata).merge(search_summary[:metadata] || {})
    else
      # Fallback to basic summary from extracted text
      update_attrs[:summary] = build_summary(details, result[:text])
    end

    update_attrs
  end
end
