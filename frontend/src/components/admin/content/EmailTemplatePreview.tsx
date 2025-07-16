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
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { showToast } from '@/components/ui/Toast'
import { Send, FileText, Code, RefreshCw } from 'lucide-react'
import { adminApi } from '@/services/adminApi'

interface EmailTemplate {
  id: string
  key: string
  name: string
  subject: string
  content: string
  contentHtml?: string
  category: string
  variables: string[]
  isActive: boolean
}

interface EmailTemplatePreviewProps {
  template: EmailTemplate
  onClose: () => void
  onSendTest: (email: string) => void
}

export default function EmailTemplatePreview({ template, onClose, onSendTest }: EmailTemplatePreviewProps) {
  const [preview, setPreview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sampleData, setSampleData] = useState<any>({})
  const [testEmail, setTestEmail] = useState('')
  const [activeTab, setActiveTab] = useState('text')

  useEffect(() => {
    loadPreview()
  }, [template.key])

  const loadPreview = async (customData?: any) => {
    try {
      setLoading(true)
      const response = await adminApi.post(`/admin/email-templates/${template.key}/preview`, {
        sampleData: customData || sampleData
      })
      setPreview(response.data)
      setSampleData(response.data.sampleData)
    } catch (error) {
      console.error('Failed to load preview:', error)
      showToast.error('Failed to load preview')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateVariable = (key: string, value: string) => {
    const newData = { ...sampleData, [key]: value }
    setSampleData(newData)
  }

  const handleRefreshPreview = () => {
    loadPreview(sampleData)
  }

  const handleSendTest = () => {
    if (!testEmail) {
      showToast.error('Please enter an email address')
      return
    }
    onSendTest(testEmail)
  }

  if (loading || !preview) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="text-center py-8">Loading preview...</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Template Preview</DialogTitle>
          <DialogDescription>
            Preview {template.name} with sample data
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6">
          {/* Sample Data Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Sample Data</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshPreview}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {Object.entries(sampleData).map(([key, value]) => (
                <div key={key}>
                  <Label htmlFor={key} className="text-xs">
                    {key}
                  </Label>
                  <Input
                    id={key}
                    value={String(value)}
                    onChange={(e) => handleUpdateVariable(key, e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="col-span-2 space-y-4">
            <div>
              <Label className="text-sm">Subject Line</Label>
              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg font-medium">
                {preview.subject}
              </div>
            </div>

            <div>
              <Label className="text-sm">Content Preview</Label>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                <TabsList>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Plain Text
                  </TabsTrigger>
                  {preview.contentHtml && (
                    <TabsTrigger value="html" className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      HTML
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="text" className="mt-4">
                  <div className="bg-white dark:bg-gray-900 border rounded-lg p-6 max-h-[400px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {preview.content}
                    </pre>
                  </div>
                </TabsContent>

                {preview.contentHtml && (
                  <TabsContent value="html" className="mt-4">
                    <div className="bg-white dark:bg-gray-900 border rounded-lg p-6 max-h-[400px] overflow-y-auto">
                      <div 
                        dangerouslySetInnerHTML={{ __html: preview.contentHtml }}
                        className="prose prose-sm dark:prose-invert max-w-none"
                      />
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>

            {/* Variables Used */}
            <div>
              <Label className="text-sm">Variables Used</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {preview.variables.map((variable: string) => (
                  <Badge key={variable} variant="secondary" className="text-xs">
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Send Test */}
            <div className="border-t pt-4">
              <Label htmlFor="testEmail" className="text-sm">Send Test Email</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <Button onClick={handleSendTest}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}