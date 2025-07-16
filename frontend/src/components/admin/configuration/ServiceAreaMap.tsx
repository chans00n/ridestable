import React, { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, MapPin, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import { showToast } from '@/components/ui/Toast'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface ServiceArea {
  id: string
  name: string
  description?: string
  polygon?: any
  center: { lat: number; lng: number }
  radius?: number
  surchargeAmount?: number
  surchargePercentage?: number
  isActive: boolean
  restrictions?: any
}

interface ServiceAreaMapProps {
  serviceAreas: ServiceArea[]
  onEdit: (area: ServiceArea) => void
  onToggle: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
}

export default function ServiceAreaMap({ serviceAreas, onEdit, onToggle, onDelete }: ServiceAreaMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const layerGroup = useRef<L.LayerGroup | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleAreas, setVisibleAreas] = useState<Set<string>>(new Set(serviceAreas.map(a => a.id)))

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return

    // Initialize map centered on a default location (can be changed based on business location)
    mapInstance.current = L.map(mapContainer.current).setView([37.7749, -122.4194], 10)

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance.current)

    // Initialize layer group for service areas
    layerGroup.current = L.layerGroup().addTo(mapInstance.current)

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapInstance.current || !layerGroup.current) return

    // Clear existing layers
    layerGroup.current.clearLayers()

    // Add service areas to map
    serviceAreas.forEach(area => {
      if (!visibleAreas.has(area.id)) return

      let layer: L.Layer

      if (area.polygon) {
        // Create polygon from GeoJSON
        layer = L.geoJSON(area.polygon, {
          style: {
            color: area.isActive ? '#3b82f6' : '#6b7280',
            weight: 2,
            opacity: 0.8,
            fillOpacity: area.surchargeAmount || area.surchargePercentage ? 0.3 : 0.2,
            fillColor: area.surchargeAmount || area.surchargePercentage ? '#f97316' : '#3b82f6'
          }
        })
      } else if (area.radius) {
        // Create circle
        layer = L.circle([area.center.lat, area.center.lng], {
          radius: area.radius * 1000, // Convert km to meters
          color: area.isActive ? '#3b82f6' : '#6b7280',
          weight: 2,
          opacity: 0.8,
          fillOpacity: area.surchargeAmount || area.surchargePercentage ? 0.3 : 0.2,
          fillColor: area.surchargeAmount || area.surchargePercentage ? '#f97316' : '#3b82f6'
        })
      } else {
        // Create marker for point
        layer = L.marker([area.center.lat, area.center.lng])
      }

      // Add popup with area info
      const popupContent = `
        <div class="p-3">
          <h3 class="font-bold text-lg mb-2">${area.name}</h3>
          ${area.description ? `<p class="text-sm text-gray-600 mb-2">${area.description}</p>` : ''}
          <div class="space-y-1 text-sm">
            <div class="flex items-center justify-between">
              <span>Status:</span>
              <span class="${area.isActive ? 'text-green-600' : 'text-gray-500'} font-medium">
                ${area.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            ${area.surchargeAmount || area.surchargePercentage ? `
              <div class="flex items-center justify-between">
                <span>Surcharge:</span>
                <span class="font-medium">
                  ${area.surchargeAmount ? `$${area.surchargeAmount}` : ''}
                  ${area.surchargeAmount && area.surchargePercentage ? ' + ' : ''}
                  ${area.surchargePercentage ? `${area.surchargePercentage}%` : ''}
                </span>
              </div>
            ` : ''}
          </div>
          <div class="flex gap-2 mt-3">
            <button onclick="window.editServiceArea('${area.id}')" class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
              Edit
            </button>
            <button onclick="window.toggleServiceArea('${area.id}', ${!area.isActive})" class="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">
              ${area.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button onclick="window.deleteServiceArea('${area.id}')" class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
              Delete
            </button>
          </div>
        </div>
      `
      layer.bindPopup(popupContent, { maxWidth: 300 })

      layerGroup.current?.addLayer(layer)
    })

    // Fit map to show all visible areas
    if (serviceAreas.filter(a => visibleAreas.has(a.id)).length > 0) {
      const bounds = L.latLngBounds(
        serviceAreas
          .filter(a => visibleAreas.has(a.id))
          .map(a => [a.center.lat, a.center.lng])
      )
      mapInstance.current?.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [serviceAreas, visibleAreas])

  // Set up global functions for popup buttons
  useEffect(() => {
    (window as any).editServiceArea = (id: string) => {
      const area = serviceAreas.find(a => a.id === id)
      if (area) onEdit(area)
    }
    
    (window as any).toggleServiceArea = (id: string, isActive: boolean) => {
      onToggle(id, isActive)
    }
    
    (window as any).deleteServiceArea = (id: string) => {
      onDelete(id)
    }

    return () => {
      delete (window as any).editServiceArea
      delete (window as any).toggleServiceArea
      delete (window as any).deleteServiceArea
    }
  }, [serviceAreas, onEdit, onToggle, onDelete])

  const handleSearch = () => {
    if (!searchQuery || !mapInstance.current) return

    const matchingArea = serviceAreas.find(area =>
      area.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (matchingArea) {
      mapInstance.current.setView([matchingArea.center.lat, matchingArea.center.lng], 13)
      // Show area if hidden
      if (!visibleAreas.has(matchingArea.id)) {
        setVisibleAreas(prev => new Set([...prev, matchingArea.id]))
      }
    } else {
      showToast.error('No matching service area found')
    }
  }

  const toggleAreaVisibility = (areaId: string) => {
    setVisibleAreas(prev => {
      const newSet = new Set(prev)
      if (newSet.has(areaId)) {
        newSet.delete(areaId)
      } else {
        newSet.add(areaId)
      }
      return newSet
    })
  }

  const filteredAreas = serviceAreas.filter(area =>
    area.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <Card className="h-[600px]">
          <div ref={mapContainer} className="h-full w-full rounded-lg" />
        </Card>
      </div>
      
      <div className="space-y-4">
        <Card>
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search areas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-8"
              />
            </div>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredAreas.map(area => (
                <div
                  key={area.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-sm">{area.name}</h4>
                    <button
                      onClick={() => toggleAreaVisibility(area.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {visibleAreas.has(area.id) ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={area.isActive ? 'default' : 'secondary'} className="text-xs">
                      {area.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {(area.surchargeAmount || area.surchargePercentage) && (
                      <Badge variant="outline" className="text-xs">
                        Surcharge
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        mapInstance.current?.setView([area.center.lat, area.center.lng], 13)
                        if (!visibleAreas.has(area.id)) {
                          toggleAreaVisibility(area.id)
                        }
                      }}
                    >
                      <MapPin className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(area)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(area.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}