import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { showToast } from '@/components/ui/Toast'
import { Clock, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { adminApi } from '@/services/adminApi'
import BusinessHoursForm from '@/components/admin/configuration/BusinessHoursForm'
import HolidayManager from '@/components/admin/configuration/HolidayManager'

interface BusinessHoursOverview {
  regularHours: any[]
  upcomingHolidays: any[]
  timezone: string
  is24x7: boolean
  hasWeekendHours: boolean
}

export default function BusinessHoursPage() {
  const [overview, setOverview] = useState<BusinessHoursOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('hours')

  useEffect(() => {
    loadBusinessHours()
  }, [])

  const loadBusinessHours = async () => {
    try {
      setLoading(true)
      const response = await adminApi.get('/admin/business-hours/overview')
      setOverview(response.data)
    } catch (error) {
      console.error('Failed to load business hours:', error)
      showToast.error('Failed to load business hours')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBusinessHours = async (hours: any[]) => {
    try {
      setSaving(true)
      await adminApi.put('/admin/business-hours/bulk', { hours })
      showToast.success('Business hours updated successfully')
      await loadBusinessHours()
    } catch (error) {
      console.error('Failed to update business hours:', error)
      showToast.error('Failed to update business hours')
    } finally {
      setSaving(false)
    }
  }

  const handleAddHoliday = async (holiday: any) => {
    try {
      setSaving(true)
      await adminApi.post('/admin/business-hours/holidays', holiday)
      showToast.success('Holiday added successfully')
      await loadBusinessHours()
    } catch (error) {
      console.error('Failed to add holiday:', error)
      showToast.error('Failed to add holiday')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateHoliday = async (id: string, holiday: any) => {
    try {
      setSaving(true)
      await adminApi.put(`/admin/business-hours/holidays/${id}`, holiday)
      showToast.success('Holiday updated successfully')
      await loadBusinessHours()
    } catch (error) {
      console.error('Failed to update holiday:', error)
      showToast.error('Failed to update holiday')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteHoliday = async (id: string) => {
    try {
      setSaving(true)
      await adminApi.delete(`/admin/business-hours/holidays/${id}`)
      showToast.success('Holiday deleted successfully')
      await loadBusinessHours()
    } catch (error) {
      console.error('Failed to delete holiday:', error)
      showToast.error('Failed to delete holiday')
    } finally {
      setSaving(false)
    }
  }

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
            <h1 className="text-2xl font-semibold text-foreground">Business Hours</h1>
            <p className="text-muted-foreground mt-1">
              Configure your operating hours and holidays
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              <Clock className="h-3 w-3 mr-1" />
              {overview.timezone}
            </Badge>
            {overview.is24x7 && (
              <Badge variant="default" className="text-sm">
                <CheckCircle className="h-3 w-3 mr-1" />
                24/7 Service
              </Badge>
            )}
            {overview.hasWeekendHours && (
              <Badge variant="secondary" className="text-sm">
                <Calendar className="h-3 w-3 mr-1" />
                Weekend Hours
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Regular Hours
            </TabsTrigger>
            <TabsTrigger value="holidays" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Holidays
              {overview.upcomingHolidays.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {overview.upcomingHolidays.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hours" className="mt-6">
            <BusinessHoursForm
              businessHours={overview.regularHours}
              onSubmit={handleUpdateBusinessHours}
              isLoading={saving}
            />
          </TabsContent>

          <TabsContent value="holidays" className="mt-6">
            <HolidayManager
              holidays={[...overview.upcomingHolidays]}
              onAdd={handleAddHoliday}
              onUpdate={handleUpdateHoliday}
              onDelete={handleDeleteHoliday}
              isLoading={saving}
            />
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Quick Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Current Status</p>
                  <p className="text-muted-foreground">
                    {/* We'll implement a real-time check here */}
                    Check current open/closed status
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Next Holiday</p>
                  <p className="text-muted-foreground">
                    {overview.upcomingHolidays.length > 0
                      ? `${overview.upcomingHolidays[0].name} - ${new Date(overview.upcomingHolidays[0].date).toLocaleDateString()}`
                      : 'No upcoming holidays'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Special Hours</p>
                  <p className="text-muted-foreground">
                    {overview.upcomingHolidays.filter(h => !h.isClosed && h.openTime).length} holidays with modified hours
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}