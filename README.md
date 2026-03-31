# Commons

Commons is a role-based campus community app for students, clubs, and coordinators. It helps people discover events, join campus groups, manage club activity, and keep up with campus-wide updates through a bold, editorial mobile-style interface.

## What the app includes

- Student onboarding with role and commons selection
- Discovery feed for events and clubs
- Event detail and RSVP flows
- Profile and identity setup screens
- Club registration and club management tools
- About Commons and Privacy informational pages

## Design direction

The UI is built around a colorful neo-brutalist / editorial visual system inspired by the reference exploration in [`stitch_discovery_feed/`](./stitch_discovery_feed). The goal is to make campus tooling feel expressive, energetic, and easy to navigate.

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Firebase Authentication
- Firestore
- Motion

## Run locally

### Prerequisites

- Node.js
- npm

### Install

```bash
npm install
```

### Start the dev server

```bash
npm run dev
```

The app will usually be available at:

```bash
http://localhost:3000
```

## Build for production

```bash
npm run build
```

## Project structure

- [`src/views/`](./src/views) contains the main application screens
- [`src/components/`](./src/components) contains shared UI building blocks
- [`src/services/`](./src/services) contains Firebase data logic
- [`src/lib/`](./src/lib) contains app configuration and utilities
- [`stitch_discovery_feed/`](./stitch_discovery_feed) contains design reference exports used during development

## Notes

- `.env` files are ignored by git.
- Firebase web config is stored in [`firebase-applet-config.json`](./firebase-applet-config.json).
- A localhost preview path is available in the UI for design review when full sign-in flow is not available.
