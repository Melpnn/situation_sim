import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

// Inventory lookup by name pattern
const INV = {
  rice: { name: 'Rice (1 lb)', price: 0.92, needsStove: true },
  pasta: { name: 'Pasta (1 lb)', price: 1.29, needsStove: true },
  oatmeal: { name: 'Oatmeal (18 oz)', price: 3.49, needsStove: true },
  bread: { name: 'Bread (loaf)', price: 2.49, needsStove: false },
  eggs: { name: 'Eggs (dozen)', price: 3.19, needsStove: true },
  chicken: { name: 'Chicken thighs (1 lb)', price: 2.99, needsStove: true },
  beef: { name: 'Ground beef (1 lb)', price: 4.99, needsStove: true },
  tuna: { name: 'Canned tuna (5 oz)', price: 1.49, needsStove: false },
  blackBeans: { name: 'Black beans (15 oz can)', price: 1.19, needsStove: false },
  lentils: { name: 'Lentils (1 lb)', price: 1.79, needsStove: true },
  milk: { name: 'Milk (gallon)', price: 3.49, needsStove: false },
  cheese: { name: 'Cheese (8 oz)', price: 3.99, needsStove: false },
  yogurt: { name: 'Yogurt (32 oz)', price: 3.29, needsStove: false },
  onions: { name: 'Onions (3 lb)', price: 2.49, needsStove: false },
  potatoes: { name: 'Potatoes (5 lb)', price: 3.99, needsStove: true },
  carrots: { name: 'Carrots (2 lb)', price: 2.29, needsStove: false },
  cabbage: { name: 'Cabbage (head)', price: 1.49, needsStove: true },
  bananas: { name: 'Bananas (bunch)', price: 1.29, needsStove: false },
  apples: { name: 'Apples (3 lb)', price: 4.49, needsStove: false },
  frozenVeg: { name: 'Frozen mixed vegetables (1 lb)', price: 1.99, needsStove: true },
  cannedTomatoes: { name: 'Canned tomatoes (28 oz)', price: 1.39, needsStove: true },
  oil: { name: 'Cooking oil (32 oz)', price: 4.99, needsStove: true },
  salt: { name: 'Salt', price: 0.99, needsStove: false },
  pepper: { name: 'Pepper', price: 2.49, needsStove: false },
  garlic: { name: 'Garlic (3 bulbs)', price: 1.29, needsStove: false },
  peanutButter: { name: 'Peanut butter (18 oz)', price: 3.99, needsStove: false },
  cannedCorn: { name: 'Canned corn (15 oz)', price: 0.99, needsStove: false },
  broth: { name: 'Chicken broth (32 oz)', price: 2.49, needsStove: true },
  flour: { name: 'Flour (5 lb)', price: 2.99, needsStove: true },
}

