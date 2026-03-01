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
  cucumber: { name: 'Cucumber (2 ct)', price: 1.50, needsStove: false },
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
  chickpeas: { name: 'Chickpeas (15 oz can)', price: 1.19, needsStove: false },
  tortillas: { name: 'Flour tortillas (10 ct)', price: 2.49, needsStove: false },
  nori: { name: 'Nori seaweed sheets (10 ct)', price: 3.99, needsStove: false },
  riceVinegar: { name: 'Rice vinegar (10 oz)', price: 2.49, needsStove: false },
  soySauce: { name: 'Soy sauce (10 oz)', price: 2.99, needsStove: false },
}

// Map US state codes to cuisine regions for location-based meal suggestions
const STATE_TO_REGION = {
  TX: ['southwest', 'southeast'], AZ: ['southwest'], NM: ['southwest'], OK: ['southwest'], NV: ['southwest'],
  LA: ['southeast'], MS: ['southeast'], AL: ['southeast'], GA: ['southeast'], FL: ['southeast'],
  SC: ['southeast'], NC: ['southeast'], TN: ['southeast'], AR: ['southeast'], KY: ['southeast'],
  NY: ['northeast'], PA: ['northeast'], NJ: ['northeast'], MA: ['northeast'], CT: ['northeast'],
  RI: ['northeast'], NH: ['northeast'], VT: ['northeast'], ME: ['northeast'],
  IL: ['midwest'], OH: ['midwest'], MI: ['midwest'], WI: ['midwest'], MN: ['midwest'],
  IA: ['midwest'], IN: ['midwest'], MO: ['midwest'], KS: ['midwest'], NE: ['midwest'], SD: ['midwest'], ND: ['midwest'],
  CA: ['west_coast'], OR: ['west_coast'], WA: ['west_coast'],
  CO: ['mountain'], UT: ['mountain'], WY: ['mountain'], MT: ['mountain'], ID: ['mountain'],
  WV: ['southeast'], VA: ['southeast'], DE: ['northeast'], MD: ['northeast'], DC: ['northeast'],
}

// Which meal regions to prioritize for each location region
const REGION_PRIORITY = {
  southwest: ['mexican', 'latin_american', 'tex_mex'],
  southeast: ['southern', 'creole', 'american'],
  northeast: ['italian', 'american'],
  midwest: ['american', 'eastern_european'],
  west_coast: ['mexican', 'asian', 'american'],
  mountain: ['american'],
  mexican: ['mexican', 'latin_american'],
  japanese: ['japanese'],
  indian: ['indian'],
  chinese: ['chinese', 'asian'],
}

async function getRegionFromCoords(lat, lng) {
  if (!GOOGLE_PLACES_API_KEY || !lat || !lng) return null
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_PLACES_API_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.status !== 'OK' || !data.results?.[0]) return null
    const comp = data.results[0].address_components || []
    const state = comp.find((c) => c.types.includes('administrative_area_level_1'))?.short_name
    const country = comp.find((c) => c.types.includes('country'))?.short_name
    if (country === 'US' && state && STATE_TO_REGION[state]) {
      return STATE_TO_REGION[state][0] // primary region
    }
    if (country === 'MX') return 'mexican'
    if (country === 'JP') return 'japanese'
    if (country === 'IN') return 'indian'
    if (country === 'CN') return 'chinese'
    return null
  } catch {
    return null
  }
}

