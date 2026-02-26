"use client"

import { motion } from "framer-motion"
import { 
  GitPullRequest, 
  Search, 
  Filter,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  GitMerge,
  Plus,
  GitBranch
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatNumber, formatDate } from "@/lib/utils"

const pullRequests = [
  {
    id: 1,
    title: "Add dark mode support for PWA",
    status: "open",
    mergeable: true,
    checks: "success",
    comments: 8,
    author: "contributor1",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    branch: "feature/dark-mode",
    target: "main",
    commits: 3,
  },
  {
    id: 2,
    title: "Fix memory leak in P2P network module",
    status: "open",
    mergeable: true,
    checks: "pending",
    comments: 15,
    author: "contributor2",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    branch: "fix/memory-leak",
    target: "main",
    commits: 5,
  },
  {
    id: 3,
    title: "Update documentation for API endpoints",
    status: "open",
    mergeable: true,
    checks: "success",
    comments: 3,
    author: "contributor3",
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    branch: "docs/api-update",
    target: "main",
    commits: 1,
  },
  {
    id: 4,
    title: "Add comprehensive unit tests",
    status: "merged",
    mergeable: true,
    checks: "success",
    comments: 22,
    author: "contributor4",
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    branch: "test/unit-tests",
    target: "main",
    commits: 8,
  },
  {
    id: 5,
    title: "Refactor authentication flow",
    status: "merged",
    mergeable: true,
    checks: "success",
    comments: 18,
    author: "contributor1",
    createdAt: new Date(Date.now() - 518400000).toISOString(),
    branch: "refactor/auth",
    target: "main",
    commits: 12,
  },
  {
    id: 6,
    title: "Fix TypeScript configuration",
    status: "closed",
    mergeable: false,
    checks: "failed",
    comments: 5,
    author: "contributor2",
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    branch: "fix/ts-config",
    target: "main",
    commits: 2,
  },
]

const openPRs = pullRequests.filter(pr => pr.status === "open")
const mergedPRs = pullRequests.filter(pr => pr.status === "merged")
const closedPRs = pullRequests.filter(pr => pr.status === "closed")

export default function PullRequestsPage() {
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
                <GitPullRequest className="h-8 w-8" />
                <div>
                  <h1 className="text-3xl font-bold">Pull Requests</h1>
                  <p className="text-muted-foreground">Review and merge code changes</p>
                </div>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Pull Request
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
                placeholder="Search pull requests..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 flex gap-6"
          >
            <div className="flex items-center gap-2">
              <GitPullRequest className="h-4 w-4 text-green-600" />
              <span className="font-semibold">{openPRs.length} Open</span>
            </div>
            <div className="flex items-center gap-2">
              <GitMerge className="h-4 w-4 text-purple-600" />
              <span className="font-semibold">{mergedPRs.length} Merged</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{closedPRs.length} Closed</span>
            </div>
          </motion.div>

          {/* PRs List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pull Requests */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitPullRequest className="h-5 w-5" />
                    All Pull Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {pullRequests.map((pr, index) => (
                        <motion.div
                          key={pr.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ x: 4 }}
                          className="p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {pr.status === "merged" ? (
                              <GitMerge className="h-5 w-5 text-purple-600" />
                            ) : pr.status === "closed" ? (
                              <XCircle className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <GitPullRequest className="h-5 w-5 text-green-600" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">{pr.title}</h3>
                                <span className="text-xs text-muted-foreground">#{pr.id}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <GitBranch className="h-3 w-3" />
                                <span className="font-mono">{pr.branch}</span>
                                <span>→</span>
                                <span className="font-mono">{pr.target}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{pr.comments}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDate(pr.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <GitBranch className="h-3 w-3" />
                                  <span>{pr.commits} commits</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Avatar className="h-4 w-4">
                                    <AvatarFallback className="text-xs">{pr.author[0].toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span>{pr.author}</span>
                                </div>
                              </div>
                              {/* Status indicators */}
                              <div className="flex items-center gap-2 mt-3">
                                {pr.checks === "success" && (
                                  <span className="flex items-center gap-1 text-xs text-green-600">
                                    <CheckCircle2 className="h-3 w-3" />
                                    All checks passed
                                  </span>
                                )}
                                {pr.checks === "pending" && (
                                  <span className="flex items-center gap-1 text-xs text-yellow-600">
                                    <Clock className="h-3 w-3" />
                                    Checks pending
                                  </span>
                                )}
                                {pr.checks === "failed" && (
                                  <span className="flex items-center gap-1 text-xs text-red-600">
                                    <XCircle className="h-3 w-3" />
                                    Checks failed
                                  </span>
                                )}
                                {pr.mergeable && pr.status === "open" && (
                                  <span className="text-xs text-green-600">
                                    ✓ Mergeable
                                  </span>
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
              {/* Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-600" />
                    <div className="flex-1">
                      <p className="text-sm">3 PRs merged this week</p>
                      <p className="text-xs text-muted-foreground">Great progress!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm">5 PRs awaiting review</p>
                      <p className="text-xs text-muted-foreground">Needs attention</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reviewers */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Reviewers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {["contributor1", "contributor2", "contributor3"].map((reviewer, i) => (
                    <div key={reviewer} className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{reviewer[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{reviewer}</p>
                        <p className="text-xs text-muted-foreground">{10 - i * 2} reviews</p>
                      </div>
                    </div>
                  ))}
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
