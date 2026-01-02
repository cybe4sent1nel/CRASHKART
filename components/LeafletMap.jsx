'use client'

import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const LeafletMap = ({ selectedLocation, onLocationSelect }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const [loading, setLoading] = useState(() =>
    typeof navigator !== 'undefined' && !!navigator.geolocation
  )

  function addMarker(map, location) {
    // Remove old marker
    if (markerRef.current) {
      map.removeLayer(markerRef.current)
    }

    // Create custom icon using placeholder marker
     const markerIcon = L.icon({
       iconUrl: 'https://unnecessary-silver-ntzjyioib0-qm1gxg645d.edgeone.dev/placeholder.png',
       iconSize: [48, 48],
       iconAnchor: [24, 48],
       popupAnchor: [0, -48],
       className: 'crashkart-marker',
       shadowUrl: undefined
     })

    const newMarker = L.marker(location, {
      icon: markerIcon,
      draggable: true,
      title: 'Drag to adjust location or click map to place'
    }).addTo(map)

    // Show popup with coordinates
    newMarker.bindPopup(`
      <div style="
        font-size: 12px;
        padding: 8px;
        min-width: 150px;
      ">
        <p style="margin: 0 0 8px 0; font-weight: bold; color: #dc2626;">
          📍 Location Selected
        </p>
        <p style="margin: 0 0 4px 0; color: #666;">
          <strong>Lat:</strong> ${location.lat.toFixed(6)}
        </p>
        <p style="margin: 0; color: #666;">
          <strong>Lng:</strong> ${location.lng.toFixed(6)}
        </p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">
          Drag marker or click map
        </p>
      </div>
    `)

    // Reverse geocode on drag end
    newMarker.on('dragend', () => {
      const pos = newMarker.getLatLng()
      newMarker.setPopupContent(`
        <div style="
          font-size: 12px;
          padding: 8px;
          min-width: 150px;
        ">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #dc2626;">
            📍 Location Updated
          </p>
          <p style="margin: 0 0 4px 0; color: #666;">
            <strong>Lat:</strong> ${pos.lat.toFixed(6)}
          </p>
          <p style="margin: 0; color: #666;">
            <strong>Lng:</strong> ${pos.lng.toFixed(6)}
          </p>
        </div>
      `)
      reverseGeocodeLocation(pos.lat, pos.lng)
    })

    markerRef.current = newMarker
  }

  async function reverseGeocodeLocation(lat, lng) {
    try {
      // Use Nominatim for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      )
      const data = await response.json()

      if (data && data.address) {
        const address = data.display_name || ''
        const pincode = data.address.postcode || ''

        onLocationSelect({
          lat,
          lng,
          address,
          pincode
        })

        // Update marker popup with address
        if (markerRef.current) {
          markerRef.current.setPopupContent(`
            <div style="
              font-size: 12px;
              padding: 8px;
              min-width: 180px;
            ">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #dc2626;">
                📍 ${address.split(',')[0]}
              </p>
              <p style="margin: 0 0 6px 0; color: #666; max-height: 60px; overflow-y: auto;">
                ${address}
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #999; padding-top: 6px; border-top: 1px solid #eee;">
                Lat: ${lat.toFixed(6)} | Lng: ${lng.toFixed(6)}
              </p>
            </div>
          `)
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
  }

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map with OpenStreetMap tiles
    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5)
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    // Add CrashKart logo with copyright on map
     const logoControl = L.control({ position: 'bottomright' })
     logoControl.onAdd = function (map) {
       const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar')
       div.innerHTML = `
         <div style="
           background: white;
           padding: 8px 12px;
           border-radius: 4px;
           font-size: 11px;
           color: #666;
           display: flex;
           align-items: center;
           gap: 6px;
           box-shadow: 0 1px 5px rgba(0,0,0,0.2);
           font-weight: 500;
         ">
           <img src="/logo.bmp" alt="CrashKart" style="width: 16px; height: 16px; object-fit: contain;" />
           <span>© CrashKart 2025</span>
         </div>
       `
       return div
     }
     logoControl.addTo(map)

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 13)
            addMarker(mapInstanceRef.current, { lat: latitude, lng: longitude })
            reverseGeocodeLocation(latitude, longitude)
          }
          setLoading(false)
        },
        () => {
          console.log('Geolocation permission denied or unavailable')
          setLoading(false)
        }
      )
    }

    // Add click listener to map
    map.on('click', (event) => {
      const { lat, lng } = event.latlng
      addMarker(map, { lat, lng })
      reverseGeocodeLocation(lat, lng)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update marker when selectedLocation changes
  useEffect(() => {
    if (selectedLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView([selectedLocation.lat, selectedLocation.lng], 13)
      addMarker(mapInstanceRef.current, {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng
      })
    }
  }, [selectedLocation])

  return (
    <div
      ref={mapRef}
      className="w-full h-96 rounded-lg border border-slate-300 dark:border-slate-600 mb-6 relative"
      style={{ zIndex: 1 }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-lg z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      )}
    </div>
  )
}

export default LeafletMap
