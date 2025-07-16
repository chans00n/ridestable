import React, { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card } from '@/components/ui/card'
import { showToast } from '@/components/ui/Toast'
import { MapPin, Circle, Hexagon, DollarSign, AlertCircle } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'

interface ServiceArea {
  id?: string
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

interface ServiceAreaFormProps {
  serviceArea: ServiceArea | null
  onSave: (data: ServiceArea) => void
  onCancel: () => void
}

export default function ServiceAreaForm({ serviceArea, onSave, onCancel }: ServiceAreaFormProps) {
  const [formData, setFormData] = useState<ServiceArea>({
    name: '',
    description: '',
    center: { lat: 37.7749, lng: -122.4194 }, // Default to SF
    isActive: true,
    ...serviceArea
  })
  const [areaType, setAreaType] = useState<'polygon' | 'circle'>(
    serviceArea?.polygon ? 'polygon' : 'circle'
  )
  const [mapReady, setMapReady] = useState(false)
  
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const drawnItems = useRef<L.FeatureGroup | null>(null)
  const drawControl = useRef<L.Control.Draw | null>(null)

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return

    // Initialize map
    mapInstance.current = L.map(mapContainer.current).setView(
      [formData.center.lat, formData.center.lng],
      12
    )

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance.current)

    // Initialize drawn items layer
    drawnItems.current = new L.FeatureGroup()
    mapInstance.current.addLayer(drawnItems.current)

    // Add existing area if editing
    if (serviceArea) {
      if (serviceArea.polygon) {
        const layer = L.geoJSON(serviceArea.polygon)
        drawnItems.current.addLayer(layer)
        mapInstance.current.fitBounds(layer.getBounds())
      } else if (serviceArea.radius) {
        const circle = L.circle([serviceArea.center.lat, serviceArea.center.lng], {
          radius: serviceArea.radius * 1000 // Convert km to meters
        })
        drawnItems.current.addLayer(circle)
        mapInstance.current.fitBounds(circle.getBounds())
      }
    }

    // Set up draw control
    setupDrawControl()

    // Handle drawn shapes
    mapInstance.current.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer
      drawnItems.current?.clearLayers()
      drawnItems.current?.addLayer(layer)

      if (areaType === 'polygon') {
        const geoJson = layer.toGeoJSON()
        setFormData(prev => ({
          ...prev,
          polygon: geoJson.geometry,
          center: {
            lat: geoJson.geometry.coordinates[0][0][1],
            lng: geoJson.geometry.coordinates[0][0][0]
          },
          radius: undefined
        }))
      } else if (areaType === 'circle') {
        const center = layer.getLatLng()
        const radius = layer.getRadius() / 1000 // Convert to km
        setFormData(prev => ({
          ...prev,
          center: { lat: center.lat, lng: center.lng },
          radius: radius,
          polygon: undefined
        }))
      }
    })

    setMapReady(true)

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
    }
  }, [])

  const setupDrawControl = () => {
    if (!mapInstance.current || !drawnItems.current) return

    // Remove existing control if any
    if (drawControl.current) {
      mapInstance.current.removeControl(drawControl.current)
    }

    // Create new draw control based on area type
    const drawOptions: any = {
      position: 'topright',
      draw: {
        polygon: areaType === 'polygon' ? {
          allowIntersection: false,
          drawError: {
            color: '#e1e1e1',
            message: '<strong>Error:</strong> shape edges cannot cross!'
          },
          shapeOptions: {
            color: '#3b82f6'
          }
        } : false,
        circle: areaType === 'circle' ? {
          shapeOptions: {
            color: '#3b82f6'
          }
        } : false,
        polyline: false,
        rectangle: false,
        circlemarker: false,
        marker: false
      },
      edit: {
        featureGroup: drawnItems.current,
        remove: true
      }
    }

    drawControl.current = new L.Control.Draw(drawOptions)
    mapInstance.current.addControl(drawControl.current)
  }

  useEffect(() => {
    if (mapReady) {
      setupDrawControl()
    }
  }, [areaType, mapReady])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      showToast.error('Please enter a name for the service area')
      return
    }

    if (areaType === 'polygon' && !formData.polygon) {
      showToast.error('Please draw a polygon on the map')
      return
    }

    if (areaType === 'circle' && !formData.radius) {
      showToast.error('Please draw a circle on the map')
      return
    }

    onSave(formData)
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {serviceArea ? 'Edit Service Area' : 'Create New Service Area'}
          </DialogTitle>
          <DialogDescription>
            Define the service boundaries and configure pricing for this area
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Area Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Downtown Service Area"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Service area covering downtown and surrounding neighborhoods"
                  rows={3}
                />
              </div>

              <div>
                <Label>Area Type</Label>
                <RadioGroup value={areaType} onValueChange={(value: any) => setAreaType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="polygon" id="polygon" />
                    <Label htmlFor="polygon" className="flex items-center gap-2 cursor-pointer">
                      <Hexagon className="h-4 w-4" />
                      Polygon (Custom Shape)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="circle" id="circle" />
                    <Label htmlFor="circle" className="flex items-center gap-2 cursor-pointer">
                      <Circle className="h-4 w-4" />
                      Circle (Radius-based)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Surcharge Settings
                </h3>
                
                <div>
                  <Label htmlFor="surchargeAmount">Fixed Surcharge Amount ($)</Label>
                  <Input
                    id="surchargeAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.surchargeAmount || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      surchargeAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="surchargePercentage">Percentage Surcharge (%)</Label>
                  <Input
                    id="surchargePercentage"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.surchargePercentage || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      surchargePercentage: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
            </div>

            <div>
              <Label>Draw Area on Map</Label>
              <Card className="mt-2">
                <div ref={mapContainer} className="h-[400px] w-full rounded-lg" />
              </Card>
              <p className="text-sm text-muted-foreground mt-2">
                {areaType === 'polygon' 
                  ? 'Click on the map to draw a polygon. Click the first point to close the shape.'
                  : 'Click and drag on the map to draw a circle.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {serviceArea ? 'Update' : 'Create'} Service Area
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}