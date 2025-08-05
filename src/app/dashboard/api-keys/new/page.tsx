import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { CreateApiKeyForm } from '@/components/create-api-key-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Key, AlertTriangle } from 'lucide-react'

export default async function NewApiKeyPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create API Key</h1>
        <p className="text-muted-foreground">
          Generate a new API key for OpenKJ desktop or Singr integration
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> API keys provide full access to your venue data. 
          Store them securely and only share with trusted applications.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            New API Key
          </CardTitle>
          <CardDescription>
            This key will allow OpenKJ desktop software or Singr tools to access your venue data and manage requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateApiKeyForm />
        </CardContent>
      </Card>
    </div>
  )
}