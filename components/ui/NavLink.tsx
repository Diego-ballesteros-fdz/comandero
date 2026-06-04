'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
          : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
      }`}
    >
      {children}
    </Link>
  )
}
