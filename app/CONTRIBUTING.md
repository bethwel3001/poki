# Contributing to PORI

Thank you for your interest in contributing to PORI. This project was initiated for Hacktoberfest 2026. Whether you are a team member or an open-source contributor, please follow these guidelines to maintain a clean and lightweight codebase.

## Development Philosophy
* Zero Bloat: We use native browser APIs (like fetch and HTMLAudioElement) over heavy SDKs wherever possible.
* Clean Architecture: Keep components modular. Separate UI logic from backend API routes.
* Minimal Styling: We rely strictly on NES.css. Do not introduce Tailwind or complex CSS modules unless absolutely necessary for layout constraints.

## Getting Started
1. Fork the repository and create your branch from `main`.
2. Ensure you have `pnpm` installed. We do not use `npm` or `yarn`.
3. Follow the Local Setup Instructions in the README.

## Pull Request Process
1. Ensure your code does not introduce hydration errors or unnecessary re-renders.
2. Test the OLED Blackout feature to ensure audio continues playing and the screen wake lock functions correctly.
3. Keep commits atomic and use standard conventional commit messages (e.g., feat:, fix:, chore:, docs:).
4. Do not commit any `.env` files or hardcoded API keys. 

## Issue Tracking
If you find a bug regarding GPS polling, audio streaming, or database indexing, please open an issue with a clear reproduction path and your current environment details.
