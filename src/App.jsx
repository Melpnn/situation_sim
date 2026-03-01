import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  Users,
  Flame,
  AlertTriangle,
  ChevronRight,
  UtensilsCrossed,
  ShoppingBag,
  Leaf,
  MapPin,
  Loader2,
  Store,
} from 'lucide-react'

const COMMON_ALLERGIES = [
  'Peanuts', 'Tree nuts', 'Dairy', 'Eggs', 'Gluten', 'Shellfish',
  'Soy', 'Fish', 'Sesame', 'Wheat', 'Corn',
]

function App() {
  const [budget, setBudget] = useState('')
  const [people, setPeople] = useState('4')
  const [allergies, setAllergies] = useState([])
  const [hasStove, setHasStove] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [error, setError] = useState('')

  const [address, setAddress] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [nearbyStores, setNearbyStores] = useState([])
  const [coords, setCoords] = useState(null)

  const toggleAllergy = (a) => {
    setAllergies((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  }

  const fetchNearbyStores = async (lat, lng) => {
    setLocationLoading(true)
    setLocationError('')
    try {
      const res = await fetch(`/api/nearby-stores?lat=${lat}&lng=${lng}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch stores')
      setNearbyStores(Array.isArray(data) ? data : [])
      setCoords({ lat, lng })
    } catch (err) {
      setLocationError(err.message)
      setNearbyStores([])
    } finally {
      setLocationLoading(false)
    }
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported')
      return
    }
    setLocationLoading(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchNearbyStores(pos.coords.latitude, pos.coords.longitude),
      () => {
        setLocationError('Location access denied')
        setLocationLoading(false)
      }
    )
  }

  const searchByAddress = async () => {
    if (!address.trim()) {
      setLocationError('Enter an address')
      return
    }
    setLocationLoading(true)
    setLocationError('')
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Address not found')
      await fetchNearbyStores(data.lat, data.lng)
    } catch (err) {
      setLocationError(err.message)
      setLocationLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setSelectedMeal(null)

    const budgetNum = parseFloat(budget?.replace(/[^0-9.]/g, ''))
    if (!budgetNum || budgetNum <= 0) {
      setError('Please enter a valid budget amount.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/plan-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: budgetNum,
          people: parseInt(people) || 4,
          allergies,
          hasStove,
          lat: coords?.lat,
          lng: coords?.lng,
          nearbyStores: nearbyStores.length ? nearbyStores : undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }
      setResult(data)
      if (data.meals?.length) setSelectedMeal(data.meals[0])
    } catch (err) {
      setError('Could not reach server. Make sure the backend is running: npm run server')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setSelectedMeal(null)
    setError('')
  }

  const meal = selectedMeal || result?.meals?.[0]
  const stores = result?.nearbyStores || []
  const recommended = result?.recommendedStore

  return (
    <div className="min-h-screen cafe-warm-bg text-cafe-espresso">
      <header className="border-b border-cafe-foam bg-cafe-latte/95 backdrop-blur-sm sticky top-0 z-10 shadow-cafe">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cafe-caramel to-cafe-rose flex items-center justify-center shadow-cafe">
            <UtensilsCrossed className="text-white" size={22} />
          </div>
          <div>
            <h1 className="font-serif text-xl font-semibold text-cafe-espresso">MealStretch</h1>
            <p className="text-xs text-cafe-walnut/80">Budget meal planning for families</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              <div>
                <h2 className="font-serif text-2xl font-semibold text-cafe-espresso mb-1">
                  Plan a meal within your budget
                </h2>
                <p className="text-cafe-walnut/90 text-sm">
                  Enter your total budget. We'll suggest several healthy options—pick the one you like.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-cafe-espresso mb-2">
                    Find nearby grocery stores (optional)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={useMyLocation}
                      disabled={locationLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-cafe-foam bg-white text-cafe-espresso hover:border-cafe-caramel hover:shadow-cafe transition-all disabled:opacity-60"
                    >
                      {locationLoading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                      Use my location
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Or enter address (e.g. 123 Main St, City)"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchByAddress())}
                      className="flex-1 px-4 py-3 rounded-2xl border border-cafe-foam bg-white text-cafe-espresso placeholder:text-cafe-walnut/60 focus:outline-none focus:ring-2 focus:ring-cafe-caramel/40 focus:border-cafe-caramel"
                    />
                    <button
                      type="button"
                      onClick={searchByAddress}
                      disabled={locationLoading}
                      className="px-4 py-3 rounded-2xl bg-cafe-foam text-cafe-espresso hover:bg-cafe-caramel/20 disabled:opacity-60 font-medium"
                    >
                      Search
                    </button>
                  </div>
                  {locationError && (
                    <p className="mt-1 text-sm text-rose-600">{locationError}</p>
                  )}
                  {nearbyStores.length > 0 && (
                    <div className="mt-3 p-4 rounded-2xl bg-cafe-latte border border-cafe-foam shadow-cafe">
                      <p className="text-sm font-medium text-cafe-espresso mb-2 flex items-center gap-2">
                        <Store size={16} className="text-cafe-caramel" /> Nearby stores
                      </p>
                      <ul className="text-sm text-cafe-walnut space-y-2">
                        {nearbyStores.slice(0, 5).map((s) => (
                          <li key={s.id} className="flex flex-col gap-0.5">
                            <span className="font-medium text-cafe-espresso">{s.name}</span>
                            {s.address && <span className="text-cafe-walnut/80 text-xs">{s.address}</span>}
                            {s.distance && <span className="text-cafe-sage text-xs">{s.distance}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-cafe-espresso mb-2">
                    Total budget for this meal (any amount)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-cafe-caramel" size={20} />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 15.00"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-cafe-foam bg-white text-cafe-espresso placeholder:text-cafe-walnut/60 focus:outline-none focus:ring-2 focus:ring-cafe-caramel/40 focus:border-cafe-caramel"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cafe-espresso mb-2">
                    How many people to feed?
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-cafe-caramel" size={20} />
                    <select
                      value={people}
                      onChange={(e) => setPeople(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-cafe-foam bg-white text-cafe-espresso focus:outline-none focus:ring-2 focus:ring-cafe-caramel/40 focus:border-cafe-caramel appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-cafe-walnut/60 rotate-90 pointer-events-none" size={18} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cafe-espresso mb-2">
                    Do you have access to a cooking stove?
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setHasStove(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border transition-all font-medium ${
                        hasStove
                          ? 'bg-cafe-caramel/20 border-cafe-caramel text-cafe-espresso shadow-cafe'
                          : 'bg-white border-cafe-foam text-cafe-walnut hover:border-cafe-caramel/50'
                      }`}
                    >
                      <Flame size={18} /> Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasStove(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border transition-all font-medium ${
                        !hasStove
                          ? 'bg-cafe-caramel/20 border-cafe-caramel text-cafe-espresso shadow-cafe'
                          : 'bg-white border-cafe-foam text-cafe-walnut hover:border-cafe-caramel/50'
                      }`}
                    >
                      No stove
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cafe-espresso mb-2">
                    Allergies (tap to select)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ALLERGIES.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAllergy(a)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                          allergies.includes(a)
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-white text-cafe-walnut border border-cafe-foam hover:border-cafe-caramel/50'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                  <AlertTriangle size={18} className="shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cafe-walnut to-cafe-espresso text-white font-semibold shadow-cafe-lg hover:shadow-cafe transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Finding meals...' : 'Find my meals'}
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {stores.length > 0 && (
                <div className="p-4 rounded-2xl bg-cafe-latte border border-cafe-foam shadow-cafe">
                  <p className="font-medium text-cafe-espresso text-sm mb-2 flex items-center gap-2">
                    <Store size={18} className="text-cafe-caramel" /> Nearby stores (with addresses)
                  </p>
                  <ul className="text-sm text-cafe-walnut space-y-2">
                    {stores.slice(0, 5).map((s) => (
                      <li key={s.id} className="flex flex-col gap-0.5">
                        <span className="font-medium text-cafe-espresso">{s.name}</span>
                        {s.address && <span className="text-cafe-walnut/80 text-xs">{s.address}</span>}
                        {s.distance && <span className="text-cafe-sage text-xs">{s.distance}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recommended && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-cafe-sage/15 border border-cafe-sage/40">
                  <Store className="text-cafe-sage shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-cafe-sage text-sm">Recommended store for this recipe</p>
                    <p className="text-cafe-espresso font-medium mt-0.5">{recommended.name}</p>
                    {recommended.address && <p className="text-cafe-walnut/90 text-sm mt-0.5">{recommended.address}</p>}
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-cafe-espresso">Choose your meal</h2>
                  <p className="text-cafe-walnut/90 text-sm mt-1">
                    Select one of {result.meals?.length || 0} options below
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="text-sm font-medium text-cafe-rose hover:text-cafe-espresso transition-colors"
                >
                  Plan another
                </button>
              </div>

              <div className="grid gap-2">
                {(result.meals || []).map((m) => (
                  <button
                    key={m.mealName}
                    type="button"
                    onClick={() => setSelectedMeal(m)}
                    className={`text-left p-4 rounded-2xl border transition-all ${
                      meal?.mealName === m.mealName
                        ? 'bg-cafe-caramel/20 border-cafe-caramel shadow-cafe'
                        : 'bg-white border-cafe-foam hover:border-cafe-caramel/50'
                    }`}
                  >
                    <span className="font-medium text-cafe-espresso">{m.mealName}</span>
                    <span className="block text-sm text-cafe-sage mt-0.5">
                      Feeds {m.servings} · ${m.totalCost?.toFixed(2) || '—'} total
                    </span>
                  </button>
                ))}
              </div>

              {meal && (
                <>
                  <div className="flex items-start justify-between gap-4 pt-4 border-t border-cafe-foam">
                    <div>
                      <h2 className="font-serif text-xl font-semibold text-cafe-espresso">{meal.mealName}</h2>
                      <p className="text-cafe-walnut mt-1">
                        Feeds {result.people} · ${meal.totalCost?.toFixed(2) || '—'} total
                        (under ${result.budget?.toFixed(2)} budget)
                      </p>
                    </div>
                  </div>

                  {meal.nutritionNotes && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-cafe-sage/15 border border-cafe-sage/40">
                      <Leaf className="text-cafe-sage shrink-0 mt-0.5" size={20} />
                      <p className="text-cafe-espresso/90 text-sm">{meal.nutritionNotes}</p>
                    </div>
                  )}

                  <div className="rounded-2xl border border-cafe-foam bg-white overflow-hidden shadow-cafe">
                    <div className="px-4 py-3 bg-cafe-latte border-b border-cafe-foam flex items-center gap-2">
                      <ShoppingBag size={18} className="text-cafe-caramel" />
                      <span className="font-semibold text-cafe-espresso">Ingredients to buy</span>
                    </div>
                    <ul className="divide-y divide-cafe-foam">
                      {(meal.ingredients || []).map((ing, i) => (
                        <li key={i} className="px-4 py-3 flex justify-between items-center">
                          <span className="text-cafe-walnut">
                            {ing.quantity ? `${ing.quantity} ` : ''}{ing.name}
                          </span>
                          <span className="font-medium text-cafe-espresso">
                            ${typeof ing.price === 'number' ? ing.price.toFixed(2) : '—'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-cafe-foam bg-white overflow-hidden shadow-cafe">
                    <div className="px-4 py-3 bg-cafe-latte border-b border-cafe-foam flex items-center gap-2">
                      <UtensilsCrossed size={18} className="text-cafe-caramel" />
                      <span className="font-semibold text-cafe-espresso">How to make it</span>
                    </div>
                    {recommended && (
                      <div className="px-4 py-2 bg-cafe-sage/10 border-b border-cafe-foam text-sm text-cafe-sage">
                        Shop at: <strong>{recommended.name}</strong>
                        {recommended.address && <> — {recommended.address}</>}
                      </div>
                    )}
                    <ol className="divide-y divide-cafe-foam">
                      {(meal.instructions || []).map((step, i) => (
                        <li key={i} className="px-4 py-3 flex gap-3">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-cafe-caramel/30 text-cafe-espresso text-sm font-semibold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-cafe-walnut">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-16 py-8 text-center text-cafe-walnut/70 text-sm">
        <p>MealStretch helps families eat well on a budget.</p>
      </footer>
    </div>
  )
}

export default App
