import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            OpenKJ Multi-Tenant Platform
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Professional karaoke request management system with integrated billing and multi-venue support
          </p>
        </header>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎤 Multi-Venue Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage multiple karaoke venues from a single dashboard with individual settings and request queues.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💳 Integrated Billing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Stripe-powered subscription management with flexible pricing tiers and automatic invoicing.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔗 OpenKJ Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Seamless integration with OpenKJ desktop software for professional karaoke hosts.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Get Started Today</CardTitle>
              <CardDescription>
                Create your account and start managing your karaoke venues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/auth/signup">
                <Button className="w-full" size="lg">
                  Sign Up for Free Trial
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" className="w-full" size="lg">
                  Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}