import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/Input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { showToast } from '@/components/ui/Toast'
import { 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  Eye, 
  Download,
  Upload,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  History,
  Calendar
} from 'lucide-react'
import { adminApi } from '@/services/adminApi'
import PolicyEditor from '@/components/admin/content/PolicyEditor'
import PolicyPreview from '@/components/admin/content/PolicyPreview'
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
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PolicyOverview {
  totalPolicies: number
  activePolicies: number
  byCategory: { category: string; count: number }[]
  requiresUpdate: number
  recentChanges: any[]
}

interface Policy {
  id: string
  key: string
  title: string
  content: string
  contentHtml?: string
  contentType: string
  isPublished: boolean
  publishedAt?: string
  metadata: {
    category: string
    version: string
    effectiveDate?: string
    requiresAcceptance?: boolean
  }
  createdBy?: {
    firstName: string
    lastName: string
  }
  publishedBy?: {
    firstName: string
    lastName: string
  }
  updatedAt: string
}

const categoryLabels: { [key: string]: string } = {
  terms_of_service: 'Terms of Service',
  privacy_policy: 'Privacy Policy',
  cookie_policy: 'Cookie Policy',
  refund_policy: 'Refund Policy',
  accessibility: 'Accessibility Statement'
}

export default function PoliciesPage() {
  const [overview, setOverview] = useState<PolicyOverview | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [defaults, setDefaults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [deleteKey, setDeleteKey] = useState<string | null>(null)

  useEffect(() => {
    loadPolicies()
  }, [])

  const loadPolicies = async () => {
    try {
      setLoading(true)
      const [overviewRes, policiesRes, defaultsRes] = await Promise.all([
        adminApi.get('/admin/policies/overview'),
        adminApi.get('/admin/policies'),
        adminApi.get('/admin/policies/defaults')
      ])
      setOverview(overviewRes.data)
      setPolicies(policiesRes.data)
      setDefaults(defaultsRes.data)
    } catch (error) {
      console.error('Failed to load policies:', error)
      showToast.error('Failed to load policies')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePolicy = () => {
    setSelectedPolicy(null)
    setShowEditor(true)
  }

  const handleEditPolicy = (policy: Policy) => {
    setSelectedPolicy(policy)
    setShowEditor(true)
  }

  const handleSavePolicy = async (data: any) => {
    try {
      if (selectedPolicy) {
        await adminApi.put(`/admin/policies/${selectedPolicy.key}`, data)
        showToast.success('Policy updated successfully')
      } else {
        await adminApi.post('/admin/policies', data)
        showToast.success('Policy created successfully')
      }
      setShowEditor(false)
      await loadPolicies()
    } catch (error) {
      console.error('Failed to save policy:', error)
      showToast.error('Failed to save policy')
    }
  }

  const handlePublishPolicy = async (key: string) => {
    try {
      await adminApi.post(`/admin/policies/${key}/publish`)
      showToast.success('Policy published successfully')
      await loadPolicies()
    } catch (error) {
      console.error('Failed to publish policy:', error)
      showToast.error('Failed to publish policy')
    }
  }

  const handleUnpublishPolicy = async (key: string) => {
    try {
      await adminApi.post(`/admin/policies/${key}/unpublish`)
      showToast.success('Policy unpublished successfully')
      await loadPolicies()
    } catch (error) {
      console.error('Failed to unpublish policy:', error)
      showToast.error('Failed to unpublish policy')
    }
  }

  const handleDeletePolicy = async () => {
    if (!deleteKey) return
    
    try {
      await adminApi.delete(`/admin/policies/${deleteKey}`)
      showToast.success('Policy deleted successfully')
      setDeleteKey(null)
      await loadPolicies()
    } catch (error) {
      console.error('Failed to delete policy:', error)
      showToast.error('Failed to delete policy')
    }
  }

  const handleDuplicatePolicy = async (key: string) => {
    const newKey = prompt('Enter a key for the new policy:')
    if (!newKey) return
    
    try {
      await adminApi.post(`/admin/policies/${key}/duplicate`, { newKey })
      showToast.success('Policy duplicated successfully')
      await loadPolicies()
    } catch (error) {
      console.error('Failed to duplicate policy:', error)
      showToast.error('Failed to duplicate policy')
    }
  }

  const handleExportPolicy = async (key: string, format: string) => {
    try {
      const response = await adminApi.get(`/admin/policies/${key}/export/${format}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${key}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      showToast.success(`Policy exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Failed to export policy:', error)
      showToast.error('Failed to export policy')
    }
  }

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         policy.key.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || policy.metadata.category === selectedCategory
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
            <h1 className="text-2xl font-semibold text-foreground">Policy Editor</h1>
            <p className="text-muted-foreground mt-1">
              Manage terms of service, privacy policies, and legal documents
            </p>
          </div>
          <Button onClick={handleCreatePolicy}>
            <Plus className="h-4 w-4 mr-2" />
            New Policy
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalPolicies}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{overview.activePolicies}</div>
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Needs Update</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{overview.requiresUpdate}</div>
            </CardContent>
          </Card>
        </div>

        {/* Update Alert */}
        {overview.requiresUpdate > 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {overview.requiresUpdate} {overview.requiresUpdate === 1 ? 'policy hasn\'t' : 'policies haven\'t'} been 
              updated in over 6 months. Consider reviewing them for accuracy.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Policies</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search policies..."
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
                  <TableHead>Policy</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{policy.title}</div>
                        <div className="text-sm text-muted-foreground">{policy.key}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categoryLabels[policy.metadata.category] || policy.metadata.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        v{policy.metadata.version || '1.0.0'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {policy.metadata.effectiveDate 
                        ? new Date(policy.metadata.effectiveDate).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={policy.isPublished ? 'default' : 'secondary'}>
                        {policy.isPublished ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Published</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Draft</>
                        )}
                      </Badge>
                      {policy.metadata.requiresAcceptance && (
                        <Badge variant="outline" className="ml-1">
                          Requires Acceptance
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(policy.updatedAt).toLocaleDateString()}
                        {policy.publishedBy && (
                          <div className="text-xs text-muted-foreground">
                            by {policy.publishedBy.firstName} {policy.publishedBy.lastName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPolicy(policy)
                            setShowPreview(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPolicy(policy)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPolicy(policy)
                            setShowHistory(true)
                          }}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicatePolicy(policy.key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => 
                            policy.isPublished 
                              ? handleUnpublishPolicy(policy.key)
                              : handlePublishPolicy(policy.key)
                          }
                        >
                          {policy.isPublished ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportPolicy(policy.key, 'html')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteKey(policy.key)}
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
          <PolicyEditor
            policy={selectedPolicy}
            defaults={defaults}
            onSave={handleSavePolicy}
            onCancel={() => setShowEditor(false)}
          />
        )}

        {/* Preview */}
        {showPreview && selectedPolicy && (
          <PolicyPreview
            policy={selectedPolicy}
            onClose={() => setShowPreview(false)}
            onExport={(format) => handleExportPolicy(selectedPolicy.key, format)}
          />
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteKey} onOpenChange={() => setDeleteKey(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Policy</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this policy? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePolicy}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}