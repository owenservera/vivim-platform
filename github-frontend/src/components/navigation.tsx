"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Github, 
  Book, 
  Users, 
  Package, 
  CircleIssue, 
  GitPullRequest, 
  Star, 
  GitFork, 
  Menu, 
  X,
  Sparkles,
  Globe,
  Code2,
  Rocket
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/", label: "Overview", icon: null },
  { href: "/repository", label: "Repository", icon: Globe },
  { href: "/issues", label: "Issues", icon: CircleIssue },
  { href: "/pull-requests", label: "Pull Requests", icon: GitPullRequest },
  { href: "/contributors", label: "Contributors", icon: Users },
  { href: "/releases", label: "Releases", icon: Package },
  { href: "/sdk", label: "SDK", icon: Code2 },
  { href: "/docs", label: "Docs", icon: Book },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled 
          ? "bg-background/80 backdrop-blur-xl border-b shadow-lg shadow-primary/5" 
          : "bg-background/50 border-b-0"
      )}
    >
      <div className="container relative">
        {/* Gradient line at top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2"
            >
              <div className="relative">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <motion.div
                  className="absolute -inset-1 rounded-xl bg-primary/30 blur-sm"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <span className="font-bold text-xl hidden sm:inline-block bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                VIVIM
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-primary-foreground"
                        : "text-foreground/80 hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 rounded-lg"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {item.label}
                    </span>
                  </motion.button>
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* GitHub Stars - Animated */}
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="https://github.com/owenservera/vivim-app"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border bg-card/50 hover:bg-card transition-all hover:border-primary/50 group"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="relative"
              >
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <motion.div
                  className="absolute inset-0 rounded-full bg-yellow-400/30 blur-sm"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>
              <span className="text-sm font-medium">Star</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">128</span>
            </motion.a>

            {/* Forks */}
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="https://github.com/owenservera/vivim-app/fork"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border bg-card/50 hover:bg-card transition-all hover:border-primary/50"
            >
              <GitFork className="h-4 w-4" />
              <span className="text-sm font-medium">Fork</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">34</span>
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
              <Button variant="ghost" size="icon" className="hidden sm:flex hover:bg-primary/10">
                <Github className="h-5 w-5" />
              </Button>
            </motion.a>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden border-t bg-background/95 backdrop-blur-xl"
          >
            <div className="container py-4 space-y-2">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-gradient-to-r from-primary to-purple-600 text-white"
                          : "text-foreground hover:bg-accent"
                      )}
                    >
                      {item.icon && <item.icon className="h-5 w-5" />}
                      <span>{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto h-2 w-2 rounded-full bg-white"
                        />
                      )}
                    </motion.button>
                  </Link>
                )
              })}
              
              <div className="pt-4 mt-2 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href="https://github.com/owenservera/vivim-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm font-medium px-4 py-2 rounded-lg border bg-card/50 hover:bg-card"
                  >
                    <Github className="h-4 w-4" />
                    <span>View on GitHub</span>
                  </motion.a>
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href="https://github.com/owenservera/vivim-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-purple-600 text-white"
                  >
                    <Star className="h-4 w-4 fill-current" />
                    <span>Star us</span>
                  </motion.a>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
