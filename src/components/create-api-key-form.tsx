'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, CheckIcon } from 'lucide-react'

export function CreateApiKeyForm() {
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create API key')
      }

      setApiKey(data.apiKey)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (apiKey) {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDone = () => {
    router.push('/dashboard/api-keys')
  }

  if (apiKey) {
    return (
      <div className="space-y-4">
        <Alert>
          <CheckIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>API Key Created Successfully!</strong> Copy this key now - you won't be able to see it again.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label>Your API Key</Label>
          <div className="flex space-x-2">
            <Input
              value={apiKey}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              disabled={copied}
            >
              {copied ? <CheckIcon className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Keep this key secure:</strong> Store it in a safe place like a password manager. 
            Anyone with this key can access your venue data through the OpenKJ API.
          </AlertDescription>
        </Alert>

        <Button onClick={handleDone} className="w-full">
          Done
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="e.g., OpenKJ Desktop - Main Venue"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          Give this API key a descriptive name to help you identify it later.
        </p>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating...' : 'Create API Key'}
      </Button>
    </form>
  )
}