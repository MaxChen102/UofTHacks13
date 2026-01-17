# app/controllers/api/vision_controller.rb
module Api
  class VisionController < ApplicationController
    def ocr
      text = VisionOcrService.new(
        image_base64: params[:image_base64]
      ).call

      render json: { text: text }
    end
  end
end
