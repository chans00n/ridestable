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
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { showToast } from '@/components/ui/Toast'
import { Eye, EyeOff, AlertCircle, Info } from 'lucide-react'
import { adminApi } from '@/services/adminApi'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Integration {
  id?: string
  name: string
  provider: string
  config: any
  isActive: boolean
  environment: 'sandbox' | 'production'
}

interface IntegrationFormProps {
  integration: Integration | null
  provider: string
  onSave: (data: Integration) => void
  onCancel: () => void
}

const providerFields = {
  stripe: {
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', type: 'text', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: false }
    ],
    help: 'You can find your Stripe API keys in the Stripe Dashboard under Developers > API keys.',
    sandboxHelp: 'Use test keys from the Stripe Dashboard for sandbox environment.',
    productionHelp: 'Use live keys from the Stripe Dashboard for production environment.'
  },
  twilio: {
    fields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
      { key: 'messagingServiceSid', label: 'Messaging Service SID', type: 'text', required: false },
      { key: 'fromNumber', label: 'From Phone Number', type: 'text', required: false, placeholder: '+1234567890' }
    ],
    help: 'Find your Twilio credentials in the Twilio Console.',
    sandboxHelp: 'Use test credentials from Twilio for sandbox environment.',
    productionHelp: 'Use live credentials from Twilio for production environment.'
  },
  sendgrid: {
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'fromEmail', label: 'From Email', type: 'email', required: true },
      { key: 'fromName', label: 'From Name', type: 'text', required: false, defaultValue: 'Stable Ride' }
    ],
    help: 'Create an API key in SendGrid under Settings > API Keys.',
    sandboxHelp: 'You can use the same API key for sandbox, but emails will be sent.',
    productionHelp: 'Ensure your domain is verified in SendGrid for production use.'
  },
  google_maps: {
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'region', label: 'Region', type: 'text', required: false, defaultValue: 'US', placeholder: 'US' }
    ],
    help: 'Create an API key in Google Cloud Console and enable Maps JavaScript API.',
    sandboxHelp: 'You can use the same API key for sandbox with usage restrictions.',
    productionHelp: 'Set up proper API key restrictions for production use.'
  }
}

export default function IntegrationForm({ integration, provider, onSave, onCancel }: IntegrationFormProps) {
  const [formData, setFormData] = useState<Integration>({
    name: '',
    provider,
    config: {},
    isActive: true,
    environment: 'sandbox',
    ...integration
  })
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load template if creating new integration
    if (!integration) {
      loadTemplate()
    }
  }, [provider])

  const loadTemplate = async () => {
    try {
      const response = await adminApi.get(`/admin/integrations/templates/${provider}`)
      setFormData(prev => ({
        ...prev,
        ...response.data,
        config: {
          ...response.data.config,
          ...prev.config
        }
      }))
    } catch (error) {
      console.error('Failed to load template:', error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const providerConfig = providerFields[provider as keyof typeof providerFields]
    
    // Validate required fields
    for (const field of providerConfig.fields) {
      if (field.required && !formData.config[field.key]) {
        showToast.error(`${field.label} is required`)
        return
      }
    }

    onSave(formData)
  }

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const providerConfig = providerFields[provider as keyof typeof providerFields]

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {integration ? 'Edit Integration' : 'Create New Integration'}
          </DialogTitle>
          <DialogDescription>
            Configure {provider} integration settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Integration Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={`${provider} Integration`}
              required
            />
          </div>

          <div>
            <Label>Environment</Label>
            <RadioGroup 
              value={formData.environment} 
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, environment: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sandbox" id="sandbox" />
                <Label htmlFor="sandbox" className="cursor-pointer">
                  Sandbox (Testing)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="production" id="production" />
                <Label htmlFor="production" className="cursor-pointer">
                  Production (Live)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuration</CardTitle>
              <CardDescription>{providerConfig.help}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {providerConfig.fields.map(field => (
                <div key={field.key}>
                  <Label htmlFor={field.key}>
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      id={field.key}
                      type={field.type === 'password' && !showSecrets[field.key] ? 'password' : 
                            field.type === 'password' ? 'text' : field.type}
                      value={formData.config[field.key] || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config, [field.key]: e.target.value }
                      }))}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                    {field.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => toggleSecretVisibility(field.key)}
                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets[field.key] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {formData.environment === 'sandbox' 
                ? providerConfig.sandboxHelp 
                : providerConfig.productionHelp}
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Active</Label>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {integration ? 'Update' : 'Create'} Integration
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}