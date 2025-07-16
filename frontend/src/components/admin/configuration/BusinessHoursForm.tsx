import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, AlertCircle } from 'lucide-react'

interface BusinessHours {
  dayOfWeek: number
  dayName: string
  openTime: string
  closeTime: string
  isClosed: boolean
  timezone: string
}

interface BusinessHoursFormProps {
  businessHours: BusinessHours[]
  onSubmit: (hours: BusinessHours[]) => Promise<void>
  isLoading: boolean
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function BusinessHoursForm({ businessHours, onSubmit, isLoading }: BusinessHoursFormProps) {
  const [hours, setHours] = useState<BusinessHours[]>(businessHours)
  const [copyFrom, setCopyFrom] = useState<number | null>(null)

  const handleTimeChange = (dayOfWeek: number, field: 'openTime' | 'closeTime', value: string) => {
    setHours(prev => prev.map(h => 
      h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
    ))
  }

  const handleClosedToggle = (dayOfWeek: number, isClosed: boolean) => {
    setHours(prev => prev.map(h => 
      h.dayOfWeek === dayOfWeek ? { ...h, isClosed } : h
    ))
  }

  const handleCopyHours = (fromDay: number, toDay: number) => {
    const sourceHours = hours.find(h => h.dayOfWeek === fromDay)
    if (!sourceHours) return

    setHours(prev => prev.map(h => 
      h.dayOfWeek === toDay 
        ? { 
            ...h, 
            openTime: sourceHours.openTime,
            closeTime: sourceHours.closeTime,
            isClosed: sourceHours.isClosed
          } 
        : h
    ))
  }

  const handleCopyToAll = (fromDay: number) => {
    const sourceHours = hours.find(h => h.dayOfWeek === fromDay)
    if (!sourceHours) return

    setHours(prev => prev.map(h => ({
      ...h,
      openTime: sourceHours.openTime,
      closeTime: sourceHours.closeTime,
      isClosed: sourceHours.isClosed
    })))
  }

  const handleCopyToWeekdays = (fromDay: number) => {
    const sourceHours = hours.find(h => h.dayOfWeek === fromDay)
    if (!sourceHours) return

    setHours(prev => prev.map(h => 
      h.dayOfWeek >= 1 && h.dayOfWeek <= 5
        ? {
            ...h,
            openTime: sourceHours.openTime,
            closeTime: sourceHours.closeTime,
            isClosed: sourceHours.isClosed
          }
        : h
    ))
  }

  const handleCopyToWeekends = (fromDay: number) => {
    const sourceHours = hours.find(h => h.dayOfWeek === fromDay)
    if (!sourceHours) return

    setHours(prev => prev.map(h => 
      h.dayOfWeek === 0 || h.dayOfWeek === 6
        ? {
            ...h,
            openTime: sourceHours.openTime,
            closeTime: sourceHours.closeTime,
            isClosed: sourceHours.isClosed
          }
        : h
    ))
  }

  const handleSubmit = async () => {
    await onSubmit(hours)
  }

  const isValidTimeRange = (openTime: string, closeTime: string) => {
    const [openHour, openMin] = openTime.split(':').map(Number)
    const [closeHour, closeMin] = closeTime.split(':').map(Number)
    const openMinutes = openHour * 60 + openMin
    const closeMinutes = closeHour * 60 + closeMin
    return closeMinutes > openMinutes || closeMinutes === 0 // Allow midnight as close time
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Hours</CardTitle>
        <CardDescription>
          Configure your regular operating hours for each day of the week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hours.map((day) => (
          <div key={day.dayOfWeek} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium w-32">{day.dayName}</Label>
              <div className="flex items-center gap-4 flex-1">
                {!day.isClosed && (
                  <>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => handleTimeChange(day.dayOfWeek, 'openTime', e.target.value)}
                        className="w-32"
                        disabled={isLoading}
                      />
                    </div>
                    <span className="text-muted-foreground">to</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => handleTimeChange(day.dayOfWeek, 'closeTime', e.target.value)}
                        className="w-32"
                        disabled={isLoading}
                      />
                    </div>
                    {!isValidTimeRange(day.openTime, day.closeTime) && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Invalid
                      </Badge>
                    )}
                  </>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <Label htmlFor={`closed-${day.dayOfWeek}`} className="text-sm">
                    Closed
                  </Label>
                  <Switch
                    id={`closed-${day.dayOfWeek}`}
                    checked={day.isClosed}
                    onCheckedChange={(checked) => handleClosedToggle(day.dayOfWeek, checked)}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCopyFrom(copyFrom === day.dayOfWeek ? null : day.dayOfWeek)}
                    disabled={isLoading}
                  >
                    Copy
                  </Button>
                  {copyFrom === day.dayOfWeek && (
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleCopyToAll(day.dayOfWeek)
                          setCopyFrom(null)
                        }}
                      >
                        To All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleCopyToWeekdays(day.dayOfWeek)
                          setCopyFrom(null)
                        }}
                      >
                        To Weekdays
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleCopyToWeekends(day.dayOfWeek)
                          setCopyFrom(null)
                        }}
                      >
                        To Weekends
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {copyFrom !== null && copyFrom !== day.dayOfWeek && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  handleCopyHours(copyFrom, day.dayOfWeek)
                  setCopyFrom(null)
                }}
                className="ml-32"
              >
                Paste here
              </Button>
            )}
          </div>
        ))}

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <Calendar className="inline h-4 w-4 mr-1" />
            Timezone: {hours[0]?.timezone || 'America/Los_Angeles'}
          </div>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Business Hours'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}