'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Copy, Trash2, Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ApiKey {
  id: string
  description: string | null
  status: string
  createdAt: Date
  lastUsedAt: Date | null
}

interface ApiKeyActionsProps {
  apiKey: ApiKey
}

export function ApiKeyActions({ apiKey }: ApiKeyActionsProps) {
  const [showKey, setShowKey] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(apiKey.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const revokeApiKey = async () => {
    setIsRevoking(true)
    try {
      const response = await fetch(`/api/api-keys/${apiKey.id}/revoke`, {
        method: 'POST',
      })
      
      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error)
    }
    setIsRevoking(false)
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowKey(!showKey)}
      >
        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={copyToClipboard}
        disabled={copied}
      >
        <Copy className="h-4 w-4" />
        {copied ? 'Copied!' : 'Copy'}
      </Button>

      {apiKey.status === 'active' && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revoke API Key</DialogTitle>
              <DialogDescription>
                Are you sure you want to revoke this API key? This action cannot be undone and will immediately disable access for any applications using this key.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {}}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={revokeApiKey}
                disabled={isRevoking}
              >
                {isRevoking ? 'Revoking...' : 'Revoke Key'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}