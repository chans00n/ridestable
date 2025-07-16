import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { showToast } from '@/components/ui/Toast'
import { Smartphone, Info, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { adminApi } from '@/services/adminApi'
import { Progress } from '@/components/ui/progress'

interface SmsTemplate {
  id?: string
  key: string
  name: string
  content: string
  category: string
  variables: string[]
  characterCount: number
  segmentCount: number
  isActive: boolean
}

interface SmsTemplateEditorProps {
  template: SmsTemplate | null
  defaults: any
  onSave: (data: SmsTemplate) => void
  onCancel: () => void
}

export default function SmsTemplateEditor({ template, defaults, onSave, onCancel }: SmsTemplateEditorProps) {
  const [formData, setFormData] = useState<SmsTemplate>({
    key: '',
    name: '',
    content: '',
    category: 'booking_confirmation',
    variables: [],
    characterCount: 0,
    segmentCount: 1,
    isActive: true,
    ...template
  })
  const [selectedVariables, setSelectedVariables] = useState<Set<string>>(
    new Set(template?.variables || [])
  )
  const [liveCharacterCount, setLiveCharacterCount] = useState(0)
  const [liveSegmentCount, setLiveSegmentCount] = useState(1)

  const SMS_SEGMENT_LENGTH = 160
  const SMS_MULTIPART_LENGTH = 153
  const SMS_UNICODE_LENGTH = 70
  const SMS_UNICODE_MULTIPART = 67

  useEffect(() => {
    // Calculate character count and segments in real-time
    calculateSmsLength(formData.content)
  }, [formData.content])

  useEffect(() => {
    // Extract variables from content
    const extractVariables = () => {
      const regex = /\{\{([^}]+)\}\}/g
      const variables = new Set<string>()
      let match
      
      while ((match = regex.exec(formData.content)) !== null) {
        variables.add(match[1].trim())
      }
      
      setSelectedVariables(variables)
      setFormData(prev => ({ ...prev, variables: Array.from(variables) }))
    }
    
    extractVariables()
  }, [formData.content])

  const calculateSmsLength = async (content: string) => {
    if (!content) {
      setLiveCharacterCount(0)
      setLiveSegmentCount(1)
      return
    }

    try {
      const response = await adminApi.post('/admin/sms-templates/calculate-length', { content })
      setLiveCharacterCount(response.data.characterCount)
      setLiveSegmentCount(response.data.segmentCount)
    } catch (error) {
      // Fallback calculation
      const characterCount = content.length
      const hasUnicode = /[^\x00-\x7F]/.test(content)
      const segmentLength = hasUnicode ? SMS_UNICODE_LENGTH : SMS_SEGMENT_LENGTH
      const multipartLength = hasUnicode ? SMS_UNICODE_MULTIPART : SMS_MULTIPART_LENGTH
      
      let segmentCount = 1
      if (characterCount > segmentLength) {
        segmentCount = Math.ceil(characterCount / multipartLength)
      }
      
      setLiveCharacterCount(characterCount)
      setLiveSegmentCount(segmentCount)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.key || !formData.name || !formData.content) {
      showToast.error('Please fill in all required fields')
      return
    }
    
    onSave({
      ...formData,
      variables: Array.from(selectedVariables),
      characterCount: liveCharacterCount,
      segmentCount: liveSegmentCount
    })
  }

  const handleInsertVariable = (variable: string) => {
    const insertion = `{{${variable}}}`
    setFormData(prev => ({
      ...prev,
      content: prev.content + insertion
    }))
  }

  const loadTemplate = (templateKey: string) => {
    const defaultTemplate = defaults?.templates[templateKey]
    if (defaultTemplate) {
      setFormData(prev => ({
        ...prev,
        ...defaultTemplate,
        key: template?.key || defaultTemplate.key,
        isActive: prev.isActive
      }))
      setSelectedVariables(new Set(defaultTemplate.variables))
    }
  }

  const getCharacterProgress = () => {
    const hasUnicode = /[^\x00-\x7F]/.test(formData.content)
    const maxChars = hasUnicode ? SMS_UNICODE_LENGTH : SMS_SEGMENT_LENGTH
    
    if (liveSegmentCount === 1) {
      return (liveCharacterCount / maxChars) * 100
    } else {
      const multipartLength = hasUnicode ? SMS_UNICODE_MULTIPART : SMS_MULTIPART_LENGTH
      const currentSegmentChars = liveCharacterCount % multipartLength || multipartLength
      return (currentSegmentChars / multipartLength) * 100
    }
  }

  const categoryLabels: { [key: string]: string } = {
    booking_confirmation: 'Booking Confirmation',
    booking_reminder: 'Booking Reminder',
    driver_assigned: 'Driver Assigned',
    driver_arrival: 'Driver Arrival',
    booking_cancelled: 'Booking Cancelled',
    payment_confirmation: 'Payment Confirmation',
    verification_code: 'Verification Code'
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit SMS Template' : 'Create New SMS Template'}
          </DialogTitle>
          <DialogDescription>
            Create concise SMS messages with dynamic variables
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="key">Template Key *</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="booking_confirmation_sms"
                  pattern="[a-z0-9_]+"
                  title="Lowercase letters, numbers, and underscores only"
                  disabled={!!template}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Booking Confirmation SMS"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {defaults?.categories?.map((cat: string) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabels[cat] || cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <div className="space-y-4">
              <div>
                <Label>Template Presets</Label>
                <Select onValueChange={loadTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Load a preset template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(defaults?.templates || {}).map((key) => (
                      <SelectItem key={key} value={key}>
                        {defaults.templates[key].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Available Variables</Label>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Click to insert variables into your message
                  </AlertDescription>
                </Alert>
                <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded">
                  {defaults?.variables?.map((variable: string) => (
                    <Badge
                      key={variable}
                      variant={selectedVariables.has(variable) ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => handleInsertVariable(variable)}
                    >
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="content">SMS Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Hi {{customerName}}, your booking {{bookingId}} is confirmed..."
              rows={6}
              className="font-mono text-sm"
              required
            />
            
            {/* Character Count Display */}
            <div className="mt-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  {liveCharacterCount} characters
                </span>
                <span className={`font-medium ${
                  liveSegmentCount > 2 ? 'text-red-600' : 
                  liveSegmentCount === 2 ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {liveSegmentCount} SMS segment{liveSegmentCount > 1 ? 's' : ''}
                </span>
              </div>
              
              <Progress value={getCharacterProgress()} className="h-2" />
              
              {liveSegmentCount > 1 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This message will be sent as {liveSegmentCount} separate SMS segments, which may increase costs.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div>
            <Label>Used Variables</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {Array.from(selectedVariables).map(variable => (
                <Badge key={variable} variant="secondary" className="text-xs">
                  {variable}
                </Badge>
              ))}
              {selectedVariables.size === 0 && (
                <span className="text-sm text-muted-foreground">No variables used yet</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {template ? 'Update' : 'Create'} Template
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}