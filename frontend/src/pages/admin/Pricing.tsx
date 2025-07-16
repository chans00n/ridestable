import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { showToast } from '@/components/ui/Toast'
import { Plus, Settings, TrendingUp, AlertTriangle } from 'lucide-react'
import { adminApi } from '@/services/adminApi'
import PricingOverview from '@/components/admin/pricing/PricingOverview'
import PricingRulesList from '@/components/admin/pricing/PricingRulesList'
import PricingRuleForm from '@/components/admin/pricing/PricingRuleForm'

interface PricingOverviewData {
  totalRules: number
  activeRules: number
  expiredRules: number
  pendingRules: number
  rulesByType: Record<string, number>
  recentChanges: any[]
}

interface PricingRule {
  id: string
  name: string
  description?: string
  ruleType: string
  serviceType: string
  priority: number
  isActive: boolean
  effectiveFrom: string
  effectiveTo?: string
  calculation: any
  conditions: any
  createdBy: string
  createdAt: string
  updatedAt: string
}

export default function PricingDashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  
  // State for overview
  const [overview, setOverview] = useState<PricingOverviewData | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  
  // State for rules list
  const [rules, setRules] = useState<PricingRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [filters, setFilters] = useState({
    search: '',
    serviceType: '',
    ruleType: '',
    isActive: undefined as boolean | undefined
  })
  
  // State for form
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    if (activeTab !== searchParams.get('tab')) {
      setSearchParams({ tab: activeTab })
    }
  }, [activeTab, searchParams, setSearchParams])

  useEffect(() => {
    loadOverview()
  }, [])

  useEffect(() => {
    if (activeTab === 'rules') {
      loadRules()
    }
  }, [activeTab, pagination.page, filters])

  const loadOverview = async () => {
    try {
      setOverviewLoading(true)
      const response = await adminApi.get('/admin/pricing/overview')
      setOverview(response.data)
    } catch (error) {
      console.error('Failed to load pricing overview:', error)
      showToast.error('Failed to load pricing overview')
    } finally {
      setOverviewLoading(false)
    }
  }

  const loadRules = async () => {
    try {
      setRulesLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '' && value !== undefined)
        )
      })
      
      const response = await adminApi.get(`/admin/pricing/rules?${params}`)
      setRules(response.data.rules)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to load pricing rules:', error)
      showToast.error('Failed to load pricing rules')
    } finally {
      setRulesLoading(false)
    }
  }

  const handleCreateRule = () => {
    setEditingRule(null)
    setShowForm(true)
  }

  const handleEditRule = (rule: PricingRule) => {
    setEditingRule(rule)
    setShowForm(true)
  }

  const handleDuplicateRule = async (rule: PricingRule) => {
    try {
      await adminApi.post(`/admin/pricing/rules/${rule.id}/duplicate`)
      showToast.success('Pricing rule duplicated successfully')
      loadRules()
      if (activeTab === 'overview') {
        loadOverview()
      }
    } catch (error) {
      console.error('Failed to duplicate pricing rule:', error)
      showToast.error('Failed to duplicate pricing rule')
    }
  }

  const handleToggleRule = async (rule: PricingRule) => {
    try {
      await adminApi.patch(`/admin/pricing/rules/${rule.id}/toggle`, {
        isActive: !rule.isActive
      })
      showToast.success(`Pricing rule ${rule.isActive ? 'deactivated' : 'activated'} successfully`)
      loadRules()
      if (activeTab === 'overview') {
        loadOverview()
      }
    } catch (error) {
      console.error('Failed to toggle pricing rule:', error)
      showToast.error('Failed to update pricing rule')
    }
  }

  const handleDeleteRule = async (rule: PricingRule) => {
    if (!confirm(`Are you sure you want to delete "${rule.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await adminApi.delete(`/admin/pricing/rules/${rule.id}`)
      showToast.success('Pricing rule deleted successfully')
      loadRules()
      if (activeTab === 'overview') {
        loadOverview()
      }
    } catch (error) {
      console.error('Failed to delete pricing rule:', error)
      showToast.error('Failed to delete pricing rule')
    }
  }

  const handleSubmitForm = async (data: any) => {
    try {
      setFormLoading(true)
      
      if (editingRule) {
        await adminApi.put(`/admin/pricing/rules/${editingRule.id}`, data)
        showToast.success('Pricing rule updated successfully')
      } else {
        await adminApi.post('/admin/pricing/rules', data)
        showToast.success('Pricing rule created successfully')
      }
      
      setShowForm(false)
      setEditingRule(null)
      loadRules()
      if (activeTab === 'overview') {
        loadOverview()
      }
    } catch (error: any) {
      console.error('Failed to save pricing rule:', error)
      showToast.error(error.response?.data?.message || 'Failed to save pricing rule')
    } finally {
      setFormLoading(false)
    }
  }

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  if (showForm) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-foreground">
              {editingRule ? 'Edit Pricing Rule' : 'Create Pricing Rule'}
            </h1>
          </div>

          <PricingRuleForm
            rule={editingRule}
            onSubmit={handleSubmitForm}
            onCancel={() => {
              setShowForm(false)
              setEditingRule(null)
            }}
            isLoading={formLoading}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Pricing Configuration</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button size="sm" onClick={handleCreateRule}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Rules Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {overviewLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading pricing overview...</p>
                </div>
              </CardContent>
            </Card>
          ) : overview ? (
            <PricingOverview overview={overview} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Failed to load pricing overview</p>
                  <Button variant="outline" onClick={loadOverview} className="mt-2">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <PricingRulesList
            rules={rules}
            pagination={pagination}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onPageChange={handlePageChange}
            onEdit={handleEditRule}
            onDuplicate={handleDuplicateRule}
            onToggle={handleToggleRule}
            onDelete={handleDeleteRule}
            isLoading={rulesLoading}
          />
        </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}