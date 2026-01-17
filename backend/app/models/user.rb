# app/models/user.rb
class User
  include Mongoid::Document
  include Mongoid::Timestamps

  field :clerk_id, type: String
  field :email, type: String
  field :name, type: String
  field :clerk_updated_at, type: Time  # Timestamp from Clerk API to track when user was last updated in Clerk

  has_many :collections, dependent: :destroy
  has_many :pins, dependent: :destroy

  index({ clerk_id: 1 }, { unique: true })

  validates :clerk_id, presence: true, uniqueness: true
  validates :email, presence: true
end
