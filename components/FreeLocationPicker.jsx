'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MapPin, Loader, AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import Leaflet to avoid SSR issues
const DynamicMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => <div className="w-full h-96 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center"><Loader className="animate-spin" /></div>
})

const FreeLocationPicker = ({ 
  onLocationSelect, 
  initialAddress = null
}) => {
  const [pincodeInput, setPincodeInput] = useState('')
  const [addressInput, setAddressInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [mapKey, setMapKey] = useState(0)

  // Handle pincode search using free API
  const handlePincodeSearch = async (e) => {
    e.preventDefault()
    if (!pincodeInput.trim()) return

    setLoading(true)
    setError('')
    
    try {
      // Use free Postalpincode API for India
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincodeInput}`)
      const data = await response.json()

      if (data && data[0] && data[0].Status === 'Success') {
        const postOffice = data[0].PostOffice[0]
        const city = postOffice.District
        const state = postOffice.State
        const address = `${postOffice.Name}, ${city}, ${state}`

        // Use Nominatim for reverse geocoding to get coordinates
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
        )
        const nominatimData = await nominatimResponse.json()

        if (nominatimData && nominatimData.length > 0) {
          const location = nominatimData[0]
          setSelectedLocation({
            lat: parseFloat(location.lat),
            lng: parseFloat(location.lon),
            address: address,
            pincode: pincodeInput,
            city: city,
            state: state
          })
          setAddressInput(address)
          setMapKey(prev => prev + 1) // Trigger map update
        } else {
          setError('Could not find coordinates for this pincode. Try entering the address manually.')
        }
      } else {
        setError('Invalid pincode. Please enter a valid Indian pincode.')
      }
    } catch (err) {
      console.error('Pincode lookup error:', err)
      setError('Failed to lookup pincode. Please check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  // Handle address search using Nominatim
  const handleAddressSearch = async (address) => {
    if (!address.trim()) return

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ', India')}&format=json&limit=1`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const location = data[0]
        setSelectedLocation({
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon),
          address: location.display_name,
          pincode: pincodeInput || ''
        })
        setAddressInput(location.display_name)
        setMapKey(prev => prev + 1)
      } else {
        setError('Location not found. Please try a different address.')
      }
    } catch (err) {
      console.error('Address search error:', err)
      setError('Failed to search address.')
    } finally {
      setLoading(false)
    }
  }

  const handleMapLocationSelect = (location) => {
    setSelectedLocation(location)
    setAddressInput(location.address)
    setPincodeInput(location.pincode || '')
  }

  const handleConfirmLocation = () => {
    if (!selectedLocation) {
      setError('Please select a location')
      return
    }

    if (onLocationSelect) {
      onLocationSelect({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        address: selectedLocation.address || addressInput,
        pincode: selectedLocation.pincode || pincodeInput,
        city: selectedLocation.city || '',
        state: selectedLocation.state || ''
      })
    }
  }

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <MapPin size={24} className="text-red-600" />
        Select Delivery Location
      </h3>

      {/* Info Banner */}
      <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm flex items-start gap-2">
        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
        <p>Using OpenStreetMap & free location APIs - No billing account needed</p>
      </div>

      {/* Search Inputs */}
      <div className="space-y-4 mb-6">
        {/* Pincode Search */}
        <form onSubmit={handlePincodeSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Indian pincode (6 digits)..."
            value={pincodeInput}
            onChange={(e) => setPincodeInput(e.target.value)}
            maxLength="6"
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition flex items-center gap-2"
          >
            {loading ? <Loader size={20} className="animate-spin" /> : 'Search'}
          </button>
        </form>

        {/* Address Search */}
        <input
          type="text"
          placeholder="Search address..."
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          onBlur={() => {
            if (addressInput && !selectedLocation?.address?.includes(addressInput)) {
              handleAddressSearch(addressInput)
            }
          }}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Map Container */}
      {typeof window !== 'undefined' && (
        <DynamicMap 
          key={mapKey}
          selectedLocation={selectedLocation}
          onLocationSelect={handleMapLocationSelect}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            <strong>Selected Address:</strong>
          </p>
          <p className="text-slate-900 dark:text-white mb-2">{selectedLocation.address || addressInput}</p>
          {selectedLocation.pincode && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <strong>Pincode:</strong> {selectedLocation.pincode}
            </p>
          )}
          {selectedLocation.city && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <strong>City:</strong> {selectedLocation.city}
            </p>
          )}
          {selectedLocation.state && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <strong>State:</strong> {selectedLocation.state}
            </p>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            <strong>Coordinates:</strong> {selectedLocation.lat?.toFixed(6)}, {selectedLocation.lng?.toFixed(6)}
          </p>
        </div>
      )}

      {/* Confirm Button */}
      <button
        onClick={handleConfirmLocation}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
        disabled={!selectedLocation}
      >
        Confirm Location
      </button>

      <p className="text-xs text-slate-600 dark:text-slate-400 mt-4 text-center">
        You can click on the map to drop a pin, drag the marker to adjust, search by pincode, or search by address
      </p>
    </div>
  )
}

export default FreeLocationPicker
