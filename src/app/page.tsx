'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Shield, Users, Smartphone, Zap, MapPin, Search, Heart, Bell, Clock, MessageSquare, DollarSign, Star } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: Zap,
      title: "Direct OpenKJ Integration",
      description: "Seamlessly integrate with OpenKJ or use our lightweight companion app to receive requests"
    },
    {
      icon: Users,
      title: "FREE Implementation Support",
      description: "We'll help you get started and ensure smooth deployment at your venue"
    },
    {
      icon: Shield,
      title: "Regular Updates & New Features",
      description: "Continuous improvements and new features to keep your karaoke experience fresh"
    },
    {
      icon: Smartphone,
      title: "Custom Branded App Option",
      description: "Get a custom branded app tailored to match your venue's unique brand and style"
    }
  ]

  const appFeatures = [
    {
      icon: Zap,
      title: "Modern Architecture",
      description: "Built with Node.js & React for lightning-fast performance"
    },
    {
      icon: MapPin,
      title: "Location Based Check In",
      description: "Singers automatically connect to your venue when they arrive"
    },
    {
      icon: Search,
      title: "Advanced Song Search",
      description: "FAST & ACCURATE search algorithm finds songs instantly"
    },
    {
      icon: Heart,
      title: "Submit & Save Favorites",
      description: "Easy song submission with favorites for repeat customers"
    }
  ]

  const comingSoonFeatures = [
    {
      icon: Bell,
      title: "In-App Singer Notifications",
      description: "Real-time notifications when it's time to sing"
    },
    {
      icon: Clock,
      title: "In-App Rotation Timer",
      description: "Singers can see exactly how long the wait is"
    },
    {
      icon: MessageSquare,
      title: "KJ/DJ Announcements",
      description: "Push notifications for important venue announcements"
    },
    {
      icon: DollarSign,
      title: "Virtual Tip Jar",
      description: "Easy digital tipping for performers and staff"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img
                src="/Color%20(For%20Light%20BG).svg"
                alt="Singr Karaoke"
                className="h-8 w-8"
              />
              <span className="ml-2 text-xl font-bold text-gray-900">Singr Karaoke Connect</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost" className="hover:bg-primary/10">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <img 
                src="/Color%20(For%20Light%20BG).svg" 
                alt="Singr Karaoke" 
                className="h-20 w-20 md:h-32 md:w-32"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Your Karaoke Experience with{' '}
              <span className="text-primary">Singr Karaoke Connect</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              The modern karaoke management platform that bridges the gap between KJs and singers. 
              Streamline song requests, engage your audience, and take your karaoke nights to the next level.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-lg px-8 py-3"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto text-lg px-8 py-3 border-primary text-primary hover:bg-primary/5"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
      </section>

      {/* Platform Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose <span className="text-primary">Singr Karaoke Connect?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide everything you need to modernize your karaoke operation and create unforgettable experiences for your customers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Singr Karaoke App Features */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              <span className="text-primary">Singr Karaoke App</span> Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Give your singers the ultimate karaoke experience with our feature-rich mobile app
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {appFeatures.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Coming Soon Section */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                🚀 Coming Soon
              </h3>
              <p className="text-gray-600">
                Exciting new features in development to make your karaoke experience even better
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {comingSoonFeatures.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-md">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your venue's needs. All plans include full platform access.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { 
                name: 'Monthly', 
                price: '$15', 
                interval: 'month', 
                savings: null,
                popular: false,
                features: ['Full Platform Access', 'Email Support', 'Unlimited Venues', 'Real-time Song Requests'] 
              },
              { 
                name: 'Semi-Annual', 
                price: '$12.50', 
                interval: 'month', 
                savings: '17% savings',
                popular: true,
                features: ['Full Platform Access', 'Priority Support', 'Unlimited Venues', 'Real-time Song Requests', 'Custom Branding Available'] 
              },
              { 
                name: 'Annual', 
                price: '$11.25', 
                interval: 'month', 
                savings: '25% savings',
                popular: false,
                features: ['Full Platform Access', 'Priority Support', 'Unlimited Venues', 'Real-time Song Requests', 'Custom Branding Available', 'Free Setup Consultation'] 
              },
            ].map((plan, index) => (
              <Card key={plan.name} className={`border-0 shadow-lg relative hover:shadow-xl transition-all duration-300 ${plan.popular ? 'ring-2 ring-primary transform scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">/{plan.interval}</span>
                  </div>
                  {plan.savings && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                        {plan.savings}
                      </span>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/auth/signup">
                      Choose {plan.name}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/auth/signup">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
              >
                Start Your Free Trial Today
              </Button>
            </Link>
            <p className="text-sm text-gray-500 mt-3">
              No credit card required • Cancel anytime • Setup support included
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/90">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Karaoke Experience?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join venues across the country who are already using Singr Karaoke Connect to create amazing karaoke experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button 
                size="lg" 
                variant="secondary" 
                className="w-full sm:w-auto text-lg px-8 py-3"
              >
                Start Free Trial
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-primary">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img 
                src="/B%26W%20(For%20Light%20BG).svg" 
                alt="Singr Karaoke" 
                className="h-8 w-8 brightness-0 invert"
              />
              <span className="ml-2 text-xl font-bold">Singr Karaoke Connect</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 Singr Karaoke. All rights reserved. Revolutionizing karaoke experiences worldwide.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}