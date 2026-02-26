"use client"

import { motion } from "framer-motion"
import { 
  CircleIssue, 
  Search, 
  Filter,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  Tag,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatNumber, formatDate } from "@/lib/utils"

const issues = [
  {
    id: 1,
    title: "Add dark mode support for PWA",
    status: "open",
    labels: ["enhancement", "ui", "good first issue"],
    comments: 5,
    author: "contributor1",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    milestone: "v1.1.0",
  },
  {
    id: 2,
    title: "Memory leak in P2P network module",
    status: "open",
    labels: ["bug", "priority", "network"],
    comments: 12,
    author: "contributor2",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    milestone: "v1.0.1",
  },
  {
    id: 3,
    title: "Improve documentation for API endpoints",
    status: "open",
    labels: ["documentation", "good first issue"],
    comments: 2,
    author: "contributor3",
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    milestone: null,
  },
  {
    id: 4,
    title: "Add unit tests for server module",
    status: "open",
    labels: ["testing", "enhancement"],
    comments: 8,
    author: "contributor1",
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    milestone: "v1.1.0",
  },
  {
    id: 5,
    title: "Optimize database queries",
    status: "closed",
    labels: ["performance", "backend"],
    comments: 15,
    author: "contributor4",
    createdAt: new Date(Date.now() - 518400000).toISOString(),
    milestone: "v1.0.0",
  },
  {
    id: 6,
    title: "Fix TypeScript errors in admin panel",
    status: "closed",
    labels: ["bug", "typescript"],
    comments: 6,
    author: "contributor2",
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    milestone: "v1.0.0",
  },
]

const labelColors: Record<string, string> = {
  "bug": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "enhancement": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "documentation": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "good first issue": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "priority": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "ui": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "network": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "testing": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  "performance": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  "backend": "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  "typescript": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
}

const openIssues = issues.filter(i => i.status === "open")
const closedIssues = issues.filter(i => i.status === "closed")

export default function IssuesPage() {
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
                <CircleIssue className="h-8 w-8" />
                <div>
                  <h1 className="text-3xl font-bold">Issues</h1>
                  <p className="text-muted-foreground">Track bugs, enhancements, and feature requests</p>
                </div>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Issue
              </Button>
            </div>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 flex flex-col sm:flex-row gap-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2">
              <Tag className="h-4 w-4" />
              Labels
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 flex gap-4"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <span className="font-semibold">{openIssues.length} Open</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{closedIssues.length} Closed</span>
            </div>
          </motion.div>

          {/* Issues List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Open Issues */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-green-600" />
                    Open Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {openIssues.map((issue, index) => (
                        <motion.div
                          key={issue.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ x: 4 }}
                          className="p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <CircleIssue className="h-5 w-5 text-green-600 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">{issue.title}</h3>
                                <span className="text-xs text-muted-foreground">#{issue.id}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {issue.labels.map((label) => (
                                  <span
                                    key={label}
                                    className={`px-2 py-0.5 text-xs rounded-full ${labelColors[label] || "bg-muted text-muted-foreground"}`}
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{issue.comments}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDate(issue.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Avatar className="h-4 w-4">
                                    <AvatarFallback className="text-xs">{issue.author[0].toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span>{issue.author}</span>
                                </div>
                                {issue.milestone && (
                                  <div className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    <span>{issue.milestone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Labels */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Labels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(labelColors).map(([label, color]) => (
                      <span
                        key={label}
                        className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 transition-opacity ${color}`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Milestones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">v1.1.0</span>
                      <span className="text-xs text-muted-foreground">3 issues</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "60%" }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">v1.0.1</span>
                      <span className="text-xs text-muted-foreground">1 issue</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "30%" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
