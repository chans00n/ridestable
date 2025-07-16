import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface PricingOverviewProps {
  overview: {
    totalRules: number
    activeRules: number
    expiredRules: number
    pendingRules: number
    rulesByType: Record<string, number>
    recentChanges: Array<{
      id: string
      name: string
      ruleType: string
      serviceType: string
      isActive: boolean
      updatedAt: string
      createdBy: string
    }>
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const ruleTypeLabels: Record<string, string> = {
  base_rate: 'Base Rate',
  distance_multiplier: 'Distance Multiplier',
  time_multiplier: 'Time Multiplier',
  surcharge: 'Surcharge',
  discount: 'Discount'
}

export default function PricingOverview({ overview }: PricingOverviewProps) {
  const ruleTypeData = Object.entries(overview.rulesByType).map(([type, count]) => ({
    name: ruleTypeLabels[type] || type,
    value: count
  }))

  const statusData = [
    { name: 'Active', value: overview.activeRules, color: '#10b981' },
    { name: 'Expired', value: overview.expiredRules, color: '#ef4444' },
    { name: 'Pending', value: overview.pendingRules, color: '#f59e0b' }
  ]

  const activePercentage = overview.totalRules > 0 ? (overview.activeRules / overview.totalRules) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalRules}</div>
            <p className="text-xs text-muted-foreground">
              All pricing rules in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overview.activeRules}</div>
            <div className="mt-2">
              <Progress value={activePercentage} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activePercentage.toFixed(1)}% of total rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overview.expiredRules}</div>
            <p className="text-xs text-muted-foreground">
              Past effective date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{overview.pendingRules}</div>
            <p className="text-xs text-muted-foreground">
              Future effective date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rules by Type</CardTitle>
            <CardDescription>Distribution of pricing rule types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ruleTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {ruleTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rule Status</CardTitle>
            <CardDescription>Active, expired, and pending rules</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Changes</CardTitle>
          <CardDescription>Latest pricing rule modifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overview.recentChanges.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent changes</p>
            ) : (
              overview.recentChanges.map((change) => (
                <div
                  key={change.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{change.name}</span>
                      <Badge variant={change.isActive ? 'default' : 'secondary'}>
                        {change.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {ruleTypeLabels[change.ruleType] || change.ruleType} • {change.serviceType}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{change.createdBy}</div>
                    <div>{new Date(change.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}