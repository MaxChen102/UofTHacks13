# 🍽️ Pin-It Hackathon Software Spec

## 🎯 Project Overview

**Name**: Pin-It
**Duration**: 2 days
**Team**: 4 full-stack engineers
**MVP**: Restaurant pins from screenshots

---

## 🏗️ Tech Stack

### Backend

- **Rails 7** (API mode) + **MongoDB** (mongoid gem)
- **Gemini Vision API** - Screenshot OCR & entity extraction
- **Gemini Flash 1.5** - Query generation & summarization
- **Google Custom Search API** - Web search (100/day free)
- **Snowflake Cortex AI (Arctic LLM)** - Enhanced recommendations
- **Uploadthing** - Image storage
- **Clerk** - Authentication (webhook to Rails)

### Frontend

- **Next.js 14** (App Router)
- **Clerk** - Auth UI
- **TailwindCSS** - Styling
- **Google Maps Embed API** - Location display

### Hosting

- **Vultr** - Rails API + Next.js app

---

## 📊 Data Models (MongoDB)

### User

```ruby
# app/models/user.rb
class User
  include Mongoid::Document
  include Mongoid::Timestamps

  field :clerk_id, type: String
  field :email, type: String
  field :name, type: String

  has_many :collections
  has_many :pins

  index({ clerk_id: 1 }, { unique: true })
end
```

### Collection

```ruby
# app/models/collection.rb
class Collection
  include Mongoid::Document
  include Mongoid::Timestamps

  field :name, type: String
  field :description, type: String
  field :user_id, type: BSON::ObjectId

  belongs_to :user
  has_many :pins
end
```

### Pin

```ruby
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
  field :source_images, type: Array # URLs from Uploadthing
  field :links, type: Hash # { website, tickets, menu, reviews }
  field :metadata, type: Hash # flexible for different pin types
  field :processing_status, type: String # 'processing', 'complete', 'failed'

  belongs_to :user
  belongs_to :collection, optional: true

  index({ user_id: 1, created_at: -1 })
end
```

---

## 🔄 Agent Workflow (Restaurant MVP)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User uploads screenshot via Next.js                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend: Upload to Uploadthing, get URL                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. POST /api/pins with image URL                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Rails: Create Pin with status='processing'               │
│    Return pin_id immediately to frontend                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Background Job: PinProcessorJob                          │
│    ├─ Gemini Vision: Extract text from screenshot           │
│    ├─ Gemini Flash: Identify it's a restaurant + extract:   │
│    │   • Restaurant name                                    │
│    │   • Address/location hints                             │
│    │   • Cuisine type                                       │
│    ├─ Google Custom Search API:                             │
│    │   Query: "{restaurant_name} {location} restaurant"     │
│    │   Extract: website, reviews link, phone, hours         │
│    ├─ Gemini Flash: Summarize search results                │
│    ├─ Snowflake Arctic: Generate AI recommendation          │
│    │   Prompt: "Why would someone enjoy {restaurant}        │
│    │            based on {summary}?"                        │
│    └─ Update Pin: status='complete', save all data          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Frontend: Poll GET /api/pins/:id until complete          │
│    Display pin with all details                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛣️ API Endpoints

### Authentication (Clerk Webhook)

```
POST /api/webhooks/clerk
- Syncs Clerk user to MongoDB User model
```

### Pins

```
POST /api/pins
Body: {
  image_url: string,
  collection_id?: string (optional)
}
Response: { id, status: 'processing' }

GET /api/pins/:id
Response: Full pin object

GET /api/pins
Query: ?collection_id=xxx (optional)
Response: Array of pins

PATCH /api/pins/:id
Body: { collection_id, title, summary }
Response: Updated pin

DELETE /api/pins/:id
```

### Collections

```
POST /api/collections
Body: { name, description }

GET /api/collections
Response: Array of user's collections

PATCH /api/collections/:id
Body: { name, description }

DELETE /api/collections/:id
```

---

## 🤖 Service Classes (Rails)

### GeminiVisionService

```ruby
# app/services/gemini_vision_service.rb
class GeminiVisionService
  def extract_from_screenshot(image_url)
    # Call Gemini Vision API
    # Return: { text, entities }
  end
end
```

