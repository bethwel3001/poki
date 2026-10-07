# PORI

PORI is an audio-first, screen-free urban explorer built for the Hacktoberfest 2026 "Touch Grass" Challenge. 

Instead of staring at a map routing line, PORI forces users to put their phones in their pockets. It utilizes open-weight AI and real-time reverse geocoding to generate hyper-local, audio-guided walking quests based on the user's immediate physical surroundings. 

## Core Features
- Solo Wandering: Generates a contextual walking script based on live GPS data and local landmarks.
- Blind Intercept: Allows two users to share a session and receive audio instructions to find each other in the real world without looking at a screen.
- OLED Blackout Mode: Renders a pure black overlay while the app runs, saving battery and preventing accidental touches while the phone is in a pocket.
- 8-Bit Interface: Lightweight, retro styling using NES.css.
- Agent Tracing & Monitoring: Integrated with Sentry for robust error tracking and fallback management.

## Technology Stack & Hacktoberfest Sponsor Categories
- Framework: Next.js (App Router), React, pnpm
- Best Use of Gemma (Google Open-Weight AI): Utilizing `gemma2-9b-it` via Groq for high-speed, localized route planning and natural script generation.
- Best Use of MongoDB Atlas: Storing GeoJSON and executing high-performance geospatial queries ($geoNear).
- Best Use of ElevenLabs: Delivering real-time conversational voice narration via eleven_flash_v2_5.
- Best Use of Sentry: Agent tracing, error capturing, and fallback management.
- Geocoding: SerpApi (Google Maps Reverse Geocoding)
- Styling: NES.css

## Local Setup Instructions

1. Clone the repository:
git clone git@github.com:bethwel3001/poki.git && cd poki

2. Install dependencies:
pnpm install

3. Configure Environment Variables:
Create a .env.local file in the root directory and add the following keys:
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/pori"
GROQ_API_KEY="your_groq_key"
ELEVENLABS_API_KEY="your_elevenlabs_key"
SERPAPI_API_KEY="your_serpapi_key"
NEXT_PUBLIC_SENTRY_DSN="your_sentry_dsn"

4. Run the development server:
pnpm dev

## Testing Constraints
To test locally, your browser must allow Location permissions. If testing on a desktop, you may need to use Chrome DevTools (Sensors tab) to spoof a specific GPS coordinate for SerpApi to return valid landmarks.

## Contributing
Please see CONTRIBUTING.md for details on our development philosophy and how to submit pull requests.
