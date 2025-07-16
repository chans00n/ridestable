import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/Input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { showToast } from '@/components/ui/Toast'
import { Map, Plus, Edit2, Trash2, Download, Search, MapPin, DollarSign, AlertCircle } from 'lucide-react'
import { adminApi } from '@/services/adminApi'
import ServiceAreaMap from '@/components/admin/configuration/ServiceAreaMap'
import ServiceAreaForm from '@/components/admin/configuration/ServiceAreaForm'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ServiceAreaOverview {
  totalAreas: number
  activeAreas: number
  areasWithSurcharge: number
  totalCoverage: number
  overlappingAreas: number
}

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
  createdBy?: {
    firstName: string
    lastName: string
  }
}

export default function ServiceAreasPage() {
  const [overview, setOverview] = useState<ServiceAreaOverview | null>(null)
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('map')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArea, setSelectedArea] = useState<ServiceArea | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    loadServiceAreas()
  }, [])

  const loadServiceAreas = async () => {
    try {
      setLoading(true)
      const [overviewRes, areasRes] = await Promise.all([
        adminApi.get('/admin/service-areas/overview'),
        adminApi.get('/admin/service-areas')
      ])
      setOverview(overviewRes.data)
      setServiceAreas(areasRes.data)
    } catch (error) {
      console.error('Failed to load service areas:', error)
      showToast.error('Failed to load service areas')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateArea = () => {
    setSelectedArea(null)
    setShowForm(true)
  }

  const handleEditArea = (area: ServiceArea) => {
    setSelectedArea(area)
    setShowForm(true)
  }

  const handleSaveArea = async (data: any) => {
    try {
      if (selectedArea) {
        await adminApi.put(`/admin/service-areas/${selectedArea.id}`, data)
        showToast.success('Service area updated successfully')
      } else {
        await adminApi.post('/admin/service-areas', data)
        showToast.success('Service area created successfully')
      }
      setShowForm(false)
      await loadServiceAreas()
    } catch (error) {
      console.error('Failed to save service area:', error)
      showToast.error('Failed to save service area')
    }
  }

  const handleToggleArea = async (id: string, isActive: boolean) => {
    try {
      await adminApi.patch(`/admin/service-areas/${id}/toggle`, { isActive })
      showToast.success(`Service area ${isActive ? 'activated' : 'deactivated'}`)
      await loadServiceAreas()
    } catch (error) {
      console.error('Failed to toggle service area:', error)
      showToast.error('Failed to toggle service area')
    }
  }

  const handleDeleteArea = async () => {
    if (!deleteId) return
    
    try {
      await adminApi.delete(`/admin/service-areas/${deleteId}`)
      showToast.success('Service area deleted successfully')
      setDeleteId(null)
      await loadServiceAreas()
    } catch (error) {
      console.error('Failed to delete service area:', error)
      showToast.error('Failed to delete service area')
    }
  }

  const handleExport = async (format: 'geojson' | 'kml') => {
    try {
      const response = await adminApi.get(`/admin/service-areas/export/${format}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `service-areas.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      showToast.success(`Exported service areas as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Failed to export service areas:', error)
      showToast.error('Failed to export service areas')
    }
  }

  const filteredAreas = serviceAreas.filter(area =>
    area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    area.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading || !overview) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Service Areas</h1>
            <p className="text-muted-foreground mt-1">
              Define and manage service boundaries and surcharges
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExport('geojson')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export GeoJSON
              </Button>
            </div>
            <Button onClick={handleCreateArea}>
              <Plus className="h-4 w-4 mr-2" />
              New Service Area
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalAreas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{overview.activeAreas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">With Surcharge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{overview.areasWithSurcharge}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalCoverage} km²</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overlapping</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{overview.overlappingAreas}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              List View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-6">
            <ServiceAreaMap
              serviceAreas={serviceAreas}
              onEdit={handleEditArea}
              onToggle={handleToggleArea}
              onDelete={(id) => setDeleteId(id)}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Service Areas</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search areas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Surcharge</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAreas.map((area) => (
                      <TableRow key={area.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{area.name}</div>
                            {area.description && (
                              <div className="text-sm text-muted-foreground">{area.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {area.polygon ? 'Polygon' : 'Circle'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {area.surchargeAmount || area.surchargePercentage ? (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {area.surchargeAmount && `$${area.surchargeAmount}`}
                              {area.surchargeAmount && area.surchargePercentage && ' + '}
                              {area.surchargePercentage && `${area.surchargePercentage}%`}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={area.isActive ? 'default' : 'secondary'}>
                            {area.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {area.createdBy && (
                            <span className="text-sm text-muted-foreground">
                              {area.createdBy.firstName} {area.createdBy.lastName}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditArea(area)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleArea(area.id, !area.isActive)}
                            >
                              {area.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(area.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Dialog */}
        {showForm && (
          <ServiceAreaForm
            serviceArea={selectedArea}
            onSave={handleSaveArea}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Service Area</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this service area? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteArea}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}