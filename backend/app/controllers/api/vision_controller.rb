# app/controllers/api/vision_controller.rb
module Api
  class VisionController < ApplicationController
    def ocr
      text = VisionOcrService.new(
        image_base64: params[:image_base64]
      ).call

      render json: { text: text }
    end

    def ocr_structure
      result = VisionToGeminiService.new(
        image_base64: params[:image_base64],
        schema_hint: params[:schema_hint],
        entity_type: params[:entity_type]
      ).call

      render json: result
    end
  end
end
