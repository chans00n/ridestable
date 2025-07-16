import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, Calendar, User, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Policy {
  id: string
  key: string
  title: string
  content: string
  contentHtml?: string
  isPublished: boolean
  publishedAt?: string
  metadata: {
    category: string
    version: string
    effectiveDate?: string
    requiresAcceptance?: boolean
  }
  publishedBy?: {
    firstName: string
    lastName: string
  }
  updatedAt: string
}

interface PolicyPreviewProps {
  policy: Policy
  onClose: () => void
  onExport: (format: string) => void
}

const categoryLabels: { [key: string]: string } = {
  terms_of_service: 'Terms of Service',
  privacy_policy: 'Privacy Policy',
  cookie_policy: 'Cookie Policy',
  refund_policy: 'Refund Policy',
  accessibility: 'Accessibility Statement'
}

export default function PolicyPreview({ policy, onClose, onExport }: PolicyPreviewProps) {
  const renderContent = () => {
    if (policy.contentHtml) {
      return (
        <div 
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: policy.contentHtml }}
        />
      )
    }
    
    // Simple markdown to HTML conversion for preview
    let html = policy.content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\* (.+)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
    
    return (
      <div 
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }}
      />
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{policy.title}</DialogTitle>
          <DialogDescription>
            {categoryLabels[policy.metadata.category] || policy.metadata.category}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Version {policy.metadata.version || '1.0.0'}
              </Badge>
            </div>
            
            {policy.metadata.effectiveDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Effective: {new Date(policy.metadata.effectiveDate).toLocaleDateString()}
              </div>
            )}
            
            {policy.publishedAt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                Published: {new Date(policy.publishedAt).toLocaleDateString()}
              </div>
            )}
            
            {policy.publishedBy && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                {policy.publishedBy.firstName} {policy.publishedBy.lastName}
              </div>
            )}
          </div>

          {policy.metadata.requiresAcceptance && (
            <Card className="p-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                This policy requires user acceptance before they can use the service.
              </p>
            </Card>
          )}

          {/* Content */}
          <div className="border rounded-lg p-6 bg-white dark:bg-gray-900">
            {renderContent()}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('html')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export HTML
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('markdown')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Markdown
              </Button>
            </div>
            
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}