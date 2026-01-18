# UofTHacks13
## Inspiration
Our identities are quietly shaped by the places we’re drawn to, even the ones we’ve never visited. Vibely started with a simple, familiar problem: thousands of forgotten screenshots from TikToks and Instagram Reels that capture a moment of curiosity (“I want to go there”) but rarely turn into an actual plan.

We wanted to bridge that gap. Vibely turns those saved screenshots into something actionable: a verified place, real reviews, and a clean list you can come back to.

## What it does
Vibely lets users upload a screenshot of a restaurant from a TikTok or Instagram Reel. In seconds, it:
- Extracts the restaurant name and context from the screenshot
- Finds and validates the place (so you’re not guessing which “Sushi House” it was)
- Pulls reviews and key details from the web (ratings, address, hours, popular mentions)
- Lets you save favourites and automatically tracks recents so your “food finds” stay organized

## How we built it
We built Vibely as a full-stack app with a simple pipeline:
1. Frontend (React + TypeScript + Next.js)
A responsive UI for uploading screenshots, viewing results, and browsing favourites/recents.
2. Backend (Ruby on Rails)
Rails orchestrates the workflow: handling uploads, calling external APIs, merging results, and exposing clean endpoints to the frontend.
3. Gemini (Flash + Vision) 
   We use Gemini Vision to interpret the screenshot (text + visual cues) and Gemini Flash to normalize that into a structured query, e.g.:

   - restaurant name candidates  
   - possible city/neighbourhood hints  
   - relevant keywords (“ramen”, “cafe”, “dim sum”)
4. Google Maps API (place validation + structured data)
Once we have candidates, Maps helps us confirm the correct place and retrieve reliable details like formatted address, coordinates, hours, and place metadata.
5. Google Custom Search API (web enrichment)
We enrich the place with sources beyond maps: review pages, articles, menus, and public write-ups—then surface the most useful snippets.
6. MongoDB
Stores user sessions and app data like uploaded items, favourites, and recents so users can quickly revisit what they’ve saved.

## Challenges we ran into
- Ramping up on Ruby/Rails quickly: part of our team hadn’t used Ruby before, so setting up the environment and learning Rails conventions had to happen fast. Debugging configuration issues under time pressure was a real test.
- Coordinating multiple external services: AI + Maps + Search meant lots of moving parts—API quotas, key restrictions, response formats, and error handling. Getting the system to behave reliably required careful orchestration and fallback logic.
- Matching accuracy: screenshots can be blurry, cropped, or missing key text. We had to design prompts and heuristics so the extracted output was consistent enough to drive search and validation.
- Unexpected setback: one teammate came down with food poisoning during the hackathon. We rebalanced tasks, documented decisions, and kept momentum so we could still ship a working product.

## Accomplishments that we're proud of
- End-to-end MVP shipped: screenshot upload → AI extraction → place match → reviews/details → favourites + recents.
- Real integrations, not mock demos: we connected multiple APIs into one smooth experience with real data flowing through the system.
- Polished user flow: we focused on keeping the app fast and intuitive—minimal steps, clear results, and easy saving.

## What we learned
- Adaptability matters more than comfort: learning Ruby/Rails under a deadline reinforced how quickly you can grow when you build with urgency and focus.
- AI is strongest with guardrails: Gemini worked best when we treated it as a component in a pipeline (structured prompts + validation), not a magic answer machine.
- Systems thinking wins hackathons: stitching services together taught us the importance of clean interfaces, incremental integration, and defensive engineering.
- Team resilience is a feature: documentation, task handoffs, and supporting each other made the difference when things got chaotic.

## What's next for Vibely
- Mobile-first experience: a native app (or deeper mobile support) so users can share screenshots directly from their camera roll.
- Better personalization: learn from favourites/recents and optional feedback to improve ranking and recommendations over time.
- Collections and planning: organize places into lists (date spots, cheap eats, “try next week”), track visits, and export/share plans.
- Smarter summaries: concise “why people like it” summaries from reviews (e.g., “known for broth, long line, worth it”) with source links.
