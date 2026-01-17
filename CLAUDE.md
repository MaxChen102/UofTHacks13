# Pin-It Coding Guidelines

## General Principles

### Clean Code Fundamentals

- Write self-documenting code with clear, descriptive names
- Keep functions small and focused on a single responsibility
- Favor composition over inheritance
- Prefer immutability where possible
- Handle errors explicitly, never silently fail
- Write code for humans first, computers second

### SOLID Principles

- **Single Responsibility**: Each class/module should have one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable for their base types
- **Interface Segregation**: Many specific interfaces are better than one general-purpose interface
- **Dependency Inversion**: Depend on abstractions, not concretions

---

## Backend (Rails 7 + MongoDB)

### Architecture Patterns

#### Service Objects

- Use service objects for complex business logic
- Each service should have a single public method (`.call` or specific action)
- Services should be stateless and idempotent when possible
- Return explicit result objects, not just primitives

```ruby
# Good
class GeminiVisionService
  def initialize(api_client: GeminiClient.new)
    @api_client = api_client
  end

  def extract_from_screenshot(image_url)
    validate_image_url!(image_url)

    response = @api_client.analyze_image(image_url)
    parse_response(response)
  rescue GeminiClient::Error => e
    handle_api_error(e)
  end

  private

  def validate_image_url!(url)
    raise ArgumentError, "Invalid URL" unless valid_url?(url)
  end
end

# Bad - doing too much in controller
class PinsController
  def create
    # Don't put business logic here
    extracted = call_gemini_api(params[:image])
    details = parse_with_ai(extracted)
    # ...
  end
end
```

#### Repository Pattern for MongoDB

- Abstract database queries into repository classes
- Keep Mongoid queries out of controllers and jobs

```ruby
# app/repositories/pin_repository.rb
class PinRepository
  def find_by_user_and_collection(user_id, collection_id = nil)
    scope = Pin.where(user_id: user_id)
    scope = scope.where(collection_id: collection_id) if collection_id
    scope.order(created_at: -1)
  end

  def find_pending_processing
    Pin.where(processing_status: 'processing')
  end
end
```

#### Background Jobs

- Keep jobs thin - delegate to service objects
- Make jobs idempotent (safe to retry)
- Always handle errors and update status

```ruby
class PinProcessorJob < ApplicationJob
  queue_as :default
  retry_on StandardError, wait: 5.seconds, attempts: 3

  def perform(pin_id)
    pin = Pin.find(pin_id)
    return if pin.processing_status == 'complete'

    PinProcessingService.new(pin).process
  rescue StandardError => e
    pin.update!(processing_status: 'failed', error_message: e.message)
    raise e
  end
end
```

### Ruby/Rails Best Practices

#### Model Organization

- Keep models thin - business logic goes in services
- Use concerns for shared behavior
- Validate data at the model level

```ruby
class Pin
  include Mongoid::Document
  include Mongoid::Timestamps
  include Processable # concern for status management

  field :title, type: String
  field :processing_status, type: String, default: 'pending'

  belongs_to :user
  belongs_to :collection, optional: true

  validates :title, presence: true, length: { maximum: 200 }
  validates :processing_status, inclusion: { in: %w[pending processing complete failed] }

  index({ user_id: 1, created_at: -1 })
  index({ processing_status: 1 })

  scope :completed, -> { where(processing_status: 'complete') }
  scope :for_user, ->(user_id) { where(user_id: user_id) }
end
```

#### Controller Best Practices

- Keep controllers thin - one action, one service call
- Use strong parameters
- Return consistent JSON responses
- Handle errors with rescue_from

```ruby
class Api::PinsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_pin, only: [:show, :update, :destroy]

  def create
    result = CreatePinService.new(current_user, pin_params).call

    if result.success?
      render json: result.pin, status: :created
    else
      render json: { errors: result.errors }, status: :unprocessable_entity
    end
  end

  def show
    render json: @pin
  end

  private

  def set_pin
    @pin = current_user.pins.find(params[:id])
  end

  def pin_params
    params.require(:pin).permit(:image_url, :collection_id)
  end
end
```

