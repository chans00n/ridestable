import React, { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { showToast } from '@/components/ui/Toast'
import { Code, FileText, Eye, Info, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { adminApi } from '@/services/adminApi'

interface EmailTemplate {
  id?: string
  key: string
  name: string
  subject: string
  content: string
  contentHtml?: string
  category: string
  variables: string[]
  isActive: boolean
}

interface EmailTemplateEditorProps {
  template: EmailTemplate | null
  defaults: any
  onSave: (data: EmailTemplate) => void
  onCancel: () => void
}

export default function EmailTemplateEditor({ template, defaults, onSave, onCancel }: EmailTemplateEditorProps) {
  const [formData, setFormData] = useState<EmailTemplate>({
    key: '',
    name: '',
    subject: '',
    content: '',
    contentHtml: '',
    category: 'booking_confirmation',
    variables: [],
    isActive: true,
    ...template
  })
  const [selectedVariables, setSelectedVariables] = useState<Set<string>>(
    new Set(template?.variables || [])
  )
  const [activeTab, setActiveTab] = useState('text')
  const [preview, setPreview] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    // Extract variables from content
    const extractVariables = () => {
      const regex = /\{\{([^}]+)\}\}/g
      const variables = new Set<string>()
      let match
      
      while ((match = regex.exec(formData.content)) !== null) {
        variables.add(match[1].trim())
      }
      
      while ((match = regex.exec(formData.subject)) !== null) {
        variables.add(match[1].trim())
      }
      
      setSelectedVariables(variables)
      setFormData(prev => ({ ...prev, variables: Array.from(variables) }))
    }
    
    extractVariables()
  }, [formData.content, formData.subject])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.key || !formData.name || !formData.subject || !formData.content) {
      showToast.error('Please fill in all required fields')
      return
    }
    
    onSave({
      ...formData,
      variables: Array.from(selectedVariables)
    })
  }

  const handleInsertVariable = (variable: string) => {
    const insertion = `{{${variable}}}`
    
    if (activeTab === 'text') {
      setFormData(prev => ({
        ...prev,
        content: prev.content + insertion
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        contentHtml: (prev.contentHtml || '') + insertion
      }))
    }
  }

  const loadPreview = async () => {
    if (!template?.key) return
    
    try {
      setPreviewLoading(true)
      const response = await adminApi.post(`/admin/email-templates/${template.key}/preview`)
      setPreview(response.data)
    } catch (error) {
      console.error('Failed to load preview:', error)
      showToast.error('Failed to load preview')
    } finally {
      setPreviewLoading(false)
    }
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

  const categoryLabels: { [key: string]: string } = {
    booking_confirmation: 'Booking Confirmation',
    booking_reminder: 'Booking Reminder',
    booking_cancelled: 'Booking Cancelled',
    payment_receipt: 'Payment Receipt',
    driver_assigned: 'Driver Assigned',
    customer_welcome: 'Customer Welcome',
    password_reset: 'Password Reset',
    account_verification: 'Account Verification'
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Email Template' : 'Create New Email Template'}
          </DialogTitle>
          <DialogDescription>
            Design and configure email templates with dynamic variables
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
                  placeholder="booking_confirmation"
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
                  placeholder="Booking Confirmation Email"
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

              <div>
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Your Stable Ride Booking Confirmation - {{bookingId}}"
                  required
                />
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
                <Label>Available Variables</Label>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Click to insert variables into your template
                  </AlertDescription>
                </Alert>
                <div className="mt-2 flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                  {defaults?.variables?.map((variable: string) => (
                    <Badge
                      key={variable}
                      variant={selectedVariables.has(variable) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleInsertVariable(variable)}
                    >
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>

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
                <Label>Used Variables</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Array.from(selectedVariables).map(variable => (
                    <Badge key={variable} variant="secondary">
                      {variable}
                    </Badge>
                  ))}
                  {selectedVariables.size === 0 && (
                    <span className="text-sm text-muted-foreground">No variables used yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label>Email Content *</Label>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
              <TabsList>
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Plain Text
                </TabsTrigger>
                <TabsTrigger value="html" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  HTML
                </TabsTrigger>
                {template && (
                  <TabsTrigger value="preview" className="flex items-center gap-2" onClick={loadPreview}>
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="text" className="mt-4">
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your email content here..."
                  rows={15}
                  className="font-mono text-sm"
                  required
                />
              </TabsContent>

              <TabsContent value="html" className="mt-4">
                <Textarea
                  value={formData.contentHtml || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, contentHtml: e.target.value }))}
                  placeholder="Enter HTML content (optional)..."
                  rows={15}
                  className="font-mono text-sm"
                />
              </TabsContent>

              {template && (
                <TabsContent value="preview" className="mt-4">
                  {previewLoading ? (
                    <div className="text-center py-8">Loading preview...</div>
                  ) : preview ? (
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Subject:</p>
                        <p className="font-medium">{preview.subject}</p>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Content:</p>
                        <div className="mt-2 whitespace-pre-wrap bg-white dark:bg-gray-800 p-4 rounded border">
                          {preview.content}
                        </div>
                      </div>
                      {preview.contentHtml && (
                        <div>
                          <p className="text-sm text-muted-foreground">HTML Preview:</p>
                          <div 
                            className="mt-2 bg-white dark:bg-gray-800 p-4 rounded border"
                            dangerouslySetInnerHTML={{ __html: preview.contentHtml }}
                          />
                        </div>
                      )}
                    </div>
                  ) : null}
                </TabsContent>
              )}
            </Tabs>
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