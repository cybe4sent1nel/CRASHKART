'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MapPin, Loader } from 'lucide-react'

const GoogleMapLocationPicker = ({ 
  onLocationSelect, 
  initialAddress = null,
  googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 
}) => {
  const mapRef = useRef(null)
  const [map, setMap] = useState(null)
  const [marker, setMarker] = useState(null)
  const [autocomplete, setAutocomplete] = useState(null)
  const [pincodeInput, setPincodeInput] = useState('')
  const [addressInput, setAddressInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedLocation, setSelectedLocation] = useState(null)
  const pincodeInputRef = useRef(null)
  const addressInputRef = useRef(null)

  // Load Google Maps Script
  useEffect(() => {
    if (window.google) {
      initializeMap()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initMap`
    script.async = true
    script.defer = true
    window.initMap = initializeMap
    document.head.appendChild(script)

    return () => {
      window.initMap = null
    }
  }, [googleMapsApiKey])

  const initializeMap = () => {
    if (!mapRef.current) return

    // Default: India center
    const defaultLocation = { lat: 20.5937, lng: 78.9629 }

    const newMap = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center: defaultLocation,
      mapTypeControl: true,
      fullscreenControl: true,
      streetViewControl: false,
    })

    setMap(newMap)

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          newMap.setCenter({ lat: latitude, lng: longitude })
          addMarker(newMap, { lat: latitude, lng: longitude })
          reverseGeocodeLocation(latitude, longitude)
        },
        () => {
          console.log('Geolocation permission denied or unavailable')
        }
      )
    }

    // Add click listener to map
    newMap.addListener('click', (event) => {
      const { lat, lng } = event.latLng
      addMarker(newMap, { lat: lat(), lng: lng() })
      reverseGeocodeLocation(lat(), lng())
    })

    // Setup Address Autocomplete
    setupAddressAutocomplete(newMap)
  }

  const addMarker = (mapInstance, location) => {
    if (marker) marker.setMap(null)

    const newMarker = new window.google.maps.Marker({
      position: location,
      map: mapInstance,
      draggable: true,
    })

    newMarker.addListener('dragend', () => {
      const pos = newMarker.getPosition()
      reverseGeocodeLocation(pos.lat(), pos.lng())
    })

    setMarker(newMarker)
    setSelectedLocation(location)
  }

  const reverseGeocodeLocation = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`
      )
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        const address = result.formatted_address

        // Extract pincode
        let pincode = ''
        result.address_components.forEach((component) => {
          if (component.types.includes('postal_code')) {
            pincode = component.long_name
          }
        })

        setAddressInput(address)
        setPincodeInput(pincode)
        setSelectedLocation({ lat, lng, address, pincode })
      }
    } catch (err) {
      console.error('Geocoding error:', err)
      setError('Failed to get address details')
    }
  }

  const geocodeAddress = async (address) => {
    try {
      setLoading(true)
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`
      )
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        const { lat, lng } = result.geometry.location

        if (map) {
          map.setCenter({ lat, lng })
          addMarker(map, { lat, lng })
        }
        setError('')
      } else {
        setError('Location not found')
      }
    } catch (err) {
      console.error('Geocoding error:', err)
      setError('Failed to search location')
    } finally {
      setLoading(false)
    }
  }

  const setupAddressAutocomplete = (mapInstance) => {
    if (!addressInputRef.current || !window.google) return

    const newAutocomplete = new window.google.maps.places.Autocomplete(
      addressInputRef.current,
      {
        componentRestrictions: { country: 'in' },
        fields: ['formatted_address', 'geometry', 'address_components'],
      }
    )

    newAutocomplete.addListener('place_changed', () => {
      const place = newAutocomplete.getPlace()

      if (!place.geometry) {
        setError('Please select a location from suggestions')
        return
      }

      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      }

      mapInstance.setCenter(location)
      addMarker(mapInstance, location)
      setAddressInput(place.formatted_address)

      // Extract pincode
      let pincode = ''
      place.address_components.forEach((component) => {
        if (component.types.includes('postal_code')) {
          pincode = component.long_name
        }
      })
      setPincodeInput(pincode)

      setSelectedLocation({
        ...location,
        address: place.formatted_address,
        pincode,
      })
      setError('')
    })

    setAutocomplete(newAutocomplete)
  }

  const handlePincodeSearch = async (e) => {
    e.preventDefault()
    if (!pincodeInput.trim()) return
    await geocodeAddress(pincodeInput)
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
        address: addressInput,
        pincode: pincodeInput,
      })
    }
  }

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <MapPin size={24} className="text-red-600" />
        Select Delivery Location
      </h3>

      {/* Search Inputs */}
      <div className="space-y-4 mb-6">
        {/* Pincode Search */}
        <form onSubmit={handlePincodeSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter pincode to search..."
            value={pincodeInput}
            onChange={(e) => setPincodeInput(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
          >
            {loading ? <Loader size={20} className="animate-spin" /> : 'Search'}
          </button>
        </form>

        {/* Address Autocomplete */}
        <input
          ref={addressInputRef}
          type="text"
          placeholder="Search address..."
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-96 rounded-lg border border-slate-300 dark:border-slate-600 mb-6"
      />

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            <strong>Selected Address:</strong>
          </p>
          <p className="text-slate-900 dark:text-white mb-2">{addressInput}</p>
          {pincodeInput && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <strong>Pincode:</strong> {pincodeInput}
            </p>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            <strong>Coordinates:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </p>
        </div>
      )}

      {/* Confirm Button */}
      <button
        onClick={handleConfirmLocation}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition"
      >
        Confirm Location
      </button>

      <p className="text-xs text-slate-600 dark:text-slate-400 mt-4 text-center">
        You can click on the map to drop a pin, drag the marker to adjust, or search by pincode/address
      </p>
    </div>
  )
}

export default GoogleMapLocationPicker
