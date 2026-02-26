"use client"

import { motion } from "framer-motion"
import { 
  Package, 
  Download, 
  Tag, 
  Calendar,
  FileText,
  GitCommit,
  ExternalLink,
  Github
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDate } from "@/lib/utils"

const releases = [
  {
    version: "v1.0.0",
    name: "Initial Release",
    date: new Date("2024-01-15").toISOString(),
    author: "VIVIM Team",
    description: "The first stable release of VIVIM! This release includes the core AI memory platform with P2P networking capabilities.",
    highlights: [
      "Core AI memory system implementation",
      "P2P networking engine",
      "React PWA frontend",
      "Express.js API server",
      "Admin panel dashboard",
      "Complete documentation",
    ],
    commits: 156,
    contributors: 8,
    isLatest: true,
    isPrerelease: false,
  },
  {
    version: "v0.9.0-beta",
    name: "Beta Release",
    date: new Date("2023-12-01").toISOString(),
    author: "VIVIM Team",
    description: "Beta release with most features implemented. Ready for testing and feedback.",
    highlights: [
      "Beta AI memory features",
      "Early P2P implementation",
      "Basic PWA interface",
      "API server foundation",
    ],
    commits: 98,
    contributors: 5,
    isLatest: false,
    isPrerelease: true,
  },
  {
    version: "v0.5.0-alpha",
    name: "Alpha Release",
    date: new Date("2023-10-15").toISOString(),
    author: "VIVIM Team",
    description: "First alpha release with basic functionality. For early adopters and testers.",
    highlights: [
      "Basic memory system",
      "Initial project structure",
      "Core API endpoints",
    ],
    commits: 45,
    contributors: 3,
    isLatest: false,
    isPrerelease: true,
  },
]

export default function ReleasesPage() {
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
            className="mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8" />
                <div>
                  <h1 className="text-3xl font-bold">Releases</h1>
                  <p className="text-muted-foreground">Version history and downloads</p>
                </div>
              </div>
              <Button className="gap-2" variant="outline">
                <Github className="h-4 w-4" />
                View on GitHub
              </Button>
            </div>
          </motion.div>

          {/* Latest Release */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-purple-500/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 text-sm font-semibold bg-primary text-primary-foreground rounded-full">
                      Latest
                    </div>
                    <CardTitle className="text-2xl">v1.0.0 - Initial Release</CardTitle>
                  </div>
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(releases[0].date)}
                  </span>
                </div>
                <CardDescription className="text-base mt-2">
                  {releases[0].description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Highlights */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      What's New
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {releases[0].highlights.map((highlight, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {highlight}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-6 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <GitCommit className="h-4 w-4 text-muted-foreground" />
                      <span>{releases[0].commits} commits</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{releases[0].contributors} contributors</span>
                    </div>
                  </div>

                  {/* Download */}
                  <div className="flex flex-wrap gap-3 pt-4">
                    <Button className="gap-2">
                      <Download className="h-4 w-4" />
                      Download Source (zip)
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download Source (tar.gz)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Previous Releases */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-4">Previous Releases</h2>
            <div className="space-y-4">
              {releases.slice(1).map((release, index) => (
                <motion.div
                  key={release.version}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {release.isPrerelease && (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                              Pre-release
                            </span>
                          )}
                          <CardTitle>{release.version}</CardTitle>
                          <span className="text-sm text-muted-foreground">{release.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(release.date)}
                        </span>
                      </div>
                      <CardDescription className="mt-2">
                        {release.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                        {release.highlights.map((highlight, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <GitCommit className="h-4 w-4" />
                            {release.commits} commits
                          </span>
                          <span className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {release.contributors} contributors
                          </span>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          Assets
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Releases Feed Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 text-center"
          >
            <Button variant="link" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              View releases feed on GitHub
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