// Curated meals: { mealName, servings, ingredients: [{ key, quantity }], instructions, nutritionNotes, allergens }
const MEAL_TEMPLATES = [
  {
    mealName: 'Rice & Black Beans',
    servings: 4,
    ingredients: [
      { key: 'rice', quantity: '1 lb', price: 0.92 },
      { key: 'blackBeans', quantity: '2 cans', price: 2.38 },
      { key: 'onions', quantity: '1 onion', price: 0.83 },
      { key: 'garlic', quantity: '2 cloves', price: 0.43 },
      { key: 'oil', quantity: '2 tbsp', price: 0.31 },
      { key: 'salt', quantity: 'pinch', price: 0.1 },
    ],
    instructions: [
      'Cook rice according to package directions.',
      'In a pan, sauté diced onion and garlic in oil until soft.',
      'Add black beans (drained) and a pinch of salt. Heat through.',
      'Serve beans over rice.',
    ],
    nutritionNotes: 'High in protein and fiber. Rice and beans together provide complete protein.',
    allergens: ['None'],
    needsStove: true,
  },
  {
    mealName: 'Tuna Salad Sandwiches',
    servings: 4,
    ingredients: [
      { key: 'tuna', quantity: '2 cans', price: 2.98 },
      { key: 'bread', quantity: '1 loaf', price: 2.49 },
      { key: 'onions', quantity: '1/4 onion', price: 0.21 },
      { key: 'yogurt', quantity: '1/4 cup', price: 0.82 },
      { key: 'carrots', quantity: '2 carrots', price: 0.46 },
    ],
    instructions: [
      'Drain tuna and mix with diced onion and yogurt (or mayo if available).',
      'Toast bread if desired.',
      'Spoon tuna mixture onto bread. Serve with carrot sticks.',
    ],
    nutritionNotes: 'Good source of protein and omega-3. No cooking required.',
    allergens: ['Fish'],
    needsStove: false,
    ingredients: [
      { key: 'tuna', quantity: '2 cans', price: 2.98 },
      { key: 'bread', quantity: '1 loaf', price: 2.49 },
      { key: 'onions', quantity: '1/4 onion', price: 0.21 },
      { key: 'yogurt', quantity: '1/4 cup', price: 0.82 },
      { key: 'carrots', quantity: '2 carrots', price: 0.46 },
    ],
  },
  {
    mealName: 'Cheese & Apple Snack Plate',
    servings: 4,
    ingredients: [
      { key: 'cheese', quantity: '4 oz', price: 2.0 },
      { key: 'apples', quantity: '2 apples', price: 1.5 },
      { key: 'bread', quantity: '1/2 loaf', price: 1.25 },
      { key: 'carrots', quantity: '4 carrots', price: 0.92 },
    ],
    instructions: [
      'Slice cheese, apples, and bread. Cut carrots into sticks.',
      'Arrange on plates. No cooking needed.',
    ],
    nutritionNotes: 'Simple no-cook meal. Cheese and apples pair well for protein and fiber.',
    allergens: ['Dairy'],
    needsStove: false,
  },
  {
    mealName: 'Lentil Soup',
    servings: 6,
    ingredients: [
      { key: 'lentils', quantity: '1 lb', price: 1.79 },
      { key: 'broth', quantity: '1 container', price: 2.49 },
      { key: 'carrots', quantity: '3 carrots', price: 0.69 },
      { key: 'onions', quantity: '1 onion', price: 0.83 },
      { key: 'garlic', quantity: '2 cloves', price: 0.43 },
      { key: 'cannedTomatoes', quantity: '1 can', price: 1.39 },
      { key: 'salt', quantity: 'to taste', price: 0.1 },
    ],
    instructions: [
      'Sauté diced onion, carrots, and garlic in a large pot.',
      'Add lentils, broth, and canned tomatoes. Bring to boil, then simmer 30 min.',
      'Season with salt. Serve with bread.',
    ],
    nutritionNotes: 'High in fiber and protein. Lentils are affordable and filling.',
    allergens: ['None'],
    needsStove: true,
  },
  {
    mealName: 'Chicken & Rice Bowl',
    servings: 4,
    ingredients: [
      { key: 'chicken', quantity: '1 lb', price: 2.99 },
      { key: 'rice', quantity: '1 lb', price: 0.92 },
      { key: 'frozenVeg', quantity: '1 bag', price: 1.99 },
      { key: 'garlic', quantity: '2 cloves', price: 0.43 },
      { key: 'oil', quantity: '1 tbsp', price: 0.16 },
      { key: 'salt', quantity: 'pinch', price: 0.1 },
    ],
    instructions: [
      'Cook rice according to package directions.',
      'Cut chicken into bite-sized pieces. Sauté in oil with garlic until cooked through.',
      'Steam or microwave frozen vegetables. Mix with chicken and rice. Season with salt.',
    ],
    nutritionNotes: 'Balanced meal with protein, grains, and vegetables.',
    allergens: ['None'],
    needsStove: true,
  },
  {
    mealName: 'Peanut Butter & Banana Sandwiches',
    servings: 4,
    ingredients: [
      { key: 'peanutButter', quantity: '1 jar', price: 3.99 },
      { key: 'bread', quantity: '1 loaf', price: 2.49 },
      { key: 'bananas', quantity: '1 bunch', price: 1.29 },
    ],
    instructions: [
      'Spread peanut butter on bread slices.',
      'Add sliced banana. Top with second bread slice.',
      'Serve with milk or water.',
    ],
    nutritionNotes: 'Quick, no-cook meal. Peanut butter provides protein; bananas add potassium.',
    allergens: ['Peanuts'],
    needsStove: false,
  },
  {
    mealName: 'Pasta with Canned Tomatoes',
    servings: 4,
    ingredients: [
      { key: 'pasta', quantity: '1 lb', price: 1.29 },
      { key: 'cannedTomatoes', quantity: '1 can', price: 1.39 },
      { key: 'onions', quantity: '1 onion', price: 0.83 },
      { key: 'garlic', quantity: '2 cloves', price: 0.43 },
      { key: 'oil', quantity: '2 tbsp', price: 0.31 },
      { key: 'salt', quantity: 'pinch', price: 0.1 },
    ],
    instructions: [
      'Cook pasta according to package. Drain.',
      'Sauté onion and garlic in oil. Add canned tomatoes, simmer 10 min.',
      'Toss pasta with sauce. Season with salt.',
    ],
    nutritionNotes: 'Simple, filling meal. Tomatoes provide lycopene and vitamin C.',
    allergens: ['Gluten', 'Wheat'],
    needsStove: true,
  },
  {
    mealName: 'Bean & Cheese Burrito Bowl',
    servings: 4,
    ingredients: [
      { key: 'blackBeans', quantity: '2 cans', price: 2.38 },
      { key: 'rice', quantity: '1 lb', price: 0.92 },
      { key: 'cheese', quantity: '4 oz', price: 2.0 },
      { key: 'cannedCorn', quantity: '1 can', price: 0.99 },
      { key: 'onions', quantity: '1/2 onion', price: 0.42 },
    ],
    instructions: [
      'Cook rice. Heat black beans and corn.',
      'Layer rice, beans, corn, diced onion, and shredded cheese in bowls.',
      'No tortilla needed – eat as a bowl. Add hot sauce if available.',
    ],
    nutritionNotes: 'Complete protein from beans and rice. Cheese adds calcium.',
    allergens: ['Dairy'],
    needsStove: true,
  },
  {
    mealName: 'Oatmeal with Bananas',
    servings: 4,
    ingredients: [
      { key: 'oatmeal', quantity: '1 container', price: 3.49 },
      { key: 'bananas', quantity: '1 bunch', price: 1.29 },
      { key: 'milk', quantity: '2 cups', price: 0.87 },
    ],
    instructions: [
      'Cook oatmeal with milk according to package.',
      'Slice bananas and stir in. Serve warm.',
    ],
    nutritionNotes: 'Fiber-rich breakfast. Oats help with sustained energy.',
    allergens: ['None'],
    needsStove: true,
  },
  {
    mealName: 'Egg & Potato Scramble',
    servings: 4,
    ingredients: [
      { key: 'eggs', quantity: '1 dozen', price: 3.19 },
      { key: 'potatoes', quantity: '2 lb', price: 1.6 },
      { key: 'onions', quantity: '1 onion', price: 0.83 },
      { key: 'oil', quantity: '1 tbsp', price: 0.16 },
      { key: 'salt', quantity: 'pinch', price: 0.1 },
    ],
    instructions: [
      'Dice potatoes and onion. Sauté in oil until potatoes are tender.',
      'Scramble eggs in a bowl. Pour over potato mixture, stir until cooked.',
      'Season with salt. Serve with bread.',
    ],
    nutritionNotes: 'Protein and carbs. Eggs provide B vitamins and choline.',
    allergens: ['Eggs'],
    needsStove: true,
  },
  {
    mealName: 'Cabbage & Potato Soup',
    servings: 6,
    ingredients: [
      { key: 'cabbage', quantity: '1 head', price: 1.49 },
      { key: 'potatoes', quantity: '2 lb', price: 1.6 },
      { key: 'broth', quantity: '1 container', price: 2.49 },
      { key: 'carrots', quantity: '2 carrots', price: 0.46 },
      { key: 'onions', quantity: '1 onion', price: 0.83 },
      { key: 'salt', quantity: 'to taste', price: 0.1 },
    ],
    instructions: [
      'Chop cabbage, potatoes, carrots, and onion.',
      'Add to pot with broth. Bring to boil, simmer 25 min until vegetables are tender.',
      'Season with salt.',
    ],
    nutritionNotes: 'Hearty, budget-friendly. Cabbage is rich in vitamin C.',
    allergens: ['None'],
    needsStove: true,
  },
  {
    mealName: 'Yogurt Parfait with Fruit',
    servings: 4,
    ingredients: [
      { key: 'yogurt', quantity: '1 container', price: 3.29 },
      { key: 'bananas', quantity: '1 bunch', price: 1.29 },
      { key: 'apples', quantity: '2 apples', price: 1.5 },
      { key: 'oatmeal', quantity: '1/4 cup dry for crunch', price: 0.44 },
    ],
    instructions: [
      'Layer yogurt in bowls. Add sliced bananas and diced apples.',
      'Sprinkle dry oatmeal on top for crunch. No cooking needed.',
    ],
    nutritionNotes: 'Probiotics from yogurt. Fruit adds vitamins and fiber.',
    allergens: ['Dairy'],
    needsStove: false,
  },
]

