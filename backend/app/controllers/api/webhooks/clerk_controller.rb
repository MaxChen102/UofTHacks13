# app/controllers/api/webhooks/clerk_controller.rb
module Api
  module Webhooks
    class ClerkController < ApplicationController
      include WebhookAuthenticatable

      def create
        # Parse the webhook payload
        event_type = params['type']
        event_data = params['data']

        unless event_type && event_data
          Rails.logger.error("Webhook missing type or data")
          render json: { received: true }, status: :ok
          return
        end

        # Process the webhook event
        result = ClerkWebhookService.new(event_type, event_data).call

        if result.success?
          Rails.logger.info("Webhook processed successfully: #{event_type}")
        else
          Rails.logger.error("Webhook processing failed: #{result.errors.join(', ')}")
        end

        # Always return 200 OK to prevent Clerk from retrying
        # Errors are logged but we don't want Clerk to retry on our application errors
        render json: { received: true }, status: :ok
      rescue StandardError => e
        # Log unexpected errors but still return 200 OK
        Rails.logger.error("Unexpected webhook error: #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))
        render json: { received: true }, status: :ok
      end
    end
  end
end
