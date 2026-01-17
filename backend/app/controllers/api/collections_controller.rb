# app/controllers/api/collections_controller.rb
module Api
  class CollectionsController < ApplicationController
    include Authenticatable

    before_action :set_collection, only: [:update, :destroy]

    # POST /api/collections
    def create
      collection = current_user.collections.build(collection_params)

      if collection.save
        Rails.logger.info("Collection created: #{collection.id} for user #{current_user.email}")
        render json: collection.as_json, status: :created
      else
        Rails.logger.warn("Collection creation failed: #{collection.errors.full_messages.join(', ')}")
        render json: { errors: collection.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # GET /api/collections
    def index
      collections = current_user.collections.order(created_at: -1)
      render json: collections.as_json, status: :ok
    end

    # PATCH /api/collections/:id
    def update
      if @collection.update(collection_params)
        Rails.logger.info("Collection updated: #{@collection.id}")
        render json: @collection.as_json, status: :ok
      else
        Rails.logger.warn("Collection update failed: #{@collection.errors.full_messages.join(', ')}")
        render json: { errors: @collection.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/collections/:id
    def destroy
      @collection.destroy
      Rails.logger.info("Collection deleted: #{@collection.id}")
      head :no_content
    end

    private

    def set_collection
      @collection = current_user.collections.find(params[:id])
    rescue Mongoid::Errors::DocumentNotFound
      Rails.logger.warn("Collection not found or unauthorized: #{params[:id]} for user #{current_user.email}")
      raise Errors::NotFoundError, "Collection not found"
    end

    def collection_params
      params.require(:collection).permit(:name, :description)
    rescue ActionController::ParameterMissing
      # Allow params without wrapping in 'collection' key for convenience
      params.permit(:name, :description)
    end
  end
end