// Mock grocery inventory – for /api/inventory
const MOCK_GROCERY_INVENTORY = [
  { id: '1', name: 'Rice (1 lb)', price: 0.92, category: 'grains', needsStove: true },
  { id: '2', name: 'Pasta (1 lb)', price: 1.29, category: 'grains', needsStove: true },
  { id: '3', name: 'Oatmeal (18 oz)', price: 3.49, category: 'grains', needsStove: true },
  { id: '4', name: 'Bread (loaf)', price: 2.49, category: 'grains', needsStove: false },
  { id: '5', name: 'Eggs (dozen)', price: 3.19, category: 'protein', needsStove: true },
  { id: '6', name: 'Chicken thighs (1 lb)', price: 2.99, category: 'protein', needsStove: true },
  { id: '7', name: 'Ground beef (1 lb)', price: 4.99, category: 'protein', needsStove: true },
  { id: '8', name: 'Canned tuna (5 oz)', price: 1.49, category: 'protein', needsStove: false },
  { id: '9', name: 'Black beans (15 oz can)', price: 1.19, category: 'protein', needsStove: false },
  { id: '10', name: 'Lentils (1 lb)', price: 1.79, category: 'protein', needsStove: true },
  { id: '11', name: 'Milk (gallon)', price: 3.49, category: 'dairy', needsStove: false },
  { id: '12', name: 'Cheese (8 oz)', price: 3.99, category: 'dairy', needsStove: false },
  { id: '13', name: 'Yogurt (32 oz)', price: 3.29, category: 'dairy', needsStove: false },
  { id: '14', name: 'Onions (3 lb)', price: 2.49, category: 'produce', needsStove: false },
  { id: '15', name: 'Potatoes (5 lb)', price: 3.99, category: 'produce', needsStove: true },
  { id: '16', name: 'Carrots (2 lb)', price: 2.29, category: 'produce', needsStove: false },
  { id: '17', name: 'Cabbage (head)', price: 1.49, category: 'produce', needsStove: true },
  { id: '18', name: 'Bananas (bunch)', price: 1.29, category: 'produce', needsStove: false },
  { id: '19', name: 'Apples (3 lb)', price: 4.49, category: 'produce', needsStove: false },
  { id: '20', name: 'Frozen mixed vegetables (1 lb)', price: 1.99, category: 'produce', needsStove: true },
  { id: '21', name: 'Canned tomatoes (28 oz)', price: 1.39, category: 'pantry', needsStove: true },
  { id: '22', name: 'Cooking oil (32 oz)', price: 4.99, category: 'pantry', needsStove: true },
  { id: '23', name: 'Salt', price: 0.99, category: 'pantry', needsStove: false },
  { id: '24', name: 'Pepper', price: 2.49, category: 'pantry', needsStove: false },
  { id: '25', name: 'Garlic (3 bulbs)', price: 1.29, category: 'pantry', needsStove: false },
  { id: '26', name: 'Peanut butter (18 oz)', price: 3.99, category: 'pantry', needsStove: false },
  { id: '27', name: 'Canned corn (15 oz)', price: 0.99, category: 'pantry', needsStove: false },
  { id: '28', name: 'Chicken broth (32 oz)', price: 2.49, category: 'pantry', needsStove: true },
  { id: '29', name: 'Flour (5 lb)', price: 2.99, category: 'grains', needsStove: true },
  { id: '30', name: 'Peanut butter & jelly sandwich supplies', price: 5.99, category: 'pantry', needsStove: false },
]

