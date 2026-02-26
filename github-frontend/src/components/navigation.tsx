"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Github, Book, Users, Package, CircleIssue, GitPullRequest, Star, GitFork, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/", label: "Overview", icon: null },
  { href: "/repository", label: "Repository", icon: null },
  { href: "/issues", label: "Issues", icon: CircleIssue },
  { href: "/pull-requests", label: "Pull Requests", icon: GitPullRequest },
  { href: "/contributors", label: "Contributors", icon: Users },
  { href: "/releases", label: "Releases", icon: Package },
  { href: "/sdk", label: "SDK", icon: Package },
  { href: "/docs", label: "Docs", icon: Book },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2"
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">V</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline-block">VIVIM</span>
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                )}
              >
                {item.label}
              </motion.button>
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          {/* GitHub Stars */}
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://github.com/owenservera/vivim-app"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center space-x-1 px-3 py-2 rounded-md border bg-background hover:bg-accent transition-colors"
          >
            <Star className="h-4 w-4 fill-current text-yellow-500" />
            <span className="text-sm font-medium">Star</span>
          </motion.a>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* GitHub Link */}
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://github.com/owenservera/vivim-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Github className="h-5 w-5" />
            </Button>
          </motion.a>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t"
        >
          <div className="container py-4 space-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </motion.button>
              </Link>
            ))}
            <div className="pt-4 border-t flex items-center justify-between">
              <a
                href="https://github.com/owenservera/vivim-app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-sm font-medium"
              >
                <Github className="h-4 w-4" />
                <span>View on GitHub</span>
              </a>
              <ThemeToggle />
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
