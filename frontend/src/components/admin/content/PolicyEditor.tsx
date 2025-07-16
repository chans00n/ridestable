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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { showToast } from '@/components/ui/Toast'
import { FileText, Code, Eye, Calendar, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Policy {
  id?: string
  key: string
  title: string
  content: string
  contentHtml?: string
  metadata: {
    category: string
    version: string
    effectiveDate?: string
    requiresAcceptance?: boolean
  }
  isActive?: boolean
}

interface PolicyEditorProps {
  policy: Policy | null
  defaults: any
  onSave: (data: any) => void
  onCancel: () => void
}

export default function PolicyEditor({ policy, defaults, onSave, onCancel }: PolicyEditorProps) {
  const [formData, setFormData] = useState({
    key: '',
    title: '',
    content: '',
    contentHtml: '',
    category: 'terms_of_service',
    version: '1.0.0',
    effectiveDate: new Date().toISOString().split('T')[0],
    requiresAcceptance: true,
    isActive: false,
    ...policy,
    ...(policy?.metadata || {})
  })
  const [activeTab, setActiveTab] = useState('markdown')
  const [preview, setPreview] = useState('')

  useEffect(() => {
    // Generate preview
    if (formData.contentHtml) {
      setPreview(formData.contentHtml)
    } else {
      // Simple markdown to HTML conversion
      let html = formData.content
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^\* (.+)/gim, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
      
      setPreview(`<p>${html}</p>`)
    }
  }, [formData.content, formData.contentHtml])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.key || !formData.title || !formData.content) {
      showToast.error('Please fill in all required fields')
      return
    }
    
    const data = {
      key: formData.key,
      title: formData.title,
      content: formData.content,
      contentHtml: formData.contentHtml,
      category: formData.category,
      version: formData.version,
      effectiveDate: formData.effectiveDate ? new Date(formData.effectiveDate) : undefined,
      requiresAcceptance: formData.requiresAcceptance,
      isActive: formData.isActive
    }
    
    onSave(data)
  }

  const loadTemplate = (templateKey: string) => {
    const template = defaults?.templates[templateKey]
    if (template) {
      setFormData(prev => ({
        ...prev,
        ...template,
        key: policy?.key || template.key,
        effectiveDate: new Date().toISOString().split('T')[0]
      }))
    }
  }

  const incrementVersion = () => {
    const [major, minor, patch] = formData.version.split('.').map(Number)
    setFormData(prev => ({
      ...prev,
      version: `${major}.${minor}.${patch + 1}`
    }))
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {policy ? 'Edit Policy' : 'Create New Policy'}
          </DialogTitle>
          <DialogDescription>
            Create and manage legal documents and policies
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="key">Policy Key *</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="privacy_policy"
                  pattern="[a-z0-9_]+"
                  title="Lowercase letters, numbers, and underscores only"
                  disabled={!!policy}
                  required
                />
              </div>

              <div>
                <Label htmlFor="title">Policy Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Privacy Policy"
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
                    {defaults?.categories?.map((cat: any) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="version">Version</Label>
                <div className="flex gap-2">
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="1.0.0"
                  />
                  {policy && (
                    <Button type="button" variant="outline" onClick={incrementVersion}>
                      Increment
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="effectiveDate">Effective Date</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="requiresAcceptance">Requires User Acceptance</Label>
                <Switch
                  id="requiresAcceptance"
                  checked={formData.requiresAcceptance}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresAcceptance: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Publish Immediately</Label>
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
                    <SelectValue placeholder="Load a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(defaults?.templates || {}).map((key) => (
                      <SelectItem key={key} value={key}>
                        {defaults.templates[key].title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Formatting tips:</p>
                    <ul className="text-xs space-y-1 ml-4">
                      <li>• Use # for headings (# H1, ## H2, ### H3)</li>
                      <li>• Use **text** for bold</li>
                      <li>• Use *text* for italic</li>
                      <li>• Use * at line start for bullet points</li>
                      <li>• Leave blank lines for paragraphs</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              {policy && (
                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    Last updated: {new Date(policy.updatedAt).toLocaleDateString()}
                    {policy.publishedBy && (
                      <span className="block text-xs mt-1">
                        by {policy.publishedBy.firstName} {policy.publishedBy.lastName}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div>
            <Label>Policy Content *</Label>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
              <TabsList>
                <TabsTrigger value="markdown" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Markdown
                </TabsTrigger>
                <TabsTrigger value="html" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  HTML
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="markdown" className="mt-4">
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your policy content in markdown format..."
                  rows={20}
                  className="font-mono text-sm"
                  required
                />
              </TabsContent>

              <TabsContent value="html" className="mt-4">
                <Textarea
                  value={formData.contentHtml || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, contentHtml: e.target.value }))}
                  placeholder="Enter HTML content (optional)..."
                  rows={20}
                  className="font-mono text-sm"
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <div className="border rounded-lg p-6 bg-white dark:bg-gray-900 min-h-[500px]">
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: preview }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {policy ? 'Update' : 'Create'} Policy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}