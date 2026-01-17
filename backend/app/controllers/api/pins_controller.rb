# app/controllers/api/pins_controller.rb
module Api
  class PinsController < ApplicationController
    include Authenticatable

    before_action :set_pin, only: [:show, :update, :destroy]

    # POST /api/pins
    def create
      # Validate collection ownership if provided
      if pin_params[:collection_id].present?
        collection = current_user.collections.find(pin_params[:collection_id])
        unless collection
          render json: { error: "Collection not found or does not belong to user" }, status: :not_found
          return
        end
      end

      pin = current_user.pins.build(pin_params)
      pin.processing_status = 'processing'

      if pin.save
        Rails.logger.info("Pin created: #{pin.id} for user #{current_user.email}")
        render json: pin.as_json, status: :created
      else
        Rails.logger.warn("Pin creation failed: #{pin.errors.full_messages.join(', ')}")
        render json: { errors: pin.errors.full_messages }, status: :unprocessable_entity
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
      # Validate collection ownership if changing collection
      if update_params[:collection_id].present?
        collection = current_user.collections.find(update_params[:collection_id])
        unless collection
          render json: { error: "Collection not found or does not belong to user" }, status: :not_found
          return
        end
      end

      if @pin.update(update_params)
        Rails.logger.info("Pin updated: #{@pin.id}")
        render json: @pin.as_json, status: :ok
      else
        Rails.logger.warn("Pin update failed: #{@pin.errors.full_messages.join(', ')}")
        render json: { errors: @pin.errors.full_messages }, status: :unprocessable_entity
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
      params.require(:pin).permit(:image_url, :collection_id)
    rescue ActionController::ParameterMissing
      # Allow params without wrapping in 'pin' key for convenience
      params.permit(:image_url, :collection_id)
    end

    def update_params
      params.require(:pin).permit(:collection_id, :title, :summary)
    rescue ActionController::ParameterMissing
      # Allow params without wrapping in 'pin' key for convenience
      params.permit(:collection_id, :title, :summary)
    end
  end
end
