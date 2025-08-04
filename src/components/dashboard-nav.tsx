'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Venues', href: '/dashboard/venues' },
  { name: 'API Keys', href: '/dashboard/api-keys' },
  { name: 'Song Database', href: '/dashboard/songs' },
  { name: 'Requests', href: '/dashboard/requests' },
  { name: 'Billing', href: '/dashboard/billing' },
  { name: 'Settings', href: '/dashboard/settings' },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="p-4 space-y-2">
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
            pathname === item.href
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  )
}