#### Error Handling

- Create custom error classes
- Use rescue_from in controllers
- Log errors appropriately

```ruby
# app/errors/api_error.rb
module Errors
  class ApiError < StandardError; end
  class GeminiError < ApiError; end
  class SnowflakeError < ApiError; end
end

# In controller
class ApplicationController < ActionController::API
  rescue_from Errors::ApiError, with: :handle_api_error
  rescue_from Mongoid::Errors::DocumentNotFound, with: :handle_not_found

  private

  def handle_api_error(error)
    Rails.logger.error("API Error: #{error.message}")
    render json: { error: "Service temporarily unavailable" }, status: :service_unavailable
  end
end
```

#### Service Object Result Pattern

```ruby
# app/services/concerns/result.rb
class Result
  attr_reader :data, :errors

  def initialize(success:, data: nil, errors: [])
    @success = success
    @data = data
    @errors = errors
  end

  def success?
    @success
  end

  def failure?
    !@success
  end
end

# Usage in service
class CreatePinService
  def call
    pin = Pin.create(attributes)

    if pin.persisted?
      PinProcessorJob.perform_later(pin.id)
      Result.new(success: true, data: pin)
    else
      Result.new(success: false, errors: pin.errors.full_messages)
    end
  end
end
```

---

## Frontend (Next.js 14 + TypeScript)

### Architecture Patterns

#### Feature-Based Organization

```
app/
├── (auth)/
│   ├── sign-in/
│   └── sign-up/
├── (dashboard)/
│   ├── page.tsx
│   ├── collections/
│   ├── pins/
│   └── upload/
components/
├── features/
│   ├── pins/
│   │   ├── PinCard.tsx
│   │   ├── PinDetail.tsx
│   │   └── hooks/
│   │       └── usePinPolling.ts
│   └── collections/
│       └── CollectionSelector.tsx
├── ui/ (shadcn components)
│   ├── button.tsx
│   └── card.tsx
└── shared/
    └── LoadingSpinner.tsx
lib/
├── api/
│   ├── client.ts
│   ├── pins.ts
│   └── collections.ts
├── types/
│   └── pin.ts
└── utils/
```

#### Type Safety

- Define strict TypeScript types for all API responses
- Use Zod for runtime validation
- Never use `any` - use `unknown` when type is truly unknown

```typescript
// lib/types/pin.ts
import { z } from 'zod';

export const PinSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  collection_id: z.string().optional(),
  pin_type: z.enum(['restaurant', 'concert', 'sports']),
  title: z.string(),
  summary: z.string(),
  ai_recommendation: z.string().optional(),
  location: z.object({
    address: z.string(),
    lat: z.number(),
    lng: z.number(),
    place_id: z.string().optional(),
  }).optional(),
  datetime: z.string().datetime().optional(),
  source_images: z.array(z.string()),
  links: z.object({
    website: z.string().url().optional(),
    tickets: z.string().url().optional(),
    menu: z.string().url().optional(),
    reviews: z.string().url().optional(),
  }).optional(),
  processing_status: z.enum(['pending', 'processing', 'complete', 'failed']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Pin = z.infer<typeof PinSchema>;
```

#### API Client Layer

- Centralize API calls
- Use fetch with proper error handling
- Implement retry logic for failed requests

```typescript
// lib/api/client.ts
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(
        response.status,
        await response.text()
      );
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL!);

// lib/api/pins.ts
export const pinsApi = {
  create: async (data: { image_url: string; collection_id?: string }) => {
    return apiClient.post<Pin>('/api/pins', data);
  },

  get: async (id: string) => {
    const data = await apiClient.get<unknown>(`/api/pins/${id}`);
    return PinSchema.parse(data); // Runtime validation
  },

  list: async (collectionId?: string) => {
    const endpoint = collectionId
      ? `/api/pins?collection_id=${collectionId}`
      : '/api/pins';
    return apiClient.get<Pin[]>(endpoint);
  },
};
```

