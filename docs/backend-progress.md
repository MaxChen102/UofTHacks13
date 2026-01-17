# Pin-It Backend Development Progress

**Date**: January 17, 2026
**Status**: Day 1 - Backend Core Setup Complete (Steps 1-3 of 4)

---

## Completed Steps

### Step 1: Rails 7 API Setup with MongoDB (~2h) ✓

**What was done:**

- Installed Ruby 3.2.2 via rbenv
- Created Rails 7.1.6 API application (API-only mode, no ActiveRecord)
- Installed and configured required gems:
    - `mongoid` (8.1.11) - MongoDB ODM
    - `sidekiq` (7.3.9) - Background job processing
    - `jwt` (3.1.2) - JWT token handling for Clerk auth
    - `rack-cors` (3.0.0) - CORS support for frontend
    - `dotenv-rails` (3.2.0) - Environment variable management
- Generated Mongoid configuration (`config/mongoid.yml`)
- Set up local MongoDB Community Edition 8.0
- Created `.env` file with environment variables
- Verified Rails server runs successfully on `http://127.0.0.1:3000`

**Key Files:**

- `backend/Gemfile` - Dependencies configured for Rails 7.1
- `backend/config/mongoid.yml` - MongoDB connection config (dev/test/production)
- `backend/config/application.rb` - Rails 7.1 configuration
- `backend/.env` - Environment variables (gitignored)

### Step 2: Create Data Models (~1h) ✓

**What was done:**

- Created User model (`app/models/user.rb`)
    - Fields: `clerk_id`, `email`, `name`
    - Relationships: `has_many :collections`, `has_many :pins`
    - Unique index on `clerk_id`

- Created Collection model (`app/models/collection.rb`)
    - Fields: `name`, `description`, `user_id`
    - Relationships: `belongs_to :user`, `has_many :pins`
    - Index on `user_id + created_at`

- Created Pin model (`app/models/pin.rb`)
    - Fields: `user_id`, `collection_id`, `pin_type`, `title`, `summary`, `ai_recommendation`, `location`, `datetime`, `source_images`, `links`, `metadata`, `processing_status`
    - Relationships: `belongs_to :user`, `belongs_to :pin_collection` (Collection)
    - Multiple indexes for query optimization
    - Scopes: `completed`, `for_user`, `in_collection`

- Tested all models successfully with Rails runner
- Fixed Mongoid naming conflict (collection → pin_collection)

**Key Files:**

- `backend/app/models/user.rb`
- `backend/app/models/collection.rb`
- `backend/app/models/pin.rb`

### Step 3: Clerk Webhook Integration (~1h) ✓

**What was done:**

- Created webhook authentication concern with Svix signature verification
- Created `ClerkWebhookService` to handle user events
- Implemented webhook controller at `POST /api/webhooks/clerk`
- Added support for `user.created`, `user.updated`, `user.deleted` events
- Configured routes and error handling
- Created `Result` pattern for service responses
- Created custom error classes (`Errors::WebhookError`)
- Configured environment for webhook secret and MongoDB Atlas
- Set up ngrok host allowlist for webhook testing
- Tested successfully with Clerk webhook events
- Documented Clerk dashboard webhook setup (ngrok URL + user events)

**Key Files:**

- `backend/app/controllers/api/webhooks/clerk_controller.rb`
- `backend/app/controllers/concerns/webhook_authenticatable.rb`
- `backend/app/services/clerk_webhook_service.rb`
- `backend/app/services/concerns/result.rb`
- `backend/app/errors/api_error.rb`
- `backend/config/routes.rb` (updated with webhook route)
- `backend/config/environments/development.rb` (ngrok hosts allowed)
- `backend/config/environments/production.rb` (ALLOWED_HOSTS support)

**Environment Variables Added:**

- `CLERK_WEBHOOK_SECRET` - Webhook signing secret (starts with `whsec_`)
- `ALLOWED_HOSTS` - Configurable allowed hosts for production
- `MONGODB_URI` - Updated to use MongoDB Atlas with database name

### Clerk Webhook Dashboard Setup

1. Start ngrok for the backend (example):
   - `ngrok http 3000`
