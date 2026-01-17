# app/models/collection.rb
class Collection
  include Mongoid::Document
  include Mongoid::Timestamps

  field :name, type: String
  field :description, type: String
  field :user_id, type: BSON::ObjectId

  belongs_to :user
  has_many :pins, dependent: :nullify, inverse_of: :pin_collection, foreign_key: 'collection_id'

  validates :name, presence: true
  validates :user_id, presence: true
  
  index({ user_id: 1, created_at: -1 })
end
