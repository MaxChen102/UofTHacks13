# app/models/pin.rb
class Pin
  include Mongoid::Document
  include Mongoid::Timestamps

  field :user_id, type: BSON::ObjectId
  field :collection_id, type: BSON::ObjectId
  field :pin_type, type: String # 'restaurant', 'concert', 'sports'
  field :title, type: String
  field :summary, type: String
  field :ai_recommendation, type: String # from Snowflake
  field :location, type: Hash # { address, lat, lng, place_id }
  field :datetime, type: DateTime # for events
  field :source_images, type: Array, default: [] # URLs from Uploadthing
  field :links, type: Hash, default: {} # { website, tickets, menu, reviews }
  field :metadata, type: Hash, default: {} # flexible for different pin types
  field :processing_status, type: String, default: 'pending' # 'pending', 'processing', 'complete', 'failed'

  belongs_to :user
  belongs_to :pin_collection, class_name: 'Collection', optional: true, foreign_key: 'collection_id'

  validates :user_id, presence: true
  validates :processing_status, inclusion: { in: %w[pending processing complete failed] }
  validates :pin_type, inclusion: { in: %w[restaurant concert sports event] }, allow_nil: true

  index({ user_id: 1, created_at: -1 })
  index({ processing_status: 1 })
  index({ collection_id: 1 })

  scope :completed, -> { where(processing_status: 'complete') }
  scope :for_user, ->(user_id) { where(user_id: user_id) }
  scope :in_collection, ->(collection_id) { where(collection_id: collection_id) }
end
