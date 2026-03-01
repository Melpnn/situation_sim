# MealStretch

A budget meal planning app that helps low-income families eat healthy meals within their budget. Enter your total budget, number of people to feed, allergies, and cooking equipment—then get AI-curated meal suggestions with ingredients and recipes.

## Features

- **Budget input** – Enter any total amount for the whole meal (not per serving)
- **People to feed** – 1–8 people
- **Nearby stores** – Uses Google Places API to find grocery stores near you (location or address)
- **Allergies** – Select from common allergens (peanuts, dairy, gluten, etc.)
- **Cooking stove** – Toggle if you have access to a stove (suggests no-cook meals when off)
- **Meal planning** – Curated meal templates matched to your budget, constraints, and allergies (no API key required)

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Optional: Google Places API** for nearby stores. Add to `backend/.env`:
   ```
   GOOGLE_PLACES_API_KEY=your_google_key_here
   ```
   Enable Places API and Geocoding API in [Google Cloud Console](https://console.cloud.google.com/).  
   Without it, the app still works – you just won't see nearby stores.

3. **Run the app**
   ```bash
   npm run dev:all
   ```
   Or run separately:
   - `npm run server` – backend on port 3001
   - `npm run dev` – frontend on port 5173

4. Open **http://localhost:5173** in your browser.

## Tech

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express
- **Meals:** Rules-based matching from curated templates (no API key needed)
- **Data:** Realistic grocery inventory and meal templates
