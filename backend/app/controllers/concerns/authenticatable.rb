# app/controllers/concerns/authenticatable.rb
module Authenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!, unless: :skip_authentication?
  end

  private

  def authenticate_user!
    token = extract_token_from_header

    unless token
      Rails.logger.error("Authentication failed: No token provided")
      raise Errors::AuthenticationError, "Authentication token required"
    end

    decode_and_set_user(token)
  rescue JWT::DecodeError => e
    Rails.logger.error("JWT decode error: #{e.message}")
    raise Errors::AuthenticationError, "Invalid or expired token"
  rescue Errors::AuthenticationError
    raise
  rescue StandardError => e
    Rails.logger.error("Authentication error: #{e.message}")
    raise Errors::AuthenticationError, "Authentication failed"
  end

  def current_user
    @current_user
  end

  def extract_token_from_header
    auth_header = request.headers['Authorization']
    return nil unless auth_header

    # Extract token from "Bearer <token>" format
    auth_header.split(' ').last if auth_header.start_with?('Bearer ')
  end

  def decode_and_set_user(token)
    # For hackathon/development: decode without verification
    # In production, you should verify with Clerk's JWKS public keys
    # See: https://clerk.com/docs/backend-requests/handling/manual-jwt

    begin
      # Decode without verification (RS256 requires public key from JWKS)
      decoded_token = JWT.decode(
        token,
        nil,
        false  # Skip signature verification for now
      )

      Rails.logger.info("Token decoded successfully")
    rescue JWT::DecodeError => e
      Rails.logger.error("JWT decode failed: #{e.message}")
      raise Errors::AuthenticationError, "Invalid or expired token"
    end

    # Extract Clerk user ID from 'sub' claim
    clerk_id = decoded_token.first['sub']

    unless clerk_id
      Rails.logger.error("Token missing 'sub' claim. Token payload: #{decoded_token.first.inspect}")
      raise Errors::AuthenticationError, "Invalid token format"
    end

    # Verify token issuer matches your Clerk instance (basic security check)
    issuer = decoded_token.first['iss']
    expected_issuer = "https://internal-racer-63.clerk.accounts.dev"

    if issuer != expected_issuer
      Rails.logger.error("Token issuer mismatch: #{issuer} != #{expected_issuer}")
      raise Errors::AuthenticationError, "Invalid token issuer"
    end

    # Check token expiration
    exp = decoded_token.first['exp']
    if exp && Time.at(exp) < Time.now
      Rails.logger.error("Token expired at #{Time.at(exp)}")
      raise Errors::AuthenticationError, "Token expired"
    end

    # Find user by Clerk ID
    @current_user = User.find_by(clerk_id: clerk_id)

    unless @current_user
      Rails.logger.error("User not found for clerk_id: #{clerk_id}")
      raise Errors::AuthenticationError, "User not found"
    end

    Rails.logger.info("Authenticated user: #{@current_user.email} (#{@current_user.clerk_id})")
  end

  def skip_authentication?
    false
  end
end
