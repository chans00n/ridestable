import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { showToast } from '@/components/ui/Toast'
import { 
  CreditCard, 
  MessageSquare, 
  Mail, 
  Map, 
  Plus, 
  Settings, 
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { adminApi } from '@/services/adminApi'
import IntegrationForm from '@/components/admin/configuration/IntegrationForm'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface IntegrationOverview {
  totalIntegrations: number
  activeIntegrations: number
  byProvider: { provider: string; count: number }[]
  byEnvironment: { environment: string; count: number }[]
}

interface Integration {
  id: string
  name: string
  provider: string
  config: any
  isActive: boolean
  environment: 'sandbox' | 'production'
  lastTestedAt?: string
  createdBy?: {
    firstName: string
    lastName: string
  }
}

const providerInfo = {
  stripe: {
    icon: CreditCard,
    title: 'Stripe',
    description: 'Payment processing and financial services',
    color: 'text-purple-600'
  },
  twilio: {
    icon: MessageSquare,
    title: 'Twilio',
    description: 'SMS and voice communication',
    color: 'text-red-600'
  },
  sendgrid: {
    icon: Mail,
    title: 'SendGrid',
    description: 'Email delivery and marketing',
    color: 'text-blue-600'
  },
  google_maps: {
    icon: Map,
    title: 'Google Maps',
    description: 'Location and mapping services',
    color: 'text-green-600'
  }
}

export default function IntegrationSettingsPage() {
  const [overview, setOverview] = useState<IntegrationOverview | null>(null)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      setLoading(true)
      const [overviewRes, integrationsRes] = await Promise.all([
        adminApi.get('/admin/integrations/overview'),
        adminApi.get('/admin/integrations')
      ])
      setOverview(overviewRes.data)
      setIntegrations(integrationsRes.data)
    } catch (error) {
      console.error('Failed to load integrations:', error)
      showToast.error('Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIntegration = async (provider: string) => {
    try {
      const response = await adminApi.get(`/admin/integrations/templates/${provider}`)
      setSelectedIntegration(null)
      setSelectedProvider(provider)
      setShowForm(true)
    } catch (error) {
      console.error('Failed to load template:', error)
      showToast.error('Failed to load integration template')
    }
  }

  const handleEditIntegration = (integration: Integration) => {
    setSelectedIntegration(integration)
    setSelectedProvider(integration.provider)
    setShowForm(true)
  }

  const handleSaveIntegration = async (data: any) => {
    try {
      if (selectedIntegration) {
        await adminApi.put(`/admin/integrations/${selectedIntegration.id}`, data)
        showToast.success('Integration updated successfully')
      } else {
        await adminApi.post('/admin/integrations', data)
        showToast.success('Integration created successfully')
      }
      setShowForm(false)
      await loadIntegrations()
    } catch (error) {
      console.error('Failed to save integration:', error)
      showToast.error('Failed to save integration')
    }
  }

  const handleTestIntegration = async (id: string) => {
    try {
      setTestingId(id)
      const response = await adminApi.post(`/admin/integrations/${id}/test`)
      
      if (response.data.success) {
        showToast.success(response.data.message)
      } else {
        showToast.error(response.data.message)
      }
      
      await loadIntegrations()
    } catch (error) {
      console.error('Failed to test integration:', error)
      showToast.error('Failed to test integration')
    } finally {
      setTestingId(null)
    }
  }

  const handleToggleIntegration = async (id: string, isActive: boolean) => {
    try {
      await adminApi.patch(`/admin/integrations/${id}/toggle`, { isActive })
      showToast.success(`Integration ${isActive ? 'activated' : 'deactivated'}`)
      await loadIntegrations()
    } catch (error) {
      console.error('Failed to toggle integration:', error)
      showToast.error('Failed to toggle integration')
    }
  }

  const handleDeleteIntegration = async () => {
    if (!deleteId) return
    
    try {
      await adminApi.delete(`/admin/integrations/${deleteId}`)
      showToast.success('Integration deleted successfully')
      setDeleteId(null)
      await loadIntegrations()
    } catch (error) {
      console.error('Failed to delete integration:', error)
      showToast.error('Failed to delete integration')
    }
  }

  const groupedIntegrations = Object.entries(providerInfo).map(([provider, info]) => ({
    provider,
    ...info,
    integrations: integrations.filter(i => i.provider === provider)
  }))

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
            <h1 className="text-2xl font-semibold text-foreground">Integration Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure third-party services and APIs
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalIntegrations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{overview.activeIntegrations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Production</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.byEnvironment.find(e => e.environment === 'production')?.count || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sandbox</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.byEnvironment.find(e => e.environment === 'sandbox')?.count || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Providers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groupedIntegrations.map(({ provider, icon: Icon, title, description, color, integrations }) => (
            <Card key={provider}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-8 w-8 ${color}`} />
                    <div>
                      <CardTitle>{title}</CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCreateIntegration(provider)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {integrations.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No {title} integrations configured
                  </div>
                ) : (
                  <div className="space-y-3">
                    {integrations.map(integration => (
                      <div
                        key={integration.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium">{integration.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={integration.isActive ? 'default' : 'secondary'}>
                                {integration.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge variant="outline">
                                {integration.environment}
                              </Badge>
                              {integration.lastTestedAt && (
                                <span className="text-xs text-muted-foreground">
                                  Last tested: {new Date(integration.lastTestedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTestIntegration(integration.id)}
                              disabled={testingId === integration.id}
                            >
                              {testingId === integration.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <PlayCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditIntegration(integration)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleIntegration(integration.id, !integration.isActive)}
                          >
                            {integration.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteId(integration.id)}
                            className="text-red-600"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Integration Form */}
        {showForm && selectedProvider && (
          <IntegrationForm
            integration={selectedIntegration}
            provider={selectedProvider}
            onSave={handleSaveIntegration}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Integration</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this integration? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteIntegration}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}