### GeminiAgentService

```ruby
# app/services/gemini_agent_service.rb
class GeminiAgentService
  def identify_pin_type(extracted_data)
    # Prompt: "Is this a restaurant, concert, or sports event?"
    # Return: 'restaurant'
  end

  def extract_restaurant_details(extracted_data)
    # Prompt: "Extract: name, address, cuisine from this text"
    # Return: { name, address, cuisine }
  end

  def generate_summary(search_results)
    # Summarize web search findings
  end
end
```

### GoogleSearchService

```ruby
# app/services/google_search_service.rb
class GoogleSearchService
  def search_restaurant(name, location)
    # Google Custom Search API call
    # Return top 5 results with titles, snippets, links
  end
end
```

### SnowflakeService

```ruby
# app/services/snowflake_service.rb
class SnowflakeService
  def generate_recommendation(restaurant_summary)
    # Call Snowflake Cortex AI (Arctic LLM)
    # Prompt: "Based on this restaurant: {summary},
    #          generate a personalized 2-sentence recommendation"
    # Return: AI-generated recommendation string
  end
end
```

### PinProcessorJob

```ruby
# app/jobs/pin_processor_job.rb
class PinProcessorJob < ApplicationJob
  def perform(pin_id)
    pin = Pin.find(pin_id)

    # Step 1: Vision extraction
    extracted = GeminiVisionService.new.extract_from_screenshot(pin.source_images.first)

    # Step 2: Identify type & extract details
    agent = GeminiAgentService.new
    details = agent.extract_restaurant_details(extracted)

    # Step 3: Web search
    search_results = GoogleSearchService.new.search_restaurant(
      details[:name],
      details[:address]
    )

    # Step 4: Summarize
    summary = agent.generate_summary(search_results)

    # Step 5: Snowflake recommendation
    recommendation = SnowflakeService.new.generate_recommendation(summary)

    # Step 6: Update pin
    pin.update!(
      pin_type: 'restaurant',
      title: details[:name],
      summary: summary,
      ai_recommendation: recommendation,
      location: geocode(details[:address]),
      links: extract_links(search_results),
      metadata: { cuisine: details[:cuisine] },
      processing_status: 'complete'
    )
  rescue => e
    pin.update!(processing_status: 'failed')
    raise e
  end
end
```

---

## 🎨 Frontend Pages (Next.js)

### `/` - Home/Dashboard

- Display all user's pins in grid
- "Upload New Pin" button
- Filter by collection dropdown

### `/upload` - Upload Screenshot

- Drag & drop or file picker
- Preview uploaded image
- Submit → Show loading state
- Redirect to `/pins/:id` when processing complete

### `/pins/:id` - Pin Detail View

```tsx
<PinDetail>
  <SourceImage src={pin.source_images[0]} />
  <Title>{pin.title}</Title>
  <Summary>{pin.summary}</Summary>
  <AIRecommendation>{pin.ai_recommendation}</AIRecommendation>

  <Location>
    <GoogleMapEmbed lat={pin.location.lat} lng={pin.location.lng} />
    <Address>{pin.location.address}</Address>
  </Location>

  <Links>
    {pin.links.website && <Link>Visit Website</Link>}
    {pin.links.reviews && <Link>Read Reviews</Link>}
    {pin.links.menu && <Link>View Menu</Link>}
  </Links>

  <CollectionSelector
    currentCollection={pin.collection_id}
    onUpdate={handleCollectionChange}
  />
</PinDetail>
```

### `/collections` - Collections Manager

- List all collections
- Create new collection
- Edit/delete collections
- Click collection → filter pins view

---

## 📅 2-Day Development Plan

### **Day 1: Restaurant MVP** (16 hours)

#### Engineer 1: Backend Core + MongoDB

- [ ] Rails 7 API setup with mongoid (2h)
- [ ] User, Pin, Collection models (1h)
- [ ] Clerk webhook integration (1h)
- [ ] Basic CRUD endpoints (2h)

#### Engineer 2: AI Agent Pipeline

- [ ] GeminiVisionService (2h)
- [ ] GeminiAgentService (2h)
- [ ] GoogleSearchService (1.5h)
- [ ] SnowflakeService (1.5h)
- [ ] PinProcessorJob (1h)

