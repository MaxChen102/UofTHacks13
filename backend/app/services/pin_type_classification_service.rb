class PinTypeClassificationService
  VALID_PIN_TYPES = %w[restaurant concert sports event].freeze
  MAX_EXTRACTED_TEXT_LENGTH = 800
  MAX_SEARCH_RESULTS_LENGTH = 1000

  def initialize(extracted_text:, structured_details:, search_results: nil, summary: nil)
    @extracted_text = extracted_text.to_s
    @structured_details = structured_details || {}
    @search_results = search_results
    @summary = summary.to_s.strip
  end

  def call
    return default_result if insufficient_data?

    classify_with_ai
  rescue StandardError => e
    Rails.logger.error("Classification error: #{e.message}")
    raise Errors::GeminiError, "Failed to classify pin type: #{e.message}"
  end

  private

  def insufficient_data?
    @extracted_text.strip.empty? && @structured_details.empty? && @summary.empty?
  end

  def default_result
    {
      pin_type: "restaurant",
      confidence: "low",
      reasoning: "Insufficient data for classification"
    }
  end

  def classify_with_ai
    prompt = build_classification_prompt
    response = call_gemini_api(prompt)
    parse_classification_response(response)
  end

  def build_classification_prompt
    truncated_text = @extracted_text.strip.first(MAX_EXTRACTED_TEXT_LENGTH)
    search_snippet = format_search_results
    summary_section = @summary.empty? ? "" : "\nAI-GENERATED SUMMARY:\n#{@summary.first(500)}\n"

    <<~PROMPT
      You are a classification assistant. Analyze the following data and classify this pin into ONE of these types:
      - restaurant (dining establishments, cafes, bars, food venues)
      - concert (music performances, tours, shows, festivals with musical acts)
      - sports (games, matches, sporting events, team events)
      - event (conferences, exhibitions, general events not fitting other categories)
      #{summary_section}
      EXTRACTED TEXT FROM IMAGE:
      #{truncated_text.empty? ? "[No text extracted]" : truncated_text}

      STRUCTURED DETAILS:
      Title: #{@structured_details["title"]}
      Address: #{@structured_details["address"]}
      Time: #{@structured_details["time"]}
      Extra Info: #{@structured_details["extra"]}

      #{search_snippet}

      CLASSIFICATION RULES:
      1. Prioritize schema.org structured data (@type markers like Restaurant, MusicEvent, SportsEvent)
      2. Look for explicit keywords:
         - Restaurant: menu, cuisine, dining, reservation, opentable, yelp
         - Concert: artist, tour, tickets, venue, ticketmaster, music, performance
         - Sports: game, match, team names, stadium, league, score
         - Event: conference, expo, festival (non-music), convention
      3. Consider URL patterns:
         - ticketmaster.com, livenation.com → likely concert
         - opentable.com, resy.com → restaurant
         - espn.com, mlb.com, nba.com → sports
      4. Date prominence: Events/concerts emphasize dates; restaurants don't
      5. If ambiguous, default to restaurant

      Respond with ONLY valid JSON in this exact format:
      {
        "pin_type": "restaurant|concert|sports|event",
        "confidence": "high|medium|low",
        "reasoning": "Brief explanation of classification decision"
      }
    PROMPT
  end

  def format_search_results
    return "" unless @search_results.is_a?(Hash)

    results = @search_results[:results] || []
    return "" if results.empty?

    snippets = results.first(3).map do |result|
      snippet = result[:snippet].to_s.first(250)
      schema_type = extract_schema_type(result)
      url = result[:link].to_s

      "- #{snippet}\n  URL: #{url}#{schema_type}"
    end.join("\n")

    truncated = snippets.first(MAX_SEARCH_RESULTS_LENGTH)

    <<~SEARCH
      WEB SEARCH RESULTS:
      #{truncated}
    SEARCH
  end

  def extract_schema_type(result)
    pagemap = result[:pagemap] || {}

    # Check for schema.org types from GoogleSearchService pagemap
    if pagemap[:local_business] || pagemap[:restaurant]
      return " [schema: LocalBusiness/Restaurant]"
    elsif pagemap[:event]
      # Event schema data would be in the pagemap
      return " [schema: Event]"
    end

    # Check metatags for additional schema hints
    metatags = pagemap[:metatags] || {}
    og_type = metatags["og:type"].to_s

    return " [schema: MusicEvent]" if og_type.include?("music") || og_type.include?("event")
    return " [schema: SportsEvent]" if og_type.include?("sports")

    ""
  end

  def call_gemini_api(prompt)
    uri = URI("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=#{ENV['GEMINI_API_KEY']}")

    request_body = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.2,
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

  def parse_classification_response(response)
    content = response.dig("candidates", 0, "content", "parts", 0, "text")

    unless content
      Rails.logger.warn("Empty response from Gemini API")
      return default_result
    end

    result = JSON.parse(content)

    # Validate and normalize
    pin_type = result["pin_type"].to_s.downcase
    unless VALID_PIN_TYPES.include?(pin_type)
      Rails.logger.warn("Invalid pin_type '#{pin_type}', defaulting to restaurant")
      pin_type = "restaurant"
    end

    {
      pin_type: pin_type,
      confidence: result["confidence"].to_s.downcase,
      reasoning: result["reasoning"].to_s
    }
  rescue JSON::ParserError => e
    Rails.logger.error("Failed to parse Gemini response: #{e.message}")
    default_result
  end
end
