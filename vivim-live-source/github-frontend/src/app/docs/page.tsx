"use client"

import { motion } from "framer-motion"
import { 
  Book, 
  FileText, 
  ExternalLink, 
  Github,
  Search,
  ChevronRight,
  Code2,
  Settings,
  Zap,
  Shield,
  Network
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

const docsSections = [
  {
    icon: Book,
    title: "Getting Started",
    description: "Learn the basics and get up and running quickly",
    pages: [
      { name: "Introduction", href: "#" },
      { name: "Installation", href: "#" },
      { name: "Quick Start Guide", href: "#" },
      { name: "Project Structure", href: "#" },
    ],
  },
  {
    icon: Code2,
    title: "Development",
    description: "Development workflow and best practices",
    pages: [
      { name: "Development Setup", href: "#" },
      { name: "Running Locally", href: "#" },
      { name: "Testing Guide", href: "#" },
      { name: "Debugging", href: "#" },
    ],
  },
  {
    icon: Settings,
    title: "Configuration",
    description: "Configure VIVIM for your needs",
    pages: [
      { name: "Environment Variables", href: "#" },
      { name: "Database Setup", href: "#" },
      { name: "P2P Configuration", href: "#" },
      { name: "AI Settings", href: "#" },
    ],
  },
  {
    icon: Zap,
    title: "API Reference",
    description: "Complete API documentation",
    pages: [
      { name: "API Overview", href: "#" },
      { name: "Authentication", href: "#" },
      { name: "Endpoints", href: "#" },
      { name: "Error Handling", href: "#" },
    ],
  },
  {
    icon: Shield,
    title: "Security",
    description: "Security features and best practices",
    pages: [
      { name: "Security Overview", href: "#" },
      { name: "Authentication", href: "#" },
      { name: "Data Privacy", href: "#" },
      { name: "Best Practices", href: "#" },
    ],
  },
  {
    icon: Network,
    title: "P2P Network",
    description: "Understanding the P2P networking system",
    pages: [
      { name: "Network Architecture", href: "#" },
      { name: "Node Discovery", href: "#" },
      { name: "Data Synchronization", href: "#" },
      { name: "Troubleshooting", href: "#" },
    ],
  },
]

const recentUpdates = [
  {
    title: "Added P2P Networking Guide",
    date: new Date().toISOString(),
    description: "Comprehensive guide for understanding and configuring the P2P network",
  },
  {
    title: "Updated API Documentation",
    date: new Date(Date.now() - 86400000).toISOString(),
    description: "Complete API reference with examples and error codes",
  },
  {
    title: "New Security Best Practices",
    date: new Date(Date.now() - 172800000).toISOString(),
    description: "Security guidelines for production deployments",
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <div className="container py-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Book className="h-8 w-8" />
                <div>
                  <h1 className="text-3xl font-bold">Documentation</h1>
                  <p className="text-muted-foreground">Everything you need to know about VIVIM</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Github className="h-4 w-4" />
                  Edit on GitHub
                </Button>
                <Button className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Full Docs
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search documentation..."
                className="pl-12 h-12 text-lg"
              />
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Quick Start</h3>
                    <p className="text-sm text-muted-foreground">Get started in 5 minutes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Code2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">API Reference</h3>
                    <p className="text-sm text-muted-foreground">Complete API docs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Configuration</h3>
                    <p className="text-sm text-muted-foreground">Setup guide</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Documentation Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          >
            {docsSections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <section.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.pages.map((page) => (
                        <li key={page.name}>
                          <a
                            href={page.href}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ChevronRight className="h-4 w-4" />
                            {page.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Recent Updates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {recentUpdates.map((update, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <h3 className="font-semibold mb-1">{update.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{update.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Updated {new Date(update.date).toLocaleDateString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contributing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10">
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-bold">Want to Improve the Docs?</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Documentation is a community effort. Help us improve by contributing edits, fixes, or new pages.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button className="gap-2">
                      <Github className="h-4 w-4" />
                      Contribute on GitHub
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <FileText className="h-4 w-4" />
                      View Style Guide
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