#### Custom Hooks Pattern

- Extract reusable logic into hooks
- Keep hooks focused and testable
- Use proper dependency arrays

```typescript
// components/features/pins/hooks/usePinPolling.ts
export function usePinPolling(pinId: string) {
  const [pin, setPin] = useState<Pin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchPin = async () => {
      try {
        const data = await pinsApi.get(pinId);
        setPin(data);

        if (data.processing_status === 'complete' || data.processing_status === 'failed') {
          clearInterval(intervalId);
        }
      } catch (err) {
        setError(err as Error);
        clearInterval(intervalId);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPin();
    intervalId = setInterval(fetchPin, 2000);

    return () => clearInterval(intervalId);
  }, [pinId]);

  return { pin, isLoading, error };
}
```

#### Component Best Practices

- Use functional components with hooks
- Keep components small and focused
- Separate presentational and container components
- Use proper TypeScript props types

```typescript
// components/features/pins/PinCard.tsx
interface PinCardProps {
  pin: Pin;
  onCollectionChange?: (collectionId: string) => void;
  className?: string;
}

export function PinCard({ pin, onCollectionChange, className }: PinCardProps) {
  const isProcessing = pin.processing_status === 'processing';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="relative aspect-video">
          <Image
            src={pin.source_images[0]}
            alt={pin.title}
            fill
            className="object-cover"
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Spinner />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <h3 className="font-semibold text-lg">{pin.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {pin.summary}
        </p>

        {pin.ai_recommendation && (
          <div className="mt-4 p-3 bg-primary/10 rounded-md">
            <p className="text-sm italic">{pin.ai_recommendation}</p>
          </div>
        )}
      </CardContent>

      {onCollectionChange && (
        <CardFooter>
          <CollectionSelector
            currentCollectionId={pin.collection_id}
            onChange={onCollectionChange}
          />
        </CardFooter>
      )}
    </Card>
  );
}
```

#### Server Components vs Client Components

- Default to Server Components
- Use Client Components only when needed (interactivity, hooks, browser APIs)
- Mark with 'use client' directive

```typescript
// app/(dashboard)/pins/[id]/page.tsx (Server Component)
import { pinsApi } from '@/lib/api/pins';
import { PinDetailClient } from '@/components/features/pins/PinDetailClient';

export default async function PinDetailPage({ params }: { params: { id: string } }) {
  const pin = await pinsApi.get(params.id);

  return <PinDetailClient initialPin={pin} />;
}

// components/features/pins/PinDetailClient.tsx (Client Component)
'use client';

import { useState } from 'react';
import type { Pin } from '@/lib/types/pin';

interface PinDetailClientProps {
  initialPin: Pin;
}

export function PinDetailClient({ initialPin }: PinDetailClientProps) {
  const [pin, setPin] = useState(initialPin);

  // Client-side interactivity
  const handleUpdate = async (updates: Partial<Pin>) => {
    // ...
  };

  return (
    // ...
  );
}
```

#### Error Boundaries

```typescript
// components/shared/ErrorBoundary.tsx
'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          <h2>Something went wrong</h2>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Code Review Checklist

- [ ] Code follows SOLID principles
- [ ] No business logic in controllers or components
- [ ] Proper error handling implemented
- [ ] All external API calls are wrapped in try/catch
- [ ] Types are properly defined (TypeScript)
- [ ] No hardcoded values - use environment variables
- [ ] No console.log statements in production code
- [ ] Security: No sensitive data exposure
- [ ] Performance: No N+1 queries, unnecessary re-renders
- [ ] Accessibility: Proper semantic HTML, ARIA labels
- [ ] Tests written for new functionality
