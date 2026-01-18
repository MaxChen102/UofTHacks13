# app/controllers/api/pins_controller.rb
module Api
  class PinsController < ApplicationController
    include Authenticatable

    before_action :set_pin, only: [ :show, :update, :destroy ]

  # POST /api/pins
  def create
    result = CreatePinService.new(current_user, pin_params).call

    if result.success?
      render json: result.data.as_json, status: :created
    else
      render json: { errors: result.errors }, status: :unprocessable_entity
    end
  end

    # GET /api/pins/:id
    def show
      render json: @pin.as_json, status: :ok
    end

    # GET /api/pins
    def index
      pins = current_user.pins.order(created_at: -1)

      # Filter by collection if provided
      if params[:collection_id].present?
        pins = pins.in_collection(BSON::ObjectId.from_string(params[:collection_id]))
      end

      render json: pins.as_json, status: :ok
    end

    # PATCH /api/pins/:id
    def update
      result = UpdatePinService.new(@pin, update_params, current_user).call

      if result.success?
        render json: result.data.as_json, status: :ok
      else
        render json: { errors: result.errors }, status: :unprocessable_entity
      end
    end

    # DELETE /api/pins/:id
    def destroy
      @pin.destroy
      Rails.logger.info("Pin deleted: #{@pin.id}")
      head :no_content
    end

    private

    def set_pin
      @pin = current_user.pins.find(params[:id])
    rescue Mongoid::Errors::DocumentNotFound
      Rails.logger.warn("Pin not found or unauthorized: #{params[:id]} for user #{current_user.email}")
      raise Errors::NotFoundError, "Pin not found"
    end

    def pin_params
      base = params.permit(:image_url, :collection_id)
      return base unless params[:pin].present?

      nested = params.require(:pin).permit(:image_url, :collection_id)
      base.merge(nested)
    rescue ActionController::ParameterMissing
      # Allow params without wrapping in 'pin' key for convenience
      params.permit(:image_url, :collection_id)
    end

    def update_params
      base = params.permit(:collection_id, :title, :summary)
      return base unless params[:pin].present?

      nested = params.require(:pin).permit(:collection_id, :title, :summary)
      base.merge(nested)
    rescue ActionController::ParameterMissing
      # Allow params without wrapping in 'pin' key for convenience
      params.permit(:collection_id, :title, :summary)
    end
  end
end
