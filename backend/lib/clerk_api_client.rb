# lib/clerk_api_client.rb
require 'net/http'
require 'json'
require 'openssl'

class ClerkApiClient
  BASE_URL = 'https://api.clerk.com/v1'
  TIMEOUT = 10 # seconds

  def initialize(secret_key: ENV['CLERK_SECRET_KEY'])
    @secret_key = secret_key
    raise ArgumentError, 'CLERK_SECRET_KEY is required' if @secret_key.nil? || @secret_key.empty?
  end

  # Fetch a single user by Clerk ID
  # @param clerk_id [String] The Clerk user ID (e.g., "user_2abc123def")
  # @return [Hash] Parsed JSON response from Clerk API
  # @raise [Errors::NotFoundError] If user not found (404)
  # @raise [Errors::AuthenticationError] If authentication fails (401/403)
  # @raise [Errors::ApiError] For other API errors
  def get_user(clerk_id)
    uri = URI("#{BASE_URL}/users/#{clerk_id}")
    request = Net::HTTP::Get.new(uri)
    execute_request(uri, request)
  end

  # List all users with pagination
  # @param limit [Integer] Number of users per page (max 500)
  # @param offset [Integer] Pagination offset
  # @return [Array<Hash>] Array of user objects
  # @raise [Errors::ApiError] For API errors
  def list_users(limit: 100, offset: 0)
    uri = URI("#{BASE_URL}/users")
    uri.query = URI.encode_www_form(limit: limit, offset: offset)
    request = Net::HTTP::Get.new(uri)
    execute_request(uri, request)
  end

  private

  def execute_request(uri, request)
    request['Authorization'] = "Bearer #{@secret_key}"
    request['Content-Type'] = 'application/json'

    response = Net::HTTP.start(uri.hostname, uri.port,
                                use_ssl: true,
                                read_timeout: TIMEOUT,
                                verify_mode: OpenSSL::SSL::VERIFY_NONE) do |http|
      http.request(request)
    end

    handle_response(response)
  rescue Net::OpenTimeout, Net::ReadTimeout => e
    raise Errors::ApiError, "Clerk API request timeout: #{e.message}"
  rescue StandardError => e
    raise Errors::ApiError, "Clerk API request failed: #{e.message}"
  end

  def handle_response(response)
    case response.code.to_i
    when 200
      JSON.parse(response.body)
    when 404
      raise Errors::NotFoundError, "User not found in Clerk"
    when 401, 403
      raise Errors::AuthenticationError, "Clerk API authentication failed (check CLERK_SECRET_KEY)"
    when 429
      raise Errors::ApiError, "Clerk API rate limit exceeded"
    else
      raise Errors::ApiError, "Clerk API error (#{response.code}): #{response.body}"
    end
  end
end
