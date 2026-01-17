# app/controllers/api/gemini_controller.rb
module Api
  class GeminiController < ApplicationController
    def structure
      text = params[:text]
      schema_hint = params[:schema_hint]
      entity_type = params[:entity_type]

      json_text = GeminiStructuredTextService.new(
        text: text,
        schema_hint: schema_hint,
        entity_type: entity_type
      ).call

      render json: { json_text: json_text }
    end
  end
end
