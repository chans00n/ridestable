import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  DollarSign
} from 'lucide-react'

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

interface PricingRulesListProps {
  rules: PricingRule[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters: {
    search: string
    serviceType: string
    ruleType: string
    isActive?: boolean
  }
  onFiltersChange: (filters: any) => void
  onPageChange: (page: number) => void
  onEdit: (rule: PricingRule) => void
  onDuplicate: (rule: PricingRule) => void
  onToggle: (rule: PricingRule) => void
  onDelete: (rule: PricingRule) => void
  isLoading: boolean
}

const ruleTypeLabels: Record<string, string> = {
  base_rate: 'Base Rate',
  distance_multiplier: 'Distance Multiplier',
  time_multiplier: 'Time Multiplier',
  surcharge: 'Surcharge',
  discount: 'Discount'
}

const serviceTypeLabels: Record<string, string> = {
  ONE_WAY: 'One Way',
  ROUNDTRIP: 'Round Trip',
  HOURLY: 'Hourly'
}

export default function PricingRulesList({
  rules,
  pagination,
  filters,
  onFiltersChange,
  onPageChange,
  onEdit,
  onDuplicate,
  onToggle,
  onDelete,
  isLoading
}: PricingRulesListProps) {
  const [localFilters, setLocalFilters] = useState(filters)

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const getCalculationSummary = (calculation: any) => {
    if (!calculation) return 'Not configured'
    
    switch (calculation.type) {
      case 'fixed':
        return `$${calculation.value}`
      case 'percentage':
        return `${calculation.value}%`
      case 'per_mile':
        return `$${calculation.value}/mile`
      case 'per_minute':
        return `$${calculation.value}/min`
      case 'per_hour':
        return `$${calculation.value}/hr`
      default:
        return 'Custom'
    }
  }

  const isRuleExpired = (rule: PricingRule) => {
    if (!rule.effectiveTo) return false
    return new Date(rule.effectiveTo) < new Date()
  }

  const isRulePending = (rule: PricingRule) => {
    return new Date(rule.effectiveFrom) > new Date()
  }

  const getRuleStatus = (rule: PricingRule) => {
    if (!rule.isActive) return { label: 'Inactive', variant: 'secondary' as const }
    if (isRuleExpired(rule)) return { label: 'Expired', variant: 'destructive' as const }
    if (isRulePending(rule)) return { label: 'Pending', variant: 'outline' as const }
    return { label: 'Active', variant: 'default' as const }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Rules</CardTitle>
        <CardDescription>Manage and configure pricing rules for your services</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search rules..."
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={localFilters.serviceType}
            onValueChange={(value) => handleFilterChange('serviceType', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Service Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="ONE_WAY">One Way</SelectItem>
              <SelectItem value="ROUNDTRIP">Round Trip</SelectItem>
              <SelectItem value="HOURLY">Hourly</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={localFilters.ruleType}
            onValueChange={(value) => handleFilterChange('ruleType', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rule Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="base_rate">Base Rate</SelectItem>
              <SelectItem value="distance_multiplier">Distance Multiplier</SelectItem>
              <SelectItem value="time_multiplier">Time Multiplier</SelectItem>
              <SelectItem value="surcharge">Surcharge</SelectItem>
              <SelectItem value="discount">Discount</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={localFilters.isActive === undefined ? 'all' : localFilters.isActive.toString()}
            onValueChange={(value) => handleFilterChange('isActive', value === 'all' ? undefined : value === 'true')}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Calculation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Effective Period</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Loading rules...
                  </TableCell>
                </TableRow>
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No pricing rules found
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => {
                  const status = getRuleStatus(rule)
                  return (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          {rule.description && (
                            <div className="text-sm text-muted-foreground">{rule.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ruleTypeLabels[rule.ruleType] || rule.ruleType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {serviceTypeLabels[rule.serviceType] || rule.serviceType}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{rule.priority}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span className="text-sm">{getCalculationSummary(rule.calculation)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(rule.effectiveFrom).toLocaleDateString()}
                          </div>
                          {rule.effectiveTo && (
                            <div className="text-muted-foreground">
                              to {new Date(rule.effectiveTo).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(rule)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicate(rule)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onToggle(rule)}>
                              {rule.isActive ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onDelete(rule)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} rules
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              {[...Array(pagination.pages)].map((_, i) => {
                const page = i + 1
                if (
                  page === 1 ||
                  page === pagination.pages ||
                  (page >= pagination.page - 1 && page <= pagination.page + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      variant={page === pagination.page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </Button>
                  )
                } else if (page === pagination.page - 2 || page === pagination.page + 2) {
                  return <span key={page} className="px-2">...</span>
                }
                return null
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}