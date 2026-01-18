# app/services/google_search_service.rb
require "net/http"
require "json"

class GoogleSearchService
  BASE_URL = "https://www.googleapis.com/customsearch/v1"

  def initialize(query:, num_results: 5)
    @query = query.to_s.strip
    @num_results = [num_results.to_i, 10].min # API max is 10
  end

  def call
    raise Errors::ValidationError, "query is required" if @query.empty?

    api_key = ENV["GOOGLE_CUSTOM_SEARCH_API_KEY"]
    search_engine_id = ENV["GOOGLE_CUSTOM_SEARCH_ENGINE_ID"]

    raise Errors::GoogleSearchError, "GOOGLE_CUSTOM_SEARCH_API_KEY not set" if api_key.nil? || api_key.empty?
    raise Errors::GoogleSearchError, "GOOGLE_CUSTOM_SEARCH_ENGINE_ID not set" if search_engine_id.nil? || search_engine_id.empty?

    response = perform_search(api_key, search_engine_id)
    parse_results(response)
  end

  # Convenience method to search for a restaurant
  def self.search_restaurant(name:, location: nil)
    query = location.present? ? "#{name} #{location} restaurant" : "#{name} restaurant"
    new(query: query).call
  end

  private

  def perform_search(api_key, search_engine_id)
    uri = build_uri(api_key, search_engine_id)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Get.new(uri.request_uri)
    response = http.request(request)

    unless response.is_a?(Net::HTTPSuccess)
      error_message = parse_error_message(response.body) || "#{response.code} - #{response.body}"
      raise Errors::GoogleSearchError, "Google Search API error: #{error_message}"
    end

    JSON.parse(response.body)
  rescue JSON::ParserError => e
    raise Errors::GoogleSearchError, "Invalid Google Search response: #{e.message}"
  end

  def build_uri(api_key, search_engine_id)
    params = {
      key: api_key,
      cx: search_engine_id,
      q: @query,
      num: @num_results
    }
    URI.parse("#{BASE_URL}?#{URI.encode_www_form(params)}")
  end

  def parse_results(response)
    items = response["items"] || []

    {
      total_results: response.dig("searchInformation", "totalResults").to_i,
      search_time: response.dig("searchInformation", "searchTime"),
      results: items.map { |item| parse_item(item) }
    }
  end

  def parse_item(item)
    {
      title: item["title"],
      link: item["link"],
      snippet: item["snippet"],
      display_link: item["displayLink"],
      # Additional metadata if available
      pagemap: extract_pagemap(item["pagemap"])
    }
  end

  def extract_pagemap(pagemap)
    return nil if pagemap.nil?

    # Extract useful structured data if present
    {
      metatags: pagemap["metatags"]&.first,
      # LocalBusiness schema data (common for restaurants)
      local_business: pagemap["localbusiness"]&.first,
      # Restaurant schema data
      restaurant: pagemap["restaurant"]&.first,
      # Review data
      review: pagemap["review"]&.first,
      # Rating data
      aggregaterating: pagemap["aggregaterating"]&.first
    }.compact
  end

  def parse_error_message(body)
    parsed = JSON.parse(body)
    parsed.dig("error", "message")
  rescue JSON::ParserError
    nil
  end
end
