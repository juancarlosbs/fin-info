"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Juros Compostos" },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <header className="border-b bg-background">
      <nav className="mx-auto flex w-full max-w-4xl items-center gap-6 px-4 py-3">
        <span className="text-sm font-semibold text-foreground">Calculadoras</span>
        <div className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm transition-colors",
                pathname === link.href
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}
