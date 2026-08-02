# Raha Field Tracker

A full-stack field activity tracking app for sales associates and branch heads. Associates can start/end their day, log in-person visits against existing leads, view their own route timeline, and branch heads can review team activity, search associates, and export monthly reimbursement data.

## Overview

This project is a scaled-down version of a real field operations workflow. It focuses on:

- role-based access control for sales associates and branch heads
- geolocation-based day tracking and activity logging
- ordered route distance calculation for fuel reimbursement
- API validation, error handling, and edge-case protection
- a simple but functional UI for mobile-friendly field use

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- MongoDB + Mongoose
- JWT-based authentication
- Leaflet for map interaction

## Core Features

### Sales Associate

- start a working day with current location and timestamp
- log in-person meeting activities against leads
- end the day with another captured location
- view their own day timeline and total distance travelled
- see route history for the current day

### Branch Head

- view team activity for a selected date
- search associates by name
- review historical day sessions and visit counts
- export monthly distance totals as CSV for reimbursement
- add new leads that associates can visit later

## Project Structure

- src/app/api - API routes for auth, associate workflows, branch-head workflows, and leads
- src/components - reusable UI components such as the map picker and timeline
- src/lib - authentication, MongoDB connection, validation, and distance providers
- src/models - MongoDB schemas for users, leads, day sessions, and activities
- src/scripts/seed.ts - demo data seeding script

## Prerequisites

- Node.js 20+
- MongoDB instance (local or MongoDB Atlas)
- Optional: OpenRouteService API key for more accurate road distance routing

## Environment Variables

Create a .env.local file in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/raha-field-tracker
JWT_SECRET=replace-with-a-long-random-secret

# Optional: use OpenRouteService for road-distance calculation
DISTANCE_PROVIDER=openrouteservice
ORS_API_KEY=your_openrouteservice_api_key
```

If ORS is not configured, the app falls back to haversine distance (straight-line distance) for safety and still returns a result.

## Installation

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open http://localhost:3000 to view the app.

## Seed Demo Data

The seed script creates:

- 1 branch head
- 3 sales associates
- 5 leads
- several historical day sessions and activities for demo purposes

The seeded users are:

- Branch Head: branchhead@gmail.com / pass -162216
- Sales Associates: sales1@gmail.com, sales2@gmail.com, sales3@gmail.com
  - All sales accounts use the same password: pass -162216

Run:

```bash
npx tsx src/scripts/seed.ts
```

Default demo credentials:

- Branch Head: branchhead@gmail.com / pass -162216
- Sales Associates:
  - sales1@gmail.com / pass -162216
  - sales2@gmail.com / pass -162216
  - sales3@gmail.com / pass -162216

## Data Model

### User

Stores authentication and role information.

- name
- email
- passwordHash
- role: sales-associate | branch-head
- reportsTo (for associates)

### Lead

Represents a client or prospect that an associate can visit.

- name
- contact
- location { lat, lng }

### DaySession

Represents one working day for an associate.

- associate
- dateKey
- status: open | closed
- startLocation / endLocation
- startTimestamp / endTimestamp
- totalDistanceKm
- distanceProvider

### Activity

Represents a logged visit or in-person meeting.

- daySession
- associate
- lead
- notes
- location
- timestamp

## Distance Calculation

The day is treated as an ordered route:

Start Day -> Activity 1 -> Activity 2 -> ... -> End Day

Distances are calculated between consecutive points in timestamp order, not insertion order. The implementation uses a provider abstraction so the distance logic can be swapped without changing the rest of the app.

### Current behavior

- If ORS is configured, the app uses OpenRouteService for road-distance calculation.
- If ORS fails or is not configured, it falls back to haversine distance.
- The result is rounded sensibly for display and exported totals.

## Role-Based Access Control

Access is enforced on the server side in the API routes.

- sales associates can only access their own day data and their own role-specific flows
- branch heads can only see team data for the associates reporting to them
- direct API access is also guarded to prevent cross-role misuse

## Edge Cases Handled

The app includes protections for several important cases:

- starting a day twice
- ending a day that was never started
- logging an activity after the day has already ended
- missing or poor location data
- duplicate consecutive points in the route
- route calculation when the day is still open or incomplete

## Notes on Continuous Tracking

If we wanted to capture a full route continuously while an associate moves, the browser could collect geolocation updates in the background using the Geolocation API. In practice, this has limitations:

- browser permission and battery restrictions
- background tracking is limited on mobile browsers
- GPS accuracy can vary depending on device and signal quality

A production-grade solution would usually pair browser-based capture with a mobile app or a background service worker / native SDK to get more reliable continuous updates and better battery management.

## Deployment

This app is designed to be deployed on Vercel.

Recommended deployment steps:

1. connect the repo to Vercel
2. add the environment variables in the Vercel dashboard
3. deploy the app
4. seed the database in the production environment if needed

## Assumptions

- the app is intended for demo and assessment purposes, not a full enterprise fleet system
- location capture is performed at the start, activity, and end points of a day
- distance is calculated from those captured points and is suitable for reimbursement estimation, not legal-grade routing

## License

This project is for assessment/demo purposes.
