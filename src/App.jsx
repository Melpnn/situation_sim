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
      setNearbyStores(data)
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
          nearbyStores: nearbyStores.length ? nearbyStores.map((s) => s.name) : undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }
      setResult(data)
    } catch (err) {
      setError('Could not reach server. Make sure the backend is running: npm run server')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50">
      <header className="border-b border-amber-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <UtensilsCrossed className="text-white" size={22} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800">MealStretch</h1>
            <p className="text-xs text-slate-500">Budget meal planning for families</p>
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
                <h2 className="text-2xl font-bold text-slate-800 mb-1">
                  Plan a meal within your budget
                </h2>
                <p className="text-slate-600 text-sm">
                  Enter your total budget for the whole meal. We'll suggest a healthy option that feeds everyone.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Find nearby grocery stores (optional)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={useMyLocation}
                      disabled={locationLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60"
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
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    <button
                      type="button"
                      onClick={searchByAddress}
                      disabled={locationLoading}
                      className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                    >
                      Search
                    </button>
                  </div>
                  {locationError && (
                    <p className="mt-1 text-sm text-rose-600">{locationError}</p>
                  )}
                  {nearbyStores.length > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                      <p className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                        <Store size={16} /> Nearby stores
                      </p>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {nearbyStores.slice(0, 5).map((s) => (
                          <li key={s.id}>
                            {s.name} {s.distance && `· ${s.distance}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Total budget for this meal (any amount)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 15.00"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    How many people to feed?
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <select
                      value={people}
                      onChange={(e) => setPeople(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={18} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Do you have access to a cooking stove?
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setHasStove(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border transition-all ${
                        hasStove
                          ? 'bg-amber-50 border-amber-400 text-amber-800'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <Flame size={18} /> Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasStove(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border transition-all ${
                        !hasStove
                          ? 'bg-amber-50 border-amber-400 text-amber-800'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      No stove
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Allergies (tap to select)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ALLERGIES.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAllergy(a)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          allergies.includes(a)
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-transparent hover:bg-slate-200'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                  <AlertTriangle size={18} className="shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-lg shadow-lg shadow-amber-500/25 hover:shadow-amber-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Finding the best meal...' : 'Find my meal'}
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
              {result.nearbyStores?.length > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <Store className="text-amber-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-amber-800 text-sm">Shop at these nearby stores</p>
                    <p className="text-amber-700 text-sm mt-0.5">{result.nearbyStores.join(' · ')}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{result.meal.mealName}</h2>
                  <p className="text-slate-600 mt-1">
                    Feeds {result.people} · ${result.meal.totalCost?.toFixed(2) || '—'} total
                    (under ${result.budget.toFixed(2)} budget)
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="text-sm font-medium text-amber-600 hover:text-amber-700"
                >
                  Plan another
                </button>
              </div>

              {result.meal.nutritionNotes && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                  <Leaf className="text-green-600 shrink-0 mt-0.5" size={20} />
                  <p className="text-green-800 text-sm">{result.meal.nutritionNotes}</p>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-slate-600" />
                  <span className="font-semibold text-slate-800">Ingredients to buy</span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {(result.meal.ingredients || []).map((ing, i) => (
                    <li key={i} className="px-4 py-3 flex justify-between items-center">
                      <span className="text-slate-700">
                        {ing.quantity ? `${ing.quantity} ` : ''}{ing.name}
                      </span>
                      <span className="font-medium text-amber-700">
                        ${typeof ing.price === 'number' ? ing.price.toFixed(2) : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <UtensilsCrossed size={18} className="text-slate-600" />
                  <span className="font-semibold text-slate-800">How to make it</span>
                </div>
                <ol className="divide-y divide-slate-100">
                  {(result.meal.instructions || []).map((step, i) => (
                    <li key={i} className="px-4 py-3 flex gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-slate-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-16 py-8 text-center text-slate-500 text-sm">
        <p>MealStretch helps families eat well on a budget.</p>
      </footer>
    </div>
  )
}

export default App
