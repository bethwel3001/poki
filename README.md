# PORI (ポ リ)

> **Screen-Free, Audio-First Urban Exploration**  
> *Built for the Hacktoberfest 2026 "Touch Grass" Challenge.*

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9-orange?style=for-the-badge&logo=pnpm)](https://pnpm.io/)
[![NES.css](https://img.shields.io/badge/Style-NES.css-209cee?style=for-the-badge)](https://nostalgic-css.github.io/NES.css/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)
[![Sentry](https://img.shields.io/badge/Sentry-Monitored-purple?style=for-the-badge&logo=sentry)](https://sentry.io/)

---

## Overview

Most navigation applications glue your eyes to a glowing blue line on a screen, disconnecting you from the world around you. **PORI** flips this paradigm upside down: it forces you to put your phone in your pocket and **look up**.

Using real-time device geolocation, live reverse-geocoding, and open-weight generative AI, PORI constructs dynamic, highly contextual spoken-word quests. Instead of generic turn-by-turn distance counters, your guide narrates your surroundings with real physical landmarks, cultural facts, and logical routes—delivering a seamless, screenless adventure.

---

## Core Features

* **Solo Wandering**  
  Generates contextual walking instructions based on live GPS coordinates, calculated bearing, and immediate real-world landmarks. The guide describes the journey dynamically—pointing out notable roads, buildings, and geographic focal points.

* **Blind Intercept**  
  Enables two users to join a shared exploration session (`friendSessionId`). Rather than sharing live map pins, PORI computes the relative distance and bearing using geospatial database queries, guiding both wanderers toward an audio-guided rendezvous point.

* **OLED Blackout Mode**  
  Once audio playback begins, the display transitions into a pure-black canvas (`#000000`). Utilizing the native **Screen Wake Lock API**, it keeps background tasks and audio alive while preventing pocket touches and minimizing battery consumption on OLED displays. Awakened easily with a double-tap or dedicated wake control.

* **8-Bit Retro Interface**  
  Styled with a lightweight, nostalgic NES aesthetic using [NES.css](https://nostalgic-css.github.io/NES.css/), featuring custom pixel-art buttons, dark-mode inputs, and classic gaming typography.

* **Resilient Telemetry & Fallbacks**  
  Full end-to-end monitoring powered by Sentry ensures trace emissions across API requests, geolocation failures, and TTS audio synthesis, backed by graceful audio fallbacks.

---

## Technology Stack & Sponsor Tracks

| Category / Sponsor | Technology | Implementation Details |
| :--- | :--- | :--- |
| **Open-Weight AI** | **Gemma via Groq Cloud** | High-speed inference using `gemma2-9b-it` / open-weight models via Groq SDK to construct concise, TTS-optimized spoken route scripts under 4 sentences. |
| **Geospatial Database** | **MongoDB Atlas** | Stores active explorer coordinates using GeoJSON `Point` primitives indexed with a high-performance `2dsphere` index for `$near` proximity queries. |
| **Voice Synthesis** | **ElevenLabs** | Streams lifelike, low-latency narration using ElevenLabs' conversational `eleven_flash_v2_5` text-to-speech model. |
| **Application Monitoring** | **Sentry** | Full instrumentation across client and server (`@sentry/nextjs`), capturing API request failures, geolocation denials, and trace performance. |
| **Hyper-Local Geocoding** | **SerpApi** | Queries the Google Maps reverse-geocoding engine to retrieve immediate physical landmarks, verified street names, and local establishments. |
| **Frontend & Framework** | **Next.js & React (App Router)** | Zero-bloat client architecture with native browser APIs (`navigator.geolocation`, `HTMLAudioElement`, `navigator.wakeLock`). |

---

## Local Setup Instructions

### Prerequisites
* **Node.js**: v18.18.0 or newer
* **pnpm**: v9.0.0 or newer (`npm install -g pnpm`)

### 1. Clone the Repository
```bash
git clone https://github.com/bethwel3001/pori.git
cd pori
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local 2>/dev/null || touch .env.local
```

Populate `.env.local` with your API credentials:

```env
# MongoDB Atlas
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/pori?retryWrites=true&w=majority"

# Groq Cloud (Gemma / Open-Weight LLM)
GROQ_API_KEY="gsk_your_groq_api_key_here"

# ElevenLabs (Text-to-Speech)
ELEVENLABS_API_KEY="your_elevenlabs_api_key_here"

# SerpApi (Google Maps Engine Reverse Geocoding)
SERPAPI_API_KEY="your_serpapi_api_key_here"

# Sentry Monitoring
NEXT_PUBLIC_SENTRY_DSN="https://<public_key>@<org>.ingest.sentry.io/<project_id>"
SENTRY_AUTH_TOKEN="sntrys_your_sentry_auth_token_here"
```

### 4. Run the Development Server
```bash
pnpm dev
```

Visit [`http://localhost:3000`](http://localhost:3000) in your browser to start your quest.

### 5. Build for Production
```bash
pnpm build
pnpm start
```

---

## Testing Constraints & Geolocation Spoofing

Because PORI relies on real-world spatial positioning and reverse-geocoding, testing on desktop browsers requires spoofing GPS coordinates:

1. Open [`http://localhost:3000`](http://localhost:3000) in **Google Chrome**.
2. Press `F12` (or `Cmd + Option + I` on macOS) to open **Chrome DevTools**.
3. Press `Ctrl + Shift + P` (or `Cmd + Shift + P` on macOS) to open the Command Menu.
4. Type **`Sensors`** and select **Show Sensors**.
5. Under the **Location** dropdown, choose a preset (e.g., *London*, *San Francisco*, *Tokyo*) or select **Other...** and enter coordinates with rich landmark density (e.g., Nairobi `-1.286389, 36.817223`).
6. Click **"Start Quest"** and grant browser location permissions.
7. Verify that SerpApi resolves local landmarks and that ElevenLabs streams the corresponding audio guide.
8. *(Optional)* Click the red **"Test Sentry"** button to confirm error trace emissions in your Sentry project dashboard.

---

## Contributing

Contributions are warmly welcomed! Please review our [CONTRIBUTING.md](CONTRIBUTING.md) guide before submitting pull requests.

Our core development principles:
* **Zero Bloat**: Favor native browser APIs (`fetch`, `HTMLAudioElement`, `wakeLock`) over unnecessary client-side libraries.
* **Modular Clean Architecture**: Maintain separation between server route handlers and client UI components.
* **Minimalist Retro Aesthetic**: Adhere strictly to the NES.css design system.

---

## License

This project is licensed under the [MIT License](LICENSE).
