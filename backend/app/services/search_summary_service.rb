# app/services/search_summary_service.rb
# Connects Google Custom Search results to Gemini Flash for summarization
# Returns data matching Pin model structure: { summary, links, metadata }
require "net/http"
require "json"

class SearchSummaryService
  DEFAULT_MODEL = "gemini-3-flash-preview"

  def initialize(search_results:, place_name:, place_type: "restaurant", extracted_text: nil, places_data: nil)
    @search_results = search_results
    @place_name = place_name.to_s.strip
    @place_type = place_type.to_s.strip
    @extracted_text = extracted_text.to_s.strip
    @places_data = places_data
  end

  # Returns hash matching Pin model fields:
  # {
  #   summary: String,
  #   links: { website, tickets, menu, reviews },
  #   metadata: { highlights, rating, price_range, cuisine_type, recommended_dishes }
  # }
  def call
    raise Errors::ValidationError, "search_results is required" if @search_results.nil?
    raise Errors::ValidationError, "place_name is required" if @place_name.empty?

    api_key = ENV["GEMINI_API_KEY"]
    raise Errors::GeminiError, "GEMINI_API_KEY not set" if api_key.nil? || api_key.empty?

    # If no results, return minimal response matching Pin structure
    if @search_results[:results].nil? || @search_results[:results].empty?
      return {
        summary: "No additional information found for #{@place_name}.",
        links: {},
        metadata: {}
      }
    end

    prompt = build_prompt
    response = post_to_gemini(api_key, prompt)

    text = response.dig("candidates", 0, "content", "parts", 0, "text")
    raise Errors::GeminiError, "Gemini response missing text" if text.nil? || text.strip.empty?

    parse_gemini_response(text.strip)
  end

  # Convenience method to search and summarize in one call
  def self.search_and_summarize(name:, address: nil, place_type: "restaurant", extracted_text: nil, places_data: nil)
    # Perform search
    search_results = GoogleSearchService.search_restaurant(name: name, location: address)

    # Summarize with Gemini
    new(
      search_results: search_results,
      place_name: name,
      place_type: place_type,
      extracted_text: extracted_text,
      places_data: places_data
    ).call
  end

  private

  def build_prompt
    results_text = format_search_results
    ocr_section = @extracted_text.empty? ? "" : "\nExtracted Text from Image (OCR):\n#{@extracted_text.first(1000)}\n"
    places_section = format_places_data

    <<~PROMPT
      You are an AI assistant helping users learn about places they want to visit.

      Analyze the following information for "#{@place_name}" (a #{@place_type}) and extract useful information.
      #{places_section}#{ocr_section}
      Search Results:
      #{results_text}

      IMPORTANT: Focus ONLY on the specific location identified in the "Verified Location" section above.
      If search results mention multiple locations with the same name, prioritize the one matching the verified address.

      Respond with JSON only (no markdown code blocks). Use this exact schema:
      {
        "summary": "A 2-3 sentence summary of what this place is known for, its cuisine/specialty, atmosphere, and why someone might want to visit.",
        "links": {
          "website": "official website URL or null",
          "tickets": "ticket purchase URL or null (for events/concerts)",
          "menu": "menu URL or null",
          "reviews": "reviews page URL (Yelp, Google, TripAdvisor) or null"
        },
        "metadata": {
          "highlights": ["highlight 1", "highlight 2", "highlight 3"],
          "rating": "X.X/5 or null if not found",
          "price_range": "$, $$, $$$, or $$$$ or null if not found",
          "cuisine_type": "type of cuisine or null if not a restaurant",
          "recommended_dishes": ["dish 1", "dish 2"] or null if not found
        }
      }
      
      Only include information that is clearly present in the search results. Do not make up information.
      Use null for any field where information is not available.
    PROMPT
  end

  def format_places_data
    return "" unless @places_data

    address = @places_data["formatted_address"] || @places_data["name"]
    rating = @places_data["rating"]
    phone = @places_data["phone_number"]

    parts = []
    parts << "Address: #{address}" if address
    parts << "Rating: #{rating}/5 (#{@places_data['user_ratings_total']} reviews)" if rating
    parts << "Phone: #{phone}" if phone

    return "" if parts.empty?

    <<~PLACES

      Verified Location (from Google Places API):
      #{parts.join("\n")}

    PLACES
  end

  def format_search_results
    @search_results[:results].map.with_index do |result, i|
      pagemap_info = format_pagemap(result[:pagemap])

      <<~RESULT
        Result #{i + 1}:
        Title: #{result[:title]}
        URL: #{result[:link]}
        Snippet: #{result[:snippet]}
        #{pagemap_info}
      RESULT
    end.join("\n---\n")
  end

  def format_pagemap(pagemap)
    return "" if pagemap.nil?

    parts = []
    
    if pagemap[:aggregaterating]
      rating = pagemap[:aggregaterating]
      parts << "Rating: #{rating['ratingvalue']}/#{rating['bestrating'] || 5}" if rating["ratingvalue"]
      parts << "Review Count: #{rating['ratingcount'] || rating['reviewcount']}" if rating["ratingcount"] || rating["reviewcount"]
    end

    if pagemap[:local_business]
      biz = pagemap[:local_business]
      parts << "Address: #{biz['address']}" if biz["address"]
      parts << "Phone: #{biz['telephone']}" if biz["telephone"]
      parts << "Price Range: #{biz['pricerange']}" if biz["pricerange"]
    end

    if pagemap[:restaurant]
      rest = pagemap[:restaurant]
      parts << "Cuisine: #{rest['servescuisine']}" if rest["servescuisine"]
    end

    parts.empty? ? "" : "Structured Data: #{parts.join(', ')}"
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
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
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

  def parse_gemini_response(text)
    # Remove markdown code blocks if present
    cleaned = text.gsub(/```json\s*/i, "").gsub(/```\s*/, "").strip

    parsed = JSON.parse(cleaned)

    # Return structure matching Pin model fields
    {
      summary: parsed["summary"] || "Information about #{@place_name}.",
      links: normalize_links(parsed["links"] || {}),
      metadata: normalize_metadata(parsed["metadata"] || {})
    }
  rescue JSON::ParserError => e
    Rails.logger.error("SearchSummaryService JSON parse failed for #{@place_name}: #{e.message}")
    Rails.logger.error("Incomplete Gemini response (#{text.length} chars): #{text[0..200]}...")

    # Return fallback summary
    {
      summary: "Information about #{@place_name}. Please check search results for details.",
      links: extract_links_from_results,
      metadata: {}
    }
  end

  # Normalize links to match Pin.links structure: { website, tickets, menu, reviews }
  def normalize_links(links)
    {
      "website" => links["website"],
      "tickets" => links["tickets"],
      "menu" => links["menu"],
      "reviews" => links["reviews"]
    }.compact
  end

  # Normalize metadata to match Pin.metadata flexible structure
  def normalize_metadata(metadata)
    {
      "highlights" => metadata["highlights"] || [],
      "rating" => metadata["rating"],
      "price_range" => metadata["price_range"],
      "cuisine_type" => metadata["cuisine_type"],
      "recommended_dishes" => metadata["recommended_dishes"]
    }.compact
  end

  def extract_links_from_results
    # Fallback: extract links directly from search results
    links = {}
    
    @search_results[:results].each do |result|
      url = result[:link].to_s.downcase
      
      if url.include?("yelp.com") || url.include?("tripadvisor.com") || url.include?("google.com/maps")
        links["reviews"] ||= result[:link]
      elsif url.include?("menu")
        links["menu"] ||= result[:link]
      elsif url.include?("ticketmaster") || url.include?("stubhub") || url.include?("ticket")
        links["tickets"] ||= result[:link]
      else
        links["website"] ||= result[:link]
      end
    end
    
    links
  end
end