// Curated meals: { mealName, servings, nutrition, ingredients, instructions, nutritionNotes, allergens }
const MEAL_TEMPLATES = [
  {
    mealName: 'Rice & Black Beans (Gallo Pinto style)',
    servings: 4,
    region: 'latin_american',
    nutrition: { calories: 350, protein: 12, fat: 8, carbs: 55 },
    ingredients: [
      { key: 'rice', quantity: '1 lb', price: 0.92 },
      { key: 'blackBeans', quantity: '2 cans', price: 2.38 },
      { key: 'onions', quantity: '1 onion', price: 0.83 },
      { key: 'garlic', quantity: '2 cloves', price: 0.43 },
      { key: 'oil', quantity: '2 tbsp', price: 0.31 },
      { key: 'salt', quantity: 'pinch', price: 0.1 },
    ],
    instructions: [
      'Cook rice according to package directions. Sauté diced onion and garlic in oil until fragrant.',
      'Add black beans with a bit of their liquid. Mash slightly with the back of a spoon for a creamier texture.',
      'Stir in cooked rice. Let cook until rice absorbs the bean liquid and edges get slightly crispy.',
      'Season with salt. Serve with lime wedges or hot sauce if available—traditional in Latin America.',
    ],
    nutritionNotes: 'Classic Latin American comfort food. Rice and beans together provide complete protein.',
    allergens: ['None'],
    needsStove: true,
  },
  {
    mealName: 'Tuna Salad Sandwiches',
    servings: 4,
    region: 'american',
    nutrition: { calories: 400, protein: 25, fat: 12, carbs: 45 },
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
  },
  {
    mealName: 'Cheese & Apple Snack Plate',
    servings: 4,
    region: 'american',
    nutrition: { calories: 320, protein: 12, fat: 15, carbs: 35 },
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
    mealName: 'Lentil Soup (Shorbat Adas)',
    servings: 6,
    region: 'mediterranean',
    nutrition: { calories: 220, protein: 12, fat: 2, carbs: 38 },
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
      'Sauté diced onion, carrots, and garlic in oil until soft.',
      'Add lentils, broth, and canned tomatoes. Bring to boil, then simmer 30 min until lentils are tender.',
      'Season with salt and a pinch of cumin if available. Serve with warm pita or bread.',
    ],
    nutritionNotes: 'A staple across the Mediterranean and Middle East. Lentils are affordable and filling.',
    allergens: ['None'],
    needsStove: true,
  },
  {
    mealName: 'Chicken & Rice Bowl',
    servings: 4,
    region: 'american',
    nutrition: { calories: 450, protein: 35, fat: 10, carbs: 45 },
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
    region: 'american',
    nutrition: { calories: 400, protein: 14, fat: 18, carbs: 50 },
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
    region: 'italian',
    nutrition: { calories: 350, protein: 12, fat: 8, carbs: 55 },
    ingredients: [
      { key: 'pasta', quantity: '1 lb', price: 1.29 },
      { key: 'cannedTomatoes', quantity: '1 can', price: 1.39 },
      { key: 'onions', quantity: '1 onion', price: 0.83 },
      { key: 'garlic', quantity: '2 cloves', price: 0.43 },
      { key: 'oil', quantity: '2 tbsp', price: 0.31 },
      { key: 'salt', quantity: 'pinch', price: 0.1 },
    ],
    instructions: [
      'Cook pasta in salted water until al dente. Reserve a splash of pasta water, then drain.',
      'Sauté onion and garlic in oil until fragrant. Add canned tomatoes, crush with a spoon, simmer 10 min.',
      'Toss pasta with sauce and a little pasta water. Season with salt. Serve with grated cheese if available.',
    ],
    nutritionNotes: 'Simple Italian-style pasta. Tomatoes provide lycopene and vitamin C.',
    allergens: ['Gluten', 'Wheat'],
    needsStove: true,
  },
  {
    mealName: 'Bean & Cheese Burrito Bowl',
    servings: 4,
    region: 'mexican',
    nutrition: { calories: 400, protein: 18, fat: 12, carbs: 45 },
    ingredients: [
      { key: 'blackBeans', quantity: '2 cans', price: 2.38 },
      { key: 'rice', quantity: '1 lb', price: 0.92 },
      { key: 'cheese', quantity: '4 oz', price: 2.0 },
      { key: 'cannedCorn', quantity: '1 can', price: 0.99 },
      { key: 'onions', quantity: '1/2 onion', price: 0.42 },
    ],
    instructions: [
      'Cook rice. Heat black beans and corn. Season beans with a pinch of salt.',
      'Layer rice, beans, corn, diced onion, and shredded cheese in bowls.',
      'Top with lime, cilantro, or hot sauce if available. Eat as a bowl—common in Mexico and the Southwest.',
    ],
    nutritionNotes: 'Complete protein from beans and rice. Cheese adds calcium.',
    allergens: ['Dairy'],
    needsStove: true,
  },
  {
    mealName: 'Oatmeal with Bananas',
    servings: 4,
    region: 'american',
    nutrition: { calories: 280, protein: 8, fat: 6, carbs: 50 },
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
    region: 'american',
    nutrition: { calories: 320, protein: 18, fat: 15, carbs: 25 },
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
    region: 'eastern_european',
    nutrition: { calories: 180, protein: 6, fat: 2, carbs: 35 },
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
    region: 'american',
    nutrition: { calories: 250, protein: 10, fat: 6, carbs: 40 },
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
  {
    mealName: 'Red Beans & Rice',
    servings: 6,
    region: 'creole',
    nutrition: { calories: 340, protein: 14, fat: 6, carbs: 54 },
    ingredients: [
      { key: 'blackBeans', quantity: '3 cans', price: 3.57 },
      { key: 'rice', quantity: '1 lb', price: 0.92 },
      { key: 'onions', quantity: '1 onion', price: 0.83 },
      { key: 'garlic', quantity: '3 cloves', price: 0.65 },
      { key: 'oil', quantity: '1 tbsp', price: 0.16 },
      { key: 'salt', quantity: 'to taste', price: 0.1 },
    ],
    instructions: [
      'Cook rice. In a pot, sauté onion and garlic in oil until soft.',
      'Add beans (drained, reserve liquid). Mash some beans against the pot for creaminess—traditional Louisiana style.',
      'Simmer 15 min, adding reserved liquid if needed. Season with salt. Serve over rice.',
    ],
    nutritionNotes: 'A Louisiana Monday tradition. Beans and rice provide complete protein.',
    allergens: ['None'],
    needsStove: true,
  },
  {
    mealName: 'Bean & Cheese Tacos',
    servings: 4,
    region: 'mexican',
    nutrition: { calories: 420, protein: 16, fat: 14, carbs: 55 },
    ingredients: [
      { key: 'blackBeans', quantity: '2 cans', price: 2.38 },
      { key: 'tortillas', quantity: '1 pack', price: 2.49 },
      { key: 'cheese', quantity: '4 oz', price: 2.0 },
      { key: 'onions', quantity: '1/2 onion', price: 0.42 },
      { key: 'cannedCorn', quantity: '1 can', price: 0.99 },
    ],
    instructions: [
      'Warm tortillas in a dry pan or briefly over a flame.',
      'Heat beans and corn. Season beans with a pinch of salt.',
      'Fill tortillas with beans, corn, diced onion, and shredded cheese. Serve with lime and hot sauce if available.',
    ],
    nutritionNotes: 'Authentic Mexican street food style. Beans and tortillas are budget staples.',
    allergens: ['Dairy'],
    needsStove: false,
  },
  {
    mealName: 'Chana Masala (Chickpea Curry)',
    servings: 4,
    region: 'indian',
    nutrition: { calories: 320, protein: 14, fat: 8, carbs: 48 },
    ingredients: [
      { key: 'chickpeas', quantity: '2 cans', price: 2.38 },
      { key: 'cannedTomatoes', quantity: '1 can', price: 1.39 },
      { key: 'onions', quantity: '1 onion', price: 0.83 },
      { key: 'garlic', quantity: '3 cloves', price: 0.65 },
      { key: 'oil', quantity: '2 tbsp', price: 0.31 },
      { key: 'salt', quantity: 'to taste', price: 0.1 },
    ],
    instructions: [
      'Sauté diced onion and garlic in oil until golden.',
      'Add canned tomatoes, simmer 5 min. Add chickpeas (drained), simmer 15 min.',
      'Mash some chickpeas for thickness. Season with salt. Serve over rice or with bread.',
    ],
    nutritionNotes: 'Classic North Indian comfort food. Chickpeas are high in fiber and folate.',
    allergens: ['None'],
    needsStove: true,
  },
  {
    mealName: 'Egg Fried Rice',
    servings: 4,
    region: 'asian',
    nutrition: { calories: 380, protein: 14, fat: 12, carbs: 52 },
    ingredients: [
      { key: 'rice', quantity: '1 lb', price: 0.92 },
      { key: 'eggs', quantity: '4 eggs', price: 1.06 },
      { key: 'frozenVeg', quantity: '1 bag', price: 1.99 },
      { key: 'oil', quantity: '2 tbsp', price: 0.31 },
      { key: 'garlic', quantity: '2 cloves', price: 0.43 },
      { key: 'salt', quantity: 'pinch', price: 0.1 },
    ],
    instructions: [
      'Cook rice, let cool. Scramble eggs in a pan, set aside.',
      'Heat oil, stir-fry garlic and frozen vegetables until tender.',
      'Add rice and eggs. Toss until heated. Season with salt. Day-old rice works best.',
    ],
    nutritionNotes: 'Classic Asian comfort food. Use day-old rice for best texture.',
    allergens: ['Eggs'],
    needsStove: true,
  },
  {
    mealName: 'Cucumber Sushi Rolls (Kappa Maki)',
    servings: 4,
    region: 'japanese',
    nutrition: { calories: 280, protein: 6, fat: 2, carbs: 58 },
    ingredients: [
      { key: 'rice', quantity: '1 lb', price: 0.92 },
      { key: 'nori', quantity: '1 pack', price: 3.99 },
      { key: 'riceVinegar', quantity: '2 tbsp', price: 0.5 },
      { key: 'cucumber', quantity: '2 cucumbers', price: 1.5 },
    ],
    instructions: [
      'Cook rice. While warm, fold in rice vinegar and a pinch of salt. Let cool to room temp.',
      'Slice cucumber into thin strips. Place a nori sheet shiny-side down on a bamboo mat or plastic wrap.',
      'Spread a thin layer of rice on nori, leaving 1 inch at top. Add cucumber strips along bottom edge.',
      'Roll tightly, seal with water. Slice into 6–8 pieces. Serve with soy sauce if available.',
    ],
    nutritionNotes: 'Classic Japanese vegetarian sushi. Rice and nori are pantry staples in Japan.',
    allergens: ['None'],
    needsStove: true,
  },
  {
    mealName: 'Onigiri (Rice Balls)',
    servings: 4,
    region: 'japanese',
    nutrition: { calories: 320, protein: 8, fat: 4, carbs: 62 },
    ingredients: [
      { key: 'rice', quantity: '1 lb', price: 0.92 },
      { key: 'nori', quantity: '1 pack', price: 3.99 },
      { key: 'tuna', quantity: '1 can', price: 1.49 },
      { key: 'riceVinegar', quantity: '1 tbsp', price: 0.25 },
    ],
    instructions: [
      'Cook rice. Mix in rice vinegar and salt while warm. Let cool until handleable.',
      'Drain tuna, mix with a little mayo or yogurt if available. Wet hands with salted water.',
      'Form rice into triangles or balls, press a small well, add tuna filling, seal with more rice.',
      'Wrap with nori strip. Eat as a portable meal—classic Japanese convenience food.',
    ],
    nutritionNotes: 'Beloved Japanese snack. Rice and nori are staples; tuna adds protein.',
    allergens: ['Fish'],
    needsStove: true,
  },
  {
    mealName: 'Vegetable Stir Fry with Rice',
    servings: 4,
    region: 'asian',
    nutrition: { calories: 340, protein: 10, fat: 8, carbs: 58 },
    ingredients: [
      { key: 'rice', quantity: '1 lb', price: 0.92 },
      { key: 'frozenVeg', quantity: '1 bag', price: 1.99 },
      { key: 'oil', quantity: '2 tbsp', price: 0.31 },
      { key: 'garlic', quantity: '2 cloves', price: 0.43 },
      { key: 'soySauce', quantity: '2 tbsp', price: 0.3 },
    ],
    instructions: [
      'Cook rice. Heat oil in a wok or large pan over high heat.',
      'Add minced garlic, stir 30 sec. Add frozen vegetables, stir-fry 5–7 min until tender-crisp.',
      'Add soy sauce. Serve over rice.',
    ],
    nutritionNotes: 'Classic Asian stir fry. Quick, budget-friendly, and veggie-packed.',
    allergens: ['None'],
    needsStove: true,
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

app.post('/api/plan-meal', async (req, res) => {
  const { budget, people, allergies, hasStove, lat, lng, nearbyStores: storesFromClient } = req.body || {}
  const nearbyStores = Array.isArray(storesFromClient) ? storesFromClient : []

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

  // Get user's region from location for authentic local suggestions
  let userRegion = null
  if (lat && lng && GOOGLE_PLACES_API_KEY) {
    try {
      userRegion = await getRegionFromCoords(lat, lng)
    } catch {}
  }

  const preferredRegions = userRegion ? (REGION_PRIORITY[userRegion] || []) : []
  // For country-specific regions (Japan, India, China, Mexico), restrict to regional meals only
  const restrictToRegion = userRegion && ['japanese', 'indian', 'chinese', 'mexican'].includes(userRegion)

  const candidates = MEAL_TEMPLATES.filter((m) => {
    if (!canCook && m.needsStove) return false
    if (!allergyMatch(m)) return false
    const totalCost = m.ingredients.reduce((sum, i) => sum + (i.price || 0), 0)
    if (totalCost > budgetNum) return false
    if (m.servings < numPeople) {
      const scale = Math.ceil(numPeople / m.servings)
      if (totalCost * scale > budgetNum) return false
    }
    if (restrictToRegion && preferredRegions.length && !preferredRegions.includes(m.region)) return false
    return true
  })

  if (candidates.length === 0) {
    return res.status(400).json({
      error: `No meals fit your budget ($${budgetNum.toFixed(2)}) and constraints. Try increasing your budget or adjusting allergies/stove options.`,
    })
  }

  const buildMeal = (m) => {
    const scale = Math.max(1, Math.ceil(numPeople / m.servings))
    const totalCost = Math.round(
      m.ingredients.reduce((s, i) => s + (i.price || 0), 0) * scale * 100
    ) / 100
    if (totalCost > budgetNum) return null
    const totalServings = m.servings * scale
    const nut = m.nutrition || {}
    const nutrition = {
      calories: Math.round((nut.calories || 0) * totalServings),
      protein: Math.round((nut.protein || 0) * totalServings),
      fat: Math.round((nut.fat || 0) * totalServings),
      carbs: Math.round((nut.carbs || 0) * totalServings),
    }
    return {
      mealName: m.mealName,
      region: m.region || 'american',
      servings: totalServings,
      totalCost,
      nutrition,
      ingredients: m.ingredients.map((i) => ({
        name: INV[i.key]?.name || i.key,
        price: Math.round((i.price || 0) * scale * 100) / 100,
        quantity: i.quantity,
      })),
      instructions: m.instructions,
      nutritionNotes: m.nutritionNotes,
    }
  }

  const built = candidates.map((m) => buildMeal(m)).filter(Boolean)
  // Sort: regional matches first, then by cost
  const meals = built.sort((a, b) => {
    const aMatch = preferredRegions.includes(a.region)
    const bMatch = preferredRegions.includes(b.region)
    if (aMatch && !bMatch) return -1
    if (!aMatch && bMatch) return 1
    return a.totalCost - b.totalCost
  }).slice(0, 8)

  const recommendedStore = Array.isArray(nearbyStores) && nearbyStores.length
    ? nearbyStores[0]
    : null

  res.json({
    meals,
    budget: budgetNum,
    people: numPeople,
    nearbyStores: Array.isArray(nearbyStores) ? nearbyStores : undefined,
    recommendedStore: recommendedStore ? {
      name: recommendedStore.name,
      address: recommendedStore.address || recommendedStore.vicinity,
    } : null,
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
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=grocery_or_supermarket&key=${GOOGLE_PLACES_API_KEY}`
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

    const results = (data.results || []).slice(0, 10)
    const stores = results.map((p, i) => {
      const loc = p.geometry?.location
      const dist = loc ? haversine(userLat, userLng, loc.lat, loc.lng) : null
      return {
        id: p.place_id || String(i + 1),
        name: p.name,
        address: p.vicinity || p.formatted_address || '',
        distance: dist != null ? `${dist.toFixed(1)} mi` : null,
      }
    })

    // Fetch full addresses via Place Details for top 5 stores
    const topIds = results.slice(0, 5).map((p) => p.place_id).filter(Boolean)
    if (topIds.length && GOOGLE_PLACES_API_KEY) {
      const details = await Promise.all(
        topIds.map((placeId) =>
          fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address&key=${GOOGLE_PLACES_API_KEY}`)
            .then((r) => r.json())
            .then((d) => (d.result?.formatted_address ? { placeId, address: d.result.formatted_address } : null))
            .catch(() => null)
        )
      )
      const addrMap = Object.fromEntries((details.filter(Boolean) || []).map((d) => [d.placeId, d.address]))
      stores.forEach((s, i) => {
        if (addrMap[results[i]?.place_id]) stores[i].address = addrMap[results[i].place_id]
      })
    }

    res.json(stores)
  } catch (err) {
    console.error('Places API error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Geocode address to lat/lng (for address search)
app.get('/api/geocode', async (req, res) => {
  const { address } = req.query
  if (!address) {
    return res.status(400).json({ error: 'Address required' })
  }
  if (!GOOGLE_PLACES_API_KEY) {
    return res.status(503).json({ error: 'Geocoding not configured. Add GOOGLE_PLACES_API_KEY to backend/.env' })
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
