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

  const formatRegion = (r) => r?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || ''

  const NutritionBadge = ({ label, value, color }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${color}`}>
      {label} {value}
    </span>
  )

  return (
    <div className="min-h-screen cafe-warm-bg text-slate-800">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 via-rose-400 to-amber-500 flex items-center justify-center shadow-lg ring-2 ring-white/50">
            <UtensilsCrossed className="text-white drop-shadow-sm" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-rose-500 to-amber-600 bg-clip-text text-transparent tracking-tight">MealStretch</h1>
            <p className="text-sm text-slate-600">Budget meal planning for families</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              <div className="text-center sm:text-left p-5 rounded-2xl bg-gradient-to-r from-amber-100/80 via-rose-50/80 to-amber-100/80 border border-amber-200/60">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 tracking-tight">
                  Plan a meal within your budget
                </h2>
                <p className="text-slate-600 text-base leading-relaxed">
                  Enter your total budget. We'll suggest several healthy options—pick the one you like.
                </p>
              </div>

              <div className="space-y-6">
                <div className="p-5 sm:p-6 rounded-3xl bg-white/80 border border-teal-200/60 shadow-sm">
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    Find nearby grocery stores (optional)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={useMyLocation}
                      disabled={locationLoading}
                      className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border-2 border-teal-200 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50/50 active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
                    >
                      {locationLoading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                      Use my location
                    </button>
                    <div className="flex gap-2 flex-1">
                      <input
                        type="text"
                        placeholder="Or enter address (e.g. 123 Main St, City)"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchByAddress())}
                        className="flex-1 px-4 py-3 rounded-2xl border-2 border-teal-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200/50 transition-shadow"
                      />
                      <button
                        type="button"
                        onClick={searchByAddress}
                        disabled={locationLoading}
                        className="px-5 py-3 rounded-2xl bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 font-semibold"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                  {locationError && (
                    <p className="mt-1 text-sm text-rose-600">{locationError}</p>
                  )}
                  {nearbyStores.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 p-4 rounded-2xl bg-teal-50/80 border border-teal-200/60"
                    >
                      <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Store size={16} className="text-teal-600" /> Nearby stores
                      </p>
                      <ul className="text-sm text-slate-600 space-y-2.5">
                        {nearbyStores.slice(0, 5).map((s) => (
                          <li key={s.id} className="flex flex-col gap-0.5 pl-1">
                            <span className="font-medium text-slate-800">{s.name}</span>
                            {s.address && <span className="text-slate-500 text-xs leading-relaxed">{s.address}</span>}
                            {s.distance && <span className="text-teal-600 text-xs font-medium">{s.distance}</span>}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>

                <div className="p-5 sm:p-6 rounded-3xl bg-white/80 border border-slate-200/60 shadow-sm space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Total budget for this meal
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={20} />
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="e.g. 15.00"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50 transition-shadow"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      How many people to feed?
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={20} />
                      <select
                        value={people}
                        onChange={(e) => setPeople(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50 appearance-none cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={18} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-3">
                      Do you have access to a cooking stove?
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setHasStove(true)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 transition-all duration-200 font-medium active:scale-[0.98] ${
                          hasStove
                            ? 'bg-orange-100 border-orange-400 text-orange-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Flame size={18} /> Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasStove(false)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 transition-all duration-200 font-medium active:scale-[0.98] ${
                          !hasStove
                            ? 'bg-orange-100 border-orange-400 text-orange-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        No stove
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-3">
                      Allergies (tap to select)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_ALLERGIES.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleAllergy(a)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                            allergies.includes(a)
                              ? 'bg-rose-100 text-rose-800 border-2 border-rose-300'
                              : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-800 text-sm"
                >
                  <AlertTriangle size={20} className="shrink-0" />
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-amber-600 text-white font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    Finding meals...
                  </span>
                ) : (
                  'Find my meals'
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {stores.length > 0 && (
                <div className="p-5 rounded-3xl bg-white/90 border border-teal-200/60 shadow-sm">
                  <p className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
                    <Store size={18} className="text-teal-600" /> Nearby stores
                  </p>
                  <ul className="text-sm text-slate-600 space-y-2.5">
                    {stores.slice(0, 5).map((s) => (
                      <li key={s.id} className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-800">{s.name}</span>
                        {s.address && <span className="text-slate-500 text-xs leading-relaxed">{s.address}</span>}
                        {s.distance && <span className="text-teal-600 text-xs font-medium">{s.distance}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recommended && (
                <div className="flex items-start gap-4 p-5 rounded-3xl bg-teal-50 border-2 border-teal-200/60">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                    <Store className="text-teal-600" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-teal-700 text-sm">Recommended store for this recipe</p>
                    <p className="text-slate-800 font-semibold mt-0.5">{recommended.name}</p>
                    {recommended.address && <p className="text-slate-600 text-sm mt-0.5 leading-relaxed">{recommended.address}</p>}
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Choose your meal</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Select one of {result.meals?.length || 0} options below
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="text-sm font-semibold text-rose-500 hover:text-rose-700 transition-colors py-2 px-4 rounded-xl hover:bg-rose-50"
                >
                  Plan another
                </button>
              </div>

              <div className="grid gap-3">
                {(result.meals || []).map((m, i) => (
                  <motion.button
                    key={m.mealName}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    type="button"
                    onClick={() => setSelectedMeal(m)}
                    className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 active:scale-[0.99] flex gap-4 items-start ${
                      meal?.mealName === m.mealName
                        ? 'bg-amber-50/80 border-amber-400 shadow-md ring-2 ring-amber-200/50'
                        : 'bg-white border-slate-200 hover:border-amber-300/60 hover:shadow-sm'
                    }`}
                  >
                    {m.image && (
                      <img
                        src={m.image}
                        alt={m.mealName}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800">{m.mealName}</span>
                      {m.region && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                          {formatRegion(m.region)}
                        </span>
                      )}
                    </div>
                    {m.nutrition && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <NutritionBadge label="Cal" value={m.nutrition.calories} color="bg-orange-100 text-orange-800" />
                        <NutritionBadge label="P" value={m.nutrition.protein + 'g'} color="bg-blue-100 text-blue-800" />
                        <NutritionBadge label="F" value={m.nutrition.fat + 'g'} color="bg-amber-100 text-amber-800" />
                        <NutritionBadge label="C" value={m.nutrition.carbs + 'g'} color="bg-emerald-100 text-emerald-800" />
                      </div>
                    )}
                    <span className="block text-sm text-slate-600 mt-1 font-medium">
                      Feeds {m.servings} · ${m.totalCost?.toFixed(2) || '—'} total
                    </span>
                    </div>
                  </motion.button>
                ))}
              </div>

              {meal && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-5"
                >
                  <div className="pt-6 border-t-2 border-slate-200">
                    <div className="flex gap-4 items-start">
                      {meal.image && (
                        <img
                          src={meal.image}
                          alt={meal.mealName}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover shrink-0"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-2xl font-bold text-slate-800">{meal.mealName}</h2>
                          {meal.region && (
                            <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                              {formatRegion(meal.region)}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 mt-1.5 font-medium">
                          Feeds {result.people} · ${meal.totalCost?.toFixed(2) || '—'} total
                          <span className="text-teal-600"> (under ${result.budget?.toFixed(2)} budget)</span>
                        </p>
                      </div>
                    </div>
                    {meal.nutrition && (meal.nutrition.calories > 0 || meal.nutrition.protein > 0 || meal.nutrition.fat > 0 || meal.nutrition.carbs > 0) && (
                      <div className="mt-4 rounded-2xl border-2 border-slate-800/20 bg-white overflow-hidden shadow-sm max-w-xs">
                        <div className="px-4 py-2 bg-slate-800 text-white">
                          <h3 className="font-bold text-sm tracking-tight">Nutrition Facts</h3>
                          <p className="text-white/90 text-xs mt-0.5">Total for {meal.servings} serving{meal.servings !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="px-4 py-3 space-y-2 text-sm">
                          <div className="flex justify-between items-baseline border-b-2 border-slate-800 pb-1">
                            <span className="font-bold text-slate-800">Calories</span>
                            <span className="font-bold text-slate-800">{meal.nutrition.calories || 0}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Total Fat</span>
                            <span>{meal.nutrition.fat || 0}g</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Total Carbohydrate</span>
                            <span>{meal.nutrition.carbs || 0}g</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Protein</span>
                            <span>{meal.nutrition.protein || 0}g</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {meal.nutritionNotes && (
                    <div className="flex items-start gap-4 p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-200/60">
                      <Leaf className="text-emerald-600 shrink-0 mt-0.5" size={22} />
                      <p className="text-slate-700 text-sm leading-relaxed">{meal.nutritionNotes}</p>
                    </div>
                  )}

                  <div className="rounded-3xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
                    <div className="px-5 py-4 bg-amber-50/80 border-b border-slate-200 flex items-center gap-3">
                      <ShoppingBag size={20} className="text-amber-600" />
                      <span className="font-semibold text-slate-800">Ingredients to buy</span>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {(meal.ingredients || []).map((ing, i) => (
                        <li key={i} className="px-5 py-3.5 flex justify-between items-center">
                          <span className="text-slate-700 font-medium">
                            {ing.quantity ? `${ing.quantity} ` : ''}{ing.name}
                          </span>
                          <span className="font-semibold text-slate-800">
                            ${typeof ing.price === 'number' ? ing.price.toFixed(2) : '—'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-3xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
                    <div className="px-5 py-4 bg-rose-50/80 border-b border-slate-200 flex items-center gap-3">
                      <UtensilsCrossed size={20} className="text-rose-600" />
                      <span className="font-semibold text-slate-800">How to make it</span>
                    </div>
                    {recommended && (
                      <div className="px-5 py-3 bg-teal-50 border-b border-slate-200 text-sm text-teal-700 font-medium">
                        Shop at: <strong>{recommended.name}</strong>
                        {recommended.address && <> — {recommended.address}</>}
                      </div>
                    )}
                    <ol className="divide-y divide-slate-100">
                      {(meal.instructions || []).map((step, i) => (
                        <li key={i} className="px-5 py-4 flex gap-4">
                          <span className="shrink-0 w-7 h-7 rounded-full bg-amber-200/60 text-amber-900 text-sm font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-slate-700 leading-relaxed pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 py-10 text-center text-slate-500 text-sm">
        <p className="font-medium">MealStretch helps families eat well on a budget.</p>
      </footer>
    </div>
  )
}

export default App
