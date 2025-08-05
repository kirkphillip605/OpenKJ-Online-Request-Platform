import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Key, Clock, AlertTriangle, Copy, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { ApiKeyActions } from '@/components/api-key-actions'

export default async function ApiKeysPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      customer: {
        include: {
          apiKeys: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      },
    },
  })

  const apiKeys = user?.customer?.apiKeys || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage API keys for OpenKJ and Singr integration
          </p>
        </div>
        <Link href="/dashboard/api-keys/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create API Key
          </Button>
        </Link>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          API keys provide access to your venue data. Keep them secure and only share with trusted applications like OpenKJ.
        </AlertDescription>
      </Alert>

      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create an API key to connect OpenKJ desktop software or Singr tools to your account
            </p>
            <Link href="/dashboard/api-keys/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First API Key
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {apiKey.description || 'Unnamed API Key'}
                    </CardTitle>
                    <CardDescription>
                      Created {new Date(apiKey.createdAt).toLocaleDateString()}
                      {apiKey.lastUsedAt && (
                        <span className="ml-2">
                          • Last used {new Date(apiKey.lastUsedAt).toLocaleDateString()}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      apiKey.status === 'active' 
                        ? 'default' 
                        : apiKey.status === 'revoked' 
                        ? 'destructive' 
                        : 'secondary'
                    }
                  >
                    {apiKey.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {apiKey.id.substring(0, 8)}...{apiKey.id.substring(apiKey.id.length - 8)}
                    </code>
                  </div>
                  <ApiKeyActions apiKey={apiKey} />
                </div>
                
                {!apiKey.lastUsedAt && apiKey.status === 'active' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">
                        This API key hasn't been used yet
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Integration Setup</CardTitle>
          <CardDescription>
            How to configure OpenKJ desktop software or Singr tools with your API key
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Copy your API key</h4>
            <p className="text-sm text-muted-foreground">
              Create and copy an API key from above
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">2. Configure OpenKJ</h4>
            <p className="text-sm text-muted-foreground">
              In OpenKJ, go to Settings → Request Server and enter:
            </p>
            <div className="bg-muted p-3 rounded-md space-y-1">
              <div className="text-sm">
                <strong>Server URL:</strong> <code>{process.env.NEXTAUTH_URL || 'https://your-domain.com'}/api/openkj</code>
              </div>
              <div className="text-sm">
                <strong>API Key:</strong> <code>[Your API Key]</code>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">3. Test Connection</h4>
            <p className="text-sm text-muted-foreground">
              Use the "Test Connection" button in OpenKJ to verify the setup
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}