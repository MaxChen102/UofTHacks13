# app/errors/api_error.rb
module Errors
  class ApiError < StandardError; end
  class WebhookError < ApiError; end
  class GeminiError < ApiError; end
  class SnowflakeError < ApiError; end
  class AuthenticationError < ApiError; end
  class NotFoundError < ApiError; end
  class ValidationError < ApiError; end
end
