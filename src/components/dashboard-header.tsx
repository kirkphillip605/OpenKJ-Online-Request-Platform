'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

interface DashboardHeaderProps {
  userEmail?: string | null
}

export function DashboardHeader({ userEmail }: DashboardHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">
        {userEmail}
      </span>
      <Button
        variant="outline"
        onClick={() => signOut({ callbackUrl: '/' })}
      >
        Sign Out
      </Button>
    </div>
  )
}