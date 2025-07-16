import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Calendar, Plus, Edit, Trash2, Clock, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

const holidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  date: z.string().min(1, 'Date is required'),
  isClosed: z.boolean(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  surchargePercentage: z.number().min(0).max(100).optional()
})

type HolidayForm = z.infer<typeof holidaySchema>

interface Holiday {
  id: string
  name: string
  date: string
  isClosed: boolean
  openTime?: string
  closeTime?: string
  surchargePercentage?: number
  createdBy?: {
    firstName: string
    lastName: string
  }
}

interface HolidayManagerProps {
  holidays: Holiday[]
  onAdd: (holiday: HolidayForm) => Promise<void>
  onUpdate: (id: string, holiday: Partial<HolidayForm>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isLoading: boolean
}

export default function HolidayManager({ holidays, onAdd, onUpdate, onDelete, isLoading }: HolidayManagerProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)

  const form = useForm<HolidayForm>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      name: '',
      date: '',
      isClosed: true,
      openTime: '',
      closeTime: '',
      surchargePercentage: 0
    }
  })

  const handleSubmit = async (data: HolidayForm) => {
    try {
      if (editingHoliday) {
        await onUpdate(editingHoliday.id, data)
      } else {
        await onAdd(data)
      }
      setShowDialog(false)
      form.reset()
      setEditingHoliday(null)
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday)
    form.reset({
      name: holiday.name,
      date: format(new Date(holiday.date), 'yyyy-MM-dd'),
      isClosed: holiday.isClosed,
      openTime: holiday.openTime || '',
      closeTime: holiday.closeTime || '',
      surchargePercentage: holiday.surchargePercentage || 0
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this holiday?')) {
      await onDelete(id)
    }
  }

  const upcomingHolidays = holidays.filter(h => new Date(h.date) >= new Date())
  const pastHolidays = holidays.filter(h => new Date(h.date) < new Date())

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Holiday Management</CardTitle>
            <CardDescription>
              Configure holidays and special operating hours
            </CardDescription>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingHoliday(null)
                form.reset()
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Holiday
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <DialogHeader>
                  <DialogTitle>
                    {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure holiday dates and special hours
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Holiday Name</Label>
                    <Input
                      id="name"
                      {...form.register('name')}
                      placeholder="e.g., Christmas Day"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      {...form.register('date')}
                    />
                    {form.formState.errors.date && (
                      <p className="text-sm text-red-600">{form.formState.errors.date.message}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isClosed"
                      checked={form.watch('isClosed')}
                      onCheckedChange={(checked) => form.setValue('isClosed', checked)}
                    />
                    <Label htmlFor="isClosed">Closed for the day</Label>
                  </div>

                  {!form.watch('isClosed') && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="openTime">Open Time</Label>
                          <Input
                            id="openTime"
                            type="time"
                            {...form.register('openTime')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="closeTime">Close Time</Label>
                          <Input
                            id="closeTime"
                            type="time"
                            {...form.register('closeTime')}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="surcharge">Surcharge %</Label>
                        <Input
                          id="surcharge"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          {...form.register('surchargePercentage', { valueAsNumber: true })}
                          placeholder="0"
                        />
                        <p className="text-sm text-muted-foreground">
                          Additional percentage to add to prices on this holiday
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : editingHoliday ? 'Update' : 'Add'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingHolidays.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Upcoming Holidays</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Holiday</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Surcharge</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingHolidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(holiday.date), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{holiday.name}</TableCell>
                      <TableCell>
                        {holiday.isClosed ? (
                          <Badge variant="secondary">Closed</Badge>
                        ) : (
                          <Badge variant="default">Open</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!holiday.isClosed && holiday.openTime && holiday.closeTime ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {holiday.openTime} - {holiday.closeTime}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {holiday.surchargePercentage ? (
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="h-3 w-3" />
                            +{holiday.surchargePercentage}%
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(holiday)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(holiday.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {pastHolidays.length > 0 && (
          <div className="space-y-4 mt-8">
            <h3 className="text-sm font-medium text-muted-foreground">Past Holidays</h3>
            <div className="rounded-md border opacity-60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Holiday</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastHolidays.slice(0, 5).map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell>
                        {format(new Date(holiday.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{holiday.name}</TableCell>
                      <TableCell>
                        {holiday.isClosed ? (
                          <Badge variant="secondary">Was Closed</Badge>
                        ) : (
                          <Badge variant="outline">Was Open</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(holiday.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {holidays.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No holidays configured yet. Add your first holiday to get started.
          </div>
        )}
      </CardContent>
    </Card>
  )
}