2. In Clerk Dashboard → Webhooks → Add Endpoint:
   - **Endpoint URL**: `https://<your-ngrok-subdomain>.ngrok-free.app/api/webhooks/clerk`
   - **Events**: subscribe to all user events:
     - `user.created`
     - `user.updated`
     - `user.deleted`
3. Copy the webhook signing secret from Clerk and set:
   - `CLERK_WEBHOOK_SECRET=whsec_...` in `backend/.env`

---

## 🚧 Current State

### Services Running

- ✅ MongoDB Atlas: `pin-it-cluster` (cloud database)
- ✅ Rails app ready to start: `cd backend && rails server`
- ✅ Webhook endpoint: `POST /api/webhooks/clerk` (tested with ngrok)

### Environment Setup

```bash
# backend/.env (configured)
MONGODB_URI=mongodb+srv://dbuser:***@pin-it-cluster.w5el2rl.mongodb.net/pin_it_production?retryWrites=true&w=majority
CLERK_SECRET_KEY=sk_test_*** (API calls to Clerk)
CLERK_WEBHOOK_SECRET=whsec_*** (webhook signature verification)
GEMINI_API_KEY=*** (configured)
GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_search_api_key_here
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id_here
SNOWFLAKE_ACCOUNT=ymeuuxx-vm37601
SNOWFLAKE_USER=racheldeng
SNOWFLAKE_PRIVATE_KEY_PATH=../snowflake_key.p8
UPLOADTHING_TOKEN=*** (configured)
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=yourapp.com,api.yourapp.com (for production)
```

### Ruby/Rails Versions

- Ruby: 3.2.2 (via rbenv)
- Rails: 7.1.6
- MongoDB: 8.0.18

---

## ⏭️ Next Steps (Engineer 1: Backend Core)

### Step 4: Basic CRUD Endpoints (~2h)

**Objective**: Create REST API for Pins and Collections

**Pins API:**

- `POST /api/pins` - Create pin (returns immediately with status='processing')
- `GET /api/pins/:id` - Get single pin
- `GET /api/pins` - List user's pins (optional: ?collection_id=xxx)
- `PATCH /api/pins/:id` - Update pin (collection, title, summary)
- `DELETE /api/pins/:id` - Delete pin

**Collections API:**

- `POST /api/collections` - Create collection
- `GET /api/collections` - List user's collections
- `PATCH /api/collections/:id` - Update collection
- `DELETE /api/collections/:id` - Delete collection

**Tasks:**

1. Create controllers:
   - `app/controllers/api/pins_controller.rb`
   - `app/controllers/api/collections_controller.rb`
2. Add authentication middleware (Clerk JWT verification)
3. Create serializers for JSON responses
4. Add routes to `config/routes.rb`
5. Test all endpoints with curl/Postman

**Files to create:**

- `app/controllers/api/pins_controller.rb`
- `app/controllers/api/collections_controller.rb`
- `app/controllers/concerns/authenticatable.rb` (Clerk auth)

---

## 📋 Day 1 Engineer Assignments (for reference)

### Engineer 1: Backend Core + MongoDB (YOU)

- [x] Rails 7 API setup with mongoid (2h)
- [x] User, Pin, Collection models (1h)
- [x] Clerk webhook integration (1h)
- [ ] Basic CRUD endpoints (2h)

### Engineer 2: AI Agent Pipeline

- [ ] GeminiVisionService (2h)
- [ ] GeminiAgentService (2h)
- [ ] GoogleSearchService (1.5h)
- [ ] SnowflakeService (1.5h)
- [ ] PinProcessorJob (1h)

### Engineer 3: Frontend Core

- [ ] Next.js + Clerk setup (1.5h)
- [ ] Upload page with Uploadthing (2h)
- [ ] Pin detail page (2.5h)
- [ ] Home/dashboard (2h)

### Engineer 4: Frontend Polish + Integration

- [ ] Collections UI (2h)
- [ ] Google Maps integration (1.5h)
- [ ] API integration layer (2h)
- [ ] Polling logic for processing status (1.5h)

---

## 🔧 How to Resume Development

### Start Rails Server

