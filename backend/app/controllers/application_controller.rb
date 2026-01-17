class ApplicationController < ActionController::API
  # Global error handlers
  rescue_from Mongoid::Errors::DocumentNotFound, with: :handle_not_found
  rescue_from Mongoid::Errors::Validations, with: :handle_validation_error
  rescue_from Errors::AuthenticationError, with: :handle_authentication_error
  rescue_from Errors::NotFoundError, with: :handle_not_found
  rescue_from Errors::ValidationError, with: :handle_validation_error
  rescue_from StandardError, with: :handle_internal_error

  private

  def handle_not_found(exception)
    Rails.logger.warn("Not found: #{exception.message}")
    render json: { error: "Resource not found" }, status: :not_found
  end

  def handle_validation_error(exception)
    Rails.logger.warn("Validation error: #{exception.message}")

    # Extract error messages
    errors = if exception.respond_to?(:record) && exception.record.respond_to?(:errors)
               exception.record.errors.full_messages
             else
               [exception.message]
             end

    render json: { errors: errors }, status: :unprocessable_entity
  end

  def handle_authentication_error(exception)
    Rails.logger.warn("Authentication error: #{exception.message}")
    render json: { error: exception.message }, status: :unauthorized
  end

  def handle_internal_error(exception)
    Rails.logger.error("Internal error: #{exception.message}")
    Rails.logger.error(exception.backtrace.join("\n"))

    # Don't expose internal error details in production
    error_message = Rails.env.production? ? "Internal server error" : exception.message
    render json: { error: error_message }, status: :internal_server_error
  end
end
