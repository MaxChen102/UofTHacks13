Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # API routes
  namespace :api do
    # Resource endpoints
    resources :pins, only: [:create, :show, :index, :update, :destroy]
    resources :collections, only: [:create, :index, :update, :destroy]

    post "vision/ocr", to: "vision#ocr"
    post "vision/ocr_structure", to: "vision#ocr_structure"
    post "gemini/structure", to: "gemini#structure"

    # Webhook endpoints
    namespace :webhooks do
      post 'clerk', to: 'clerk#create'
    end
  end

  # Defines the root path route ("/")
  # root "posts#index"
end