app.get('/api', (req, res) => {
  res.json({ ok: true, message: 'MealStretch API' })
})

app.get('/api/inventory', (req, res) => {
  res.json(MOCK_GROCERY_INVENTORY)
})

app.post('/api/plan-meal', (req, res) => {
  const { budget, people, allergies, hasStove, nearbyStores } = req.body || {}

  if (!budget || budget <= 0) {
    return res.status(400).json({ error: 'Please enter a valid budget amount.' })
  }

  const numPeople = Math.max(1, parseInt(people) || 1)
  const allergyList = Array.isArray(allergies) ? allergies.map((a) => a.toLowerCase()) : []
  const canCook = hasStove !== false
  const budgetNum = Number(budget)

  const allergyMatch = (meal) => {
    const mealAllergens = (meal.allergens || []).map((a) => a.toLowerCase())
    return !allergyList.some((a) => mealAllergens.some((ma) => ma.includes(a) || a.includes(ma)))
  }

  const candidates = MEAL_TEMPLATES.filter((m) => {
    if (!canCook && m.needsStove) return false
    if (!allergyMatch(m)) return false
    const totalCost = m.ingredients.reduce((sum, i) => sum + (i.price || 0), 0)
    if (totalCost > budgetNum) return false
    if (m.servings < numPeople) {
      const scale = Math.ceil(numPeople / m.servings)
      if (totalCost * scale > budgetNum) return false
    }
    return true
  })

  if (candidates.length === 0) {
    return res.status(400).json({
      error: `No meals fit your budget ($${budgetNum.toFixed(2)}) and constraints. Try increasing your budget or adjusting allergies/stove options.`,
    })
  }

  let best = candidates[0]
  let bestScore = -1

  for (const m of candidates) {
    const baseCost = m.ingredients.reduce((sum, i) => sum + (i.price || 0), 0)
    const scale = Math.max(1, Math.ceil(numPeople / m.servings))
    const totalCost = Math.round(baseCost * scale * 100) / 100
    if (totalCost > budgetNum) continue

    const servingsAfterScale = m.servings * scale
    const costPerPerson = totalCost / servingsAfterScale
    const score = servingsAfterScale - costPerPerson * 0.01

    if (score > bestScore) {
      bestScore = score
      best = { ...m, _scale: scale, _totalCost: totalCost }
    }
  }

  const scale = best._scale || Math.max(1, Math.ceil(numPeople / best.servings))
  const totalCost = best._totalCost ?? Math.round(
    best.ingredients.reduce((s, i) => s + (i.price || 0), 0) * scale * 100
  ) / 100

  const meal = {
    mealName: best.mealName,
    servings: best.servings * scale,
    totalCost,
    ingredients: best.ingredients.map((i) => ({
      name: INV[i.key]?.name || i.key,
      price: Math.round((i.price || 0) * scale * 100) / 100,
      quantity: i.quantity,
    })),
    instructions: best.instructions,
    nutritionNotes: best.nutritionNotes,
  }

  res.json({
    meal,
    budget: budgetNum,
    people: numPeople,
    nearbyStores: Array.isArray(nearbyStores) ? nearbyStores : undefined,
  })
})

