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
    secret_key = ENV['CLERK_SECRET_KEY']

    unless secret_key
      Rails.logger.error("CLERK_SECRET_KEY not configured")
      raise Errors::AuthenticationError, "Authentication configuration error"
    end

    # Decode JWT token (Clerk uses HS256 for session tokens)
    decoded_token = JWT.decode(
      token,
      secret_key,
      true,
      { algorithm: 'HS256' }
    )

    # Extract Clerk user ID from 'sub' claim
    clerk_id = decoded_token.first['sub']

    unless clerk_id
      Rails.logger.error("Token missing 'sub' claim")
      raise Errors::AuthenticationError, "Invalid token format"
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
