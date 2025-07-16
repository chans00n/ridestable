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
import { Badge } from '@/components/ui/badge'
import { showToast } from '@/components/ui/Toast'
import { Send, RefreshCw, Smartphone } from 'lucide-react'
import { adminApi } from '@/services/adminApi'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface SmsTemplate {
  id: string
  key: string
  name: string
  content: string
  category: string
  variables: string[]
  characterCount: number
  segmentCount: number
  isActive: boolean
}

interface SmsTemplatePreviewProps {
  template: SmsTemplate
  onClose: () => void
  onSendTest: (phone: string) => void
}

export default function SmsTemplatePreview({ template, onClose, onSendTest }: SmsTemplatePreviewProps) {
  const [preview, setPreview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sampleData, setSampleData] = useState<any>({})
  const [testPhone, setTestPhone] = useState('')

  const SMS_SEGMENT_LENGTH = 160
  const SMS_MULTIPART_LENGTH = 153

  useEffect(() => {
    loadPreview()
  }, [template.key])

  const loadPreview = async (customData?: any) => {
    try {
      setLoading(true)
      const response = await adminApi.post(`/admin/sms-templates/${template.key}/preview`, {
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
    if (!testPhone) {
      showToast.error('Please enter a phone number')
      return
    }
    onSendTest(testPhone)
  }

  const getCharacterProgress = () => {
    if (!preview) return 0
    
    if (preview.segmentCount === 1) {
      return (preview.characterCount / SMS_SEGMENT_LENGTH) * 100
    } else {
      const currentSegmentChars = preview.characterCount % SMS_MULTIPART_LENGTH || SMS_MULTIPART_LENGTH
      return (currentSegmentChars / SMS_MULTIPART_LENGTH) * 100
    }
  }

  if (loading || !preview) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">Loading preview...</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>SMS Template Preview</DialogTitle>
          <DialogDescription>
            Preview {template.name} with sample data
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
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
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
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
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Message Preview</Label>
              <Card className="mt-2 p-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-3 inline-block max-w-full">
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {preview.content}
                      </p>
                    </div>
                    
                    {/* Character Count */}
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{preview.characterCount} characters</span>
                        <span className={`font-medium ${
                          preview.segmentCount > 2 ? 'text-red-600' : 
                          preview.segmentCount === 2 ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {preview.segmentCount} segment{preview.segmentCount > 1 ? 's' : ''}
                        </span>
                      </div>
                      <Progress value={getCharacterProgress()} className="h-1" />
                    </div>
                  </div>
                </div>
              </Card>
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

            {/* Cost Estimate */}
            {preview.segmentCount > 1 && (
              <Card className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This message will be sent as {preview.segmentCount} SMS segments.
                  Recipients may receive it as separate messages, and you'll be charged for {preview.segmentCount} messages.
                </p>
              </Card>
            )}

            {/* Send Test */}
            <div>
              <Label htmlFor="testPhone" className="text-sm">Send Test SMS</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="testPhone"
                  type="tel"
                  placeholder="+1234567890"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
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