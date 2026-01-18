require "json"
require "net/http"
require "uri"

class GooglePlacesLookupService
  SEARCH_URL = "https://places.googleapis.com/v1/places:searchText".freeze

  def initialize(query:)
    @query = query.to_s.strip
  end

  def call
    raise Errors::ValidationError, "Places query is required" if @query.empty?

    api_key = google_maps_api_key
    return nil if api_key.nil? || api_key.empty?

    response = post_search(api_key)
    parsed = JSON.parse(response.body)
    place = parsed.dig("places", 0)

    return nil unless place && place["id"]

    to_result(place)
  rescue JSON::ParserError => e
    raise Errors::ApiError, "Invalid Places response: #{e.message}"
  end

  private

  def google_maps_api_key
    ENV["GOOGLE_MAPS_API_KEY"] || ENV["NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"]
  end

  def post_search(api_key)
    uri = URI.parse(SEARCH_URL)
    request = Net::HTTP::Post.new(uri.request_uri)
    request["Content-Type"] = "application/json"
    request["X-Goog-Api-Key"] = api_key
    request["X-Goog-FieldMask"] = field_mask
    request.body = {
      textQuery: @query,
      maxResultCount: 1,
      languageCode: "en"
    }.to_json

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    response = http.request(request)

    unless response.is_a?(Net::HTTPSuccess)
      raise Errors::ApiError, "Places API error: #{response.code} - #{response.body}"
    end

    response
  end

  def field_mask
    [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.location",
      "places.rating",
      "places.userRatingCount",
      "places.websiteUri",
      "places.nationalPhoneNumber",
      "places.googleMapsUri"
    ].join(",")
  end

  def to_result(place)
    loc = place["location"] || {}

    {
      "place_id" => place["id"],
      "name" => place.dig("displayName", "text"),
      "formatted_address" => place["formattedAddress"],
      "lat" => loc["latitude"],
      "lng" => loc["longitude"],
      "rating" => place["rating"],
      "user_ratings_total" => place["userRatingCount"],
      "website" => place["websiteUri"],
      "phone_number" => place["nationalPhoneNumber"],
      "google_maps_url" => place["googleMapsUri"]
    }.compact
  end
end
