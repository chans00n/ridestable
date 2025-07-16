import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Plus, Trash2 } from 'lucide-react'

const pricingRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  ruleType: z.enum(['base_rate', 'distance_multiplier', 'time_multiplier', 'surcharge', 'discount']),
  serviceType: z.enum(['ONE_WAY', 'ROUNDTRIP', 'HOURLY']),
  priority: z.number().min(0).max(100),
  isActive: z.boolean(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().optional(),
  conditions: z.record(z.any()),
  calculation: z.record(z.any())
})

type PricingRuleForm = z.infer<typeof pricingRuleSchema>

interface PricingRuleFormProps {
  rule?: any
  onSubmit: (data: PricingRuleForm) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

const ruleTypeOptions = [
  { value: 'base_rate', label: 'Base Rate', description: 'Fundamental pricing for service' },
  { value: 'distance_multiplier', label: 'Distance Multiplier', description: 'Price adjustment based on distance' },
  { value: 'time_multiplier', label: 'Time Multiplier', description: 'Price adjustment based on time' },
  { value: 'surcharge', label: 'Surcharge', description: 'Additional fees or charges' },
  { value: 'discount', label: 'Discount', description: 'Price reductions or promotions' }
]

const serviceTypeOptions = [
  { value: 'ONE_WAY', label: 'One Way' },
  { value: 'ROUNDTRIP', label: 'Round Trip' },
  { value: 'HOURLY', label: 'Hourly' }
]

export default function PricingRuleForm({ rule, onSubmit, onCancel, isLoading }: PricingRuleFormProps) {
  const [conditions, setConditions] = useState<Array<{ key: string; operator: string; value: string }>>([])
  const [calculation, setCalculation] = useState<{ type: string; value: number; unit?: string }>({
    type: 'fixed',
    value: 0
  })

  const form = useForm<PricingRuleForm>({
    resolver: zodResolver(pricingRuleSchema),
    defaultValues: {
      name: rule?.name || '',
      description: rule?.description || '',
      ruleType: rule?.ruleType || 'base_rate',
      serviceType: rule?.serviceType || 'ONE_WAY',
      priority: rule?.priority || 0,
      isActive: rule?.isActive ?? true,
      effectiveFrom: rule?.effectiveFrom ? new Date(rule.effectiveFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      effectiveTo: rule?.effectiveTo ? new Date(rule.effectiveTo).toISOString().split('T')[0] : '',
      conditions: rule?.conditions || {},
      calculation: rule?.calculation || {}
    }
  })

  useEffect(() => {
    if (rule) {
      // Parse conditions from rule
      const conditionsArray = Object.entries(rule.conditions || {}).map(([key, value]: [string, any]) => ({
        key,
        operator: value.operator || 'equals',
        value: value.value?.toString() || ''
      }))
      setConditions(conditionsArray)

      // Parse calculation from rule
      if (rule.calculation) {
        setCalculation({
          type: rule.calculation.type || 'fixed',
          value: rule.calculation.value || 0,
          unit: rule.calculation.unit
        })
      }
    }
  }, [rule])

  const handleSubmit = async (data: PricingRuleForm) => {
    // Convert conditions array to object
    const conditionsObj = conditions.reduce((acc, condition) => {
      if (condition.key && condition.value) {
        acc[condition.key] = {
          operator: condition.operator,
          value: isNaN(Number(condition.value)) ? condition.value : Number(condition.value)
        }
      }
      return acc
    }, {} as Record<string, any>)

    // Prepare form data with parsed conditions and calculation
    const formData = {
      ...data,
      effectiveFrom: new Date(data.effectiveFrom),
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
      conditions: conditionsObj,
      calculation
    }

    await onSubmit(formData)
  }

  const addCondition = () => {
    setConditions([...conditions, { key: '', operator: 'equals', value: '' }])
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, field: string, value: string) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], [field]: value }
    setConditions(updated)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="calculation">Calculation</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Configure the basic settings for this pricing rule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="e.g., Weekend Surcharge"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority (0-100)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    max="100"
                    {...form.register('priority', { valueAsNumber: true })}
                  />
                  {form.formState.errors.priority && (
                    <p className="text-sm text-red-600">{form.formState.errors.priority.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Describe when and how this rule applies"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rule Type</Label>
                  <Controller
                    name="ruleType"
                    control={form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rule type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ruleTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div>{option.label}</div>
                                <div className="text-xs text-muted-foreground">{option.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Controller
                    name="serviceType"
                    control={form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="effectiveFrom">Effective From</Label>
                  <Input
                    id="effectiveFrom"
                    type="date"
                    {...form.register('effectiveFrom')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effectiveTo">Effective To (Optional)</Label>
                  <Input
                    id="effectiveTo"
                    type="date"
                    {...form.register('effectiveTo')}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="isActive"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label>Active</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conditions</CardTitle>
              <CardDescription>Define when this pricing rule should apply</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-end gap-2 p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Label>Field</Label>
                    <Input
                      placeholder="e.g., dayOfWeek, distance, time"
                      value={condition.key}
                      onChange={(e) => updateCondition(index, 'key', e.target.value)}
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Operator</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(index, 'operator', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                        <SelectItem value="in">In List</SelectItem>
                        <SelectItem value="between">Between</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Value</Label>
                    <Input
                      placeholder="e.g., 6,7 or 10.5"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeCondition(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addCondition}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Condition
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calculation</CardTitle>
              <CardDescription>Configure how the price adjustment is calculated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Calculation Type</Label>
                  <Select
                    value={calculation.type}
                    onValueChange={(value) => setCalculation({ ...calculation, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="per_mile">Per Mile</SelectItem>
                      <SelectItem value="per_minute">Per Minute</SelectItem>
                      <SelectItem value="per_hour">Per Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={calculation.value}
                    onChange={(e) => setCalculation({ ...calculation, value: Number(e.target.value) })}
                  />
                </div>

                {calculation.type === 'percentage' && (
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <div className="flex items-center justify-center h-10 px-3 py-2 bg-muted rounded-md">
                      %
                    </div>
                  </div>
                )}

                {(calculation.type === 'fixed' || calculation.type?.startsWith('per_')) && (
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <div className="flex items-center justify-center h-10 px-3 py-2 bg-muted rounded-md">
                      $
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-800 dark:text-blue-200">Calculation Preview</div>
                    <div className="text-blue-700 dark:text-blue-300">
                      {calculation.type === 'fixed' && `Add $${calculation.value} to the base price`}
                      {calculation.type === 'percentage' && `Adjust price by ${calculation.value}%`}
                      {calculation.type === 'per_mile' && `Add $${calculation.value} per mile`}
                      {calculation.type === 'per_minute' && `Add $${calculation.value} per minute`}
                      {calculation.type === 'per_hour' && `Add $${calculation.value} per hour`}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </form>
  )
}