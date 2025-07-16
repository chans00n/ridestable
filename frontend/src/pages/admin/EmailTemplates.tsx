import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/Input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { showToast } from '@/components/ui/Toast'
import { 
  Mail, 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  Eye, 
  Send,
  FileText,
  Search,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { adminApi } from '@/services/adminApi'
import EmailTemplateEditor from '@/components/admin/content/EmailTemplateEditor'
import EmailTemplatePreview from '@/components/admin/content/EmailTemplatePreview'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
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

interface EmailTemplateOverview {
  totalTemplates: number
  activeTemplates: number
  byCategory: { category: string; count: number }[]
  recentlyUpdated: any[]
}

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
  createdBy?: {
    firstName: string
    lastName: string
  }
  updatedAt: string
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

export default function EmailTemplatesPage() {
  const [overview, setOverview] = useState<EmailTemplateOverview | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [defaults, setDefaults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [deleteKey, setDeleteKey] = useState<string | null>(null)
  const [testEmail, setTestEmail] = useState('')

  useEffect(() => {
    loadEmailTemplates()
  }, [])

  const loadEmailTemplates = async () => {
    try {
      setLoading(true)
      const [overviewRes, templatesRes, defaultsRes] = await Promise.all([
        adminApi.get('/admin/email-templates/overview'),
        adminApi.get('/admin/email-templates'),
        adminApi.get('/admin/email-templates/defaults')
      ])
      setOverview(overviewRes.data)
      setTemplates(templatesRes.data)
      setDefaults(defaultsRes.data)
    } catch (error) {
      console.error('Failed to load email templates:', error)
      showToast.error('Failed to load email templates')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = () => {
    setSelectedTemplate(null)
    setShowEditor(true)
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setShowEditor(true)
  }

  const handleSaveTemplate = async (data: any) => {
    try {
      if (selectedTemplate) {
        await adminApi.put(`/admin/email-templates/${selectedTemplate.key}`, data)
        showToast.success('Template updated successfully')
      } else {
        await adminApi.post('/admin/email-templates', data)
        showToast.success('Template created successfully')
      }
      setShowEditor(false)
      await loadEmailTemplates()
    } catch (error) {
      console.error('Failed to save template:', error)
      showToast.error('Failed to save template')
    }
  }

  const handleToggleTemplate = async (key: string, isActive: boolean) => {
    try {
      await adminApi.patch(`/admin/email-templates/${key}/toggle`, { isActive })
      showToast.success(`Template ${isActive ? 'activated' : 'deactivated'}`)
      await loadEmailTemplates()
    } catch (error) {
      console.error('Failed to toggle template:', error)
      showToast.error('Failed to toggle template')
    }
  }

  const handleDeleteTemplate = async () => {
    if (!deleteKey) return
    
    try {
      await adminApi.delete(`/admin/email-templates/${deleteKey}`)
      showToast.success('Template deleted successfully')
      setDeleteKey(null)
      await loadEmailTemplates()
    } catch (error) {
      console.error('Failed to delete template:', error)
      showToast.error('Failed to delete template')
    }
  }

  const handleDuplicateTemplate = async (key: string) => {
    const newKey = prompt('Enter a key for the new template:')
    if (!newKey) return
    
    try {
      await adminApi.post(`/admin/email-templates/${key}/duplicate`, { newKey })
      showToast.success('Template duplicated successfully')
      await loadEmailTemplates()
    } catch (error) {
      console.error('Failed to duplicate template:', error)
      showToast.error('Failed to duplicate template')
    }
  }

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setShowPreview(true)
  }

  const handleSendTestEmail = async (template: EmailTemplate) => {
    const email = prompt('Enter email address to send test:', testEmail)
    if (!email) return
    
    setTestEmail(email)
    
    try {
      const response = await adminApi.post(`/admin/email-templates/${template.key}/test`, {
        recipientEmail: email
      })
      showToast.success(response.data.message)
    } catch (error) {
      console.error('Failed to send test email:', error)
      showToast.error('Failed to send test email')
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

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
            <h1 className="text-2xl font-semibold text-foreground">Email Templates</h1>
            <p className="text-muted-foreground mt-1">
              Manage email templates and notifications
            </p>
          </div>
          <Button onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalTemplates}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{overview.activeTemplates}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.byCategory.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recently Updated */}
        {overview.recentlyUpdated.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">Recently Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {overview.recentlyUpdated.map(template => (
                  <Badge
                    key={template.id}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => handleEditTemplate(template)}
                  >
                    {template.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Templates</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    {overview.byCategory.map(cat => (
                      <TabsTrigger key={cat.category} value={cat.category}>
                        {categoryLabels[cat.category] || cat.category} ({cat.count})
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Variables</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">{template.key}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categoryLabels[template.category] || template.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {template.subject}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map(variable => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                        {template.variables.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.variables.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.isActive ? 'default' : 'secondary'}>
                        {template.isActive ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendTestEmail(template)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template.key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleTemplate(template.key, !template.isActive)}
                        >
                          {template.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteKey(template.key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Editor */}
        {showEditor && (
          <EmailTemplateEditor
            template={selectedTemplate}
            defaults={defaults}
            onSave={handleSaveTemplate}
            onCancel={() => setShowEditor(false)}
          />
        )}

        {/* Preview */}
        {showPreview && selectedTemplate && (
          <EmailTemplatePreview
            template={selectedTemplate}
            onClose={() => setShowPreview(false)}
            onSendTest={(email) => {
              setShowPreview(false)
              handleSendTestEmail(selectedTemplate)
            }}
          />
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteKey} onOpenChange={() => setDeleteKey(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Email Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this email template? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTemplate}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}