```bash
cd /Users/rachel/Files/repositories/UofTHacks13/backend
export PATH="$HOME/.rbenv/shims:$PATH"
rails server
# Runs on http://127.0.0.1:3000
```

### Start MongoDB (if not running)

```bash
brew services start mongodb/brew/mongodb-community@8.0
```

### Test Models

```bash
cd backend
rails console
# Try: User.create!(clerk_id: 'test', email: 'test@example.com', name: 'Test')
```

### Check Ruby/Rails Versions

```bash
ruby -v  # Should show 3.2.2
rails -v # Should show 7.1.6
which ruby # Should show /Users/rachel/.rbenv/shims/ruby
```

---

## ⚠️ Important Notes & Gotchas

### 1. Mongoid Reserved Method Names

- **Issue**: Can't use `collection` as association name (Mongoid reserves it)
- **Solution**: Use `pin_collection` with `class_name: 'Collection'` in Pin model
- **Example**: `belongs_to :pin_collection, class_name: 'Collection', foreign_key: 'collection_id'`

### 2. Rails Version

- **Important**: Project uses Rails 7.1, NOT Rails 8.x
- If `bundle install` fails with version conflicts, check:
    - `Gemfile`: `gem "rails", "~> 7.1.0"`
    - `config/application.rb`: `config.load_defaults 7.1`

### 3. Ruby via rbenv

- Always use rbenv Ruby (3.2.2), not system Ruby
- If permission errors occur, check: `which ruby` should show `.rbenv/shims/ruby`
- Initialize rbenv: `eval "$(rbenv init - zsh)"` (already in `~/.zshrc`)

### 4. MongoDB Connection

- Local development: `mongodb://localhost:27017/pin_it_development`
- Production: Will use MongoDB Atlas (set `MONGODB_URI` env var)
- Check if running: `mongosh --eval "db.adminCommand('ping')" --quiet`

### 5. Environment Variables Needed Later

- For now, only `MONGODB_URI` is needed
- API keys (Gemini, Snowflake, etc.) will be needed when implementing AI features
- Clerk keys needed for authentication (Step 3)

### 6. Background Jobs (Sidekiq)

- Installed but not configured yet
- Will need Redis running for background jobs
- Used by `PinProcessorJob` (Engineer 2's work)

---

## 📁 Project Structure (Backend)

```
backend/
├── app/
│   ├── controllers/
│   │   └── (empty - to be created)
│   ├── models/
│   │   ├── user.rb ✓
│   │   ├── collection.rb ✓
│   │   └── pin.rb ✓
│   ├── jobs/
│   │   └── (to be created by Engineer 2)
│   └── services/
│       └── (to be created)
├── config/
│   ├── mongoid.yml ✓
│   ├── application.rb ✓ (Rails 7.1)
│   └── routes.rb (needs API routes)
├── Gemfile ✓
├── .env ✓ (gitignored)
└── .gitignore ✓
```

---

## 🔗 Useful Commands

### Rails

```bash
rails server              # Start server
rails console             # Interactive console
rails routes              # Show all routes
rails runner "code"       # Run Ruby code
rails db:drop             # Drop MongoDB database
```

### MongoDB

```bash
mongosh                   # MongoDB shell
brew services start mongodb/brew/mongodb-community@8.0
brew services stop mongodb/brew/mongodb-community@8.0
```

### Gems

```bash
bundle install            # Install dependencies
bundle update            # Update gems
gem list                 # Show installed gems
```

---

## 📚 Reference Links

- [SPEC.md](../SPEC.md) - Full project specification
- [Mongoid Docs](https://www.mongodb.com/docs/mongoid/current/)
- [Rails 7 API Guide](https://guides.rubyonrails.org/api_app.html)
- [Clerk Rails Integration](https://clerk.com/docs/quickstarts/ruby-on-rails)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Snowflake Cortex AI](https://docs.snowflake.com/en/user-guide/ml-powered-functions)

---

**Last Updated**: 2026-01-17 01:50 EST
**Progress**: 3/4 steps complete for Engineer 1 (Backend Core)
**Next Task**: Implement basic CRUD endpoints for Pins and Collections