#### Engineer 3: Frontend Core

- [ ] Next.js + Clerk setup (1.5h)
- [ ] Upload page with Uploadthing (2h)
- [ ] Pin detail page (2.5h)
- [ ] Home/dashboard (2h)

#### Engineer 4: Frontend Polish + Integration

- [ ] Collections UI (2h)
- [ ] Google Maps integration (1.5h)
- [ ] API integration layer (2h)
- [ ] Polling logic for processing status (1.5h)

#### End of Day 1 Checkpoint

✅ Upload restaurant screenshot → Auto-generate pin with details, summary, recommendation, map

---

### **Day 2: Expand + Polish** (16 hours)

#### Morning (4h): Expand to Concerts & Sports

**Engineer 1 + 2**: Backend Extensions

- [ ] Concert pin type logic (2h)
    - Extract: Artist, venue, date/time
    - Search: Ticketmaster API integration
    - Links: Ticket purchase, artist info
- [ ] Sports pin type logic (2h)
    - Extract: Teams, game details
    - Links: ESPN/score updates

**Engineer 3 + 4**: Frontend Extensions

- [ ] Pin type-specific layouts (2h)
- [ ] Concert/sports metadata display (2h)

#### Afternoon (4h): Polish & Testing

**All Engineers**:

- [ ] Error handling & loading states (1h)
- [ ] Responsive design (1h)
- [ ] Demo data seeding (0.5h)
- [ ] End-to-end testing (1.5h)

#### Final 4h: Demo Prep

- [ ] Vultr deployment (Rails + Next.js) (2h)
- [ ] Demo script creation (0.5h)
- [ ] Video recording backup (0.5h)
- [ ] Buffer for bugs (1h)

---

## 🔑 Environment Variables

### Rails (.env)

```bash
MONGODB_URI=
CLERK_SECRET_KEY=
GEMINI_API_KEY=
GOOGLE_CUSTOM_SEARCH_API_KEY=
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=
SNOWFLAKE_ACCOUNT=
SNOWFLAKE_USER=
SNOWFLAKE_PASSWORD=
UPLOADTHING_SECRET=
```

### Next.js (.env.local)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3001
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
GOOGLE_MAPS_API_KEY=
```

---

## 🎯 Success Metrics for Demo

1. ✅ Upload restaurant screenshot → Full pin in <30 seconds
2. ✅ Shows all 3 sponsors working: Gemini (vision+summary), Snowflake (recommendation), MongoDB (data)
3. ✅ Clean UI with Google Maps embed
4. ✅ Collections working (create, assign pins)
5. ✅ Bonus: 1-2 concert/sports examples

---

## ⚠️ Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| API rate limits hit | Pre-generate 10 demo pins with cached data |
| Snowflake integration slow | Make it async, show loading state |
| Gemini Vision fails | Fallback: manual text input mode |
| Vultr deployment issues | Have Vercel backup ready |

---

## 🚀 Post-Hackathon Extensions

- Browser extension for one-click screenshots
- Mobile app (React Native)
- Collaborative collections
- AI-powered "similar pins" recommendations using Snowflake analytics

---

## 📝 Notes

- MongoDB Atlas free tier (M0) is sufficient for hackathon
- Use Sidekiq for background jobs in Rails (simpler than ActiveJob alternatives)
- Next.js polling: Use SWR with `refreshInterval` for auto-updates
- Google Maps Embed API is free (unlike Maps JavaScript API)
- Pre-create Google Custom Search Engine ID before hackathon starts

---

## 🔗 Useful Links

- [Gemini API Docs](https://ai.google.dev/docs)
- [Google Custom Search JSON API](https://developers.google.com/custom-search/v1/overview)
- [Snowflake Cortex AI](https://docs.snowflake.com/en/user-guide/ml-powered-functions)
- [Mongoid (Rails MongoDB ODM)](https://www.mongodb.com/docs/mongoid/current/)
- [Clerk Rails Integration](https://clerk.com/docs/quickstarts/ruby-on-rails)
- [Uploadthing Docs](https://docs.uploadthing.com/)

---

**Good luck! 🚀**