// Nearby grocery stores via Google Places API (Geo + Places)
app.get('/api/nearby-stores', async (req, res) => {
  const { lat, lng } = req.query

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Location (lat, lng) required' })
  }

  if (!GOOGLE_PLACES_API_KEY) {
    const fallback = [
      { id: '1', name: 'Local Grocery Mart', address: '123 Main St', distance: '0.3 mi' },
      { id: '2', name: 'Budget Foods', address: '456 Oak Ave', distance: '0.8 mi' },
      { id: '3', name: 'Family Dollar Foods', address: '789 Elm Rd', distance: '1.2 mi' },
    ]
    return res.json(fallback)
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=grocery_or_supermarket&key=${GOOGLE_PLACES_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', data.status, data.error_message)
      return res.status(500).json({ error: data.error_message || 'Could not fetch nearby stores' })
    }

    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)
    const haversine = (lat1, lon1, lat2, lon2) => {
      const R = 3959
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLon = (lon2 - lon1) * Math.PI / 180
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    }

    const stores = (data.results || []).slice(0, 10).map((p, i) => {
      const loc = p.geometry?.location
      const dist = loc ? haversine(userLat, userLng, loc.lat, loc.lng) : null
      return {
        id: p.place_id || String(i + 1),
        name: p.name,
        address: p.vicinity || p.formatted_address || '',
        distance: dist != null ? `${dist.toFixed(1)} mi` : null,
      }
    })

    res.json(stores)
  } catch (err) {
    console.error('Places API error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Geocode address to lat/lng (for address search)
app.get('/api/geocode', async (req, res) => {
  const { address } = req.query
  if (!address || !GOOGLE_PLACES_API_KEY) {
    return res.status(400).json({ error: 'Address required' })
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_PLACES_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK') {
      return res.status(400).json({ error: 'Address not found' })
    }

    const loc = data.results[0]?.geometry?.location
    if (!loc) return res.status(400).json({ error: 'Could not get coordinates' })

    res.json({ lat: loc.lat, lng: loc.lng })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`MealStretch server running on http://localhost:${PORT}`)
  if (GOOGLE_PLACES_API_KEY) console.log('  ✓ Google Places API configured')
})
