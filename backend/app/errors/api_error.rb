# app/errors/api_error.rb
module Errors
  class ApiError < StandardError; end
  class WebhookError < ApiError; end
  class GeminiError < ApiError; end
  class SnowflakeError < ApiError; end
end
