"use client"

import { motion, AnimatePresence } from "framer-motion"
import { 
  CircleIssue, 
  Search, 
  Filter,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  Tag,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatNumber, formatDate } from "@/lib/utils"
import { useState } from "react"

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

const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 animate-mesh-gradient" />
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl"
        animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-red-500/10 blur-3xl"
        animate={{ x: [0, -100, 0], y: [0, 50, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  )
}

const openIssues = issues.filter(i => i.status === "open")
const closedIssues = issues.filter(i => i.status === "closed")

export default function IssuesPage() {
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open")

  return (
    <div className="min-h-screen flex flex-col relative">
      <Navigation />
      
      <main className="flex-1 relative">
        <AnimatedBackground />
        
        <div className="container py-8 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border p-6 sm:p-8 mb-6">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-500/20 via-transparent to-transparent" />
              
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center"
                    >
                      <CircleIssue className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <h1 className="text-3xl font-bold">Issues</h1>
                      <p className="text-muted-foreground">Track bugs, enhancements, and feature requests</p>
                    </div>
                  </div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="gap-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-500/90 hover:to-orange-600/90">
                      <Plus className="h-4 w-4" />
                      New Issue
                    </Button>
                  </motion.div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Open</span>
                    </div>
                    <p className="text-2xl font-bold">{openIssues.length}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Closed</span>
                    </div>
                    <p className="text-2xl font-bold">{closedIssues.length}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Total</span>
                    </div>
                    <p className="text-2xl font-bold">{issues.length}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-muted-foreground">Priority</span>
                    </div>
                    <p className="text-2xl font-bold">1</p>
                  </motion.div>
                </div>
              </div>
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
                className="pl-10 bg-card/50 backdrop-blur-sm"
              />
            </div>
            <Button variant="outline" className="gap-2 bg-card/50 backdrop-blur-sm">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2 bg-card/50 backdrop-blur-sm">
              <Tag className="h-4 w-4" />
              Labels
            </Button>
          </motion.div>

          {/* Issues List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2"
            >
              <Card className="overflow-hidden border-0 shadow-xl shadow-primary/5">
                <CardHeader className="pb-3 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("open")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${activeTab === "open" ? "bg-green-500/10 text-green-500" : "hover:bg-muted"}`}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Open</span>
                      <span className="text-xs bg-green-500/20 px-1.5 py-0.5 rounded-full">{openIssues.length}</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("closed")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${activeTab === "closed" ? "bg-purple-500/10 text-purple-500" : "hover:bg-muted"}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-medium">Closed</span>
                      <span className="text-xs bg-purple-500/20 px-1.5 py-0.5 rounded-full">{closedIssues.length}</span>
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    <div className="p-4 space-y-3">
                      <AnimatePresence mode="wait">
                        {(activeTab === "open" ? openIssues : closedIssues).map((issue, index) => (
                          <motion.div
                            key={issue.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ x: 4, scale: 1.01 }}
                            className="p-4 rounded-xl border hover:bg-primary/5 cursor-pointer transition-all group"
                          >
                            <div className="flex items-start gap-3">
                              {issue.status === "open" ? (
                                <AlertCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                              ) : (
                                <CheckCircle2 className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{issue.title}</h3>
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
                      </AnimatePresence>
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
              <Card className="overflow-hidden border-0 shadow-lg shadow-primary/5">
                <CardHeader className="pb-3 border-b bg-gradient-to-r from-red-500/10 to-transparent">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5 text-red-500" /> Labels
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(labelColors).map(([label, color]) => (
                      <motion.span
                        key={label}
                        whileHover={{ scale: 1.05 }}
                        className={`px-2.5 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 transition-all ${color}`}
                      >
                        {label}
                      </motion.span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg shadow-primary/5">
                <CardHeader className="pb-3 border-b bg-gradient-to-r from-purple-500/10 to-transparent">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" /> Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {[
                    { name: "v1.1.0", issues: 3, progress: 60, color: "from-blue-500 to-purple-500" },
                    { name: "v1.0.1", issues: 1, progress: 30, color: "from-orange-500 to-red-500" },
                    { name: "v1.0.0", issues: 2, progress: 100, color: "from-green-500 to-emerald-500" },
                  ].map((milestone, index) => (
                    <motion.div
                      key={milestone.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{milestone.name}</span>
                        <span className="text-xs text-muted-foreground">{milestone.issues} issues</span>
                      </div>
                      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${milestone.progress}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                          className={`h-full rounded-full bg-gradient-to-r ${milestone.color}`}
                        />
                      </div>
                    </motion.div>
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
