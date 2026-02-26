"use client"

import { motion } from "framer-motion"
import { 
  Users, 
  Github, 
  Award, 
  TrendingUp,
  Code2,
  GitCommit,
  Star,
  Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatNumber } from "@/lib/utils"

const contributors = [
  {
    username: "contributor1",
    name: "Alex Johnson",
    avatar: "",
    contributions: 245,
    commits: 156,
    prs: 42,
    issues: 28,
    role: "Maintainer",
    joinDate: "2024-01-15",
  },
  {
    username: "contributor2",
    name: "Sarah Chen",
    avatar: "",
    contributions: 189,
    commits: 112,
    prs: 35,
    issues: 18,
    role: "Core Contributor",
    joinDate: "2024-02-20",
  },
  {
    username: "contributor3",
    name: "Mike Rodriguez",
    avatar: "",
    contributions: 134,
    commits: 78,
    prs: 24,
    issues: 15,
    role: "Contributor",
    joinDate: "2024-03-10",
  },
  {
    username: "contributor4",
    name: "Emily Davis",
    avatar: "",
    contributions: 98,
    commits: 56,
    prs: 18,
    issues: 12,
    role: "Contributor",
    joinDate: "2024-04-05",
  },
  {
    username: "contributor5",
    name: "David Kim",
    avatar: "",
    contributions: 76,
    commits: 45,
    prs: 14,
    issues: 8,
    role: "Contributor",
    joinDate: "2024-05-12",
  },
  {
    username: "contributor6",
    name: "Lisa Wang",
    avatar: "",
    contributions: 54,
    commits: 32,
    prs: 10,
    issues: 6,
    role: "Contributor",
    joinDate: "2024-06-18",
  },
]

// Generate contribution data for the graph (52 weeks)
const generateContributionData = () => {
  const data = []
  const today = new Date()
  for (let i = 51; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - (i * 7))
    const contributions = Math.floor(Math.random() * 30)
    let level = 0
    if (contributions > 0) level = 1
    if (contributions > 5) level = 2
    if (contributions > 10) level = 3
    if (contributions > 20) level = 4
    data.push({ date, contributions, level })
  }
  return data
}

const contributionData = generateContributionData()
const totalContributions = contributionData.reduce((sum, d) => sum + d.contributions, 0)

const levelColors = [
  "bg-muted",
  "bg-green-200 dark:bg-green-900/40",
  "bg-green-400 dark:bg-green-700/60",
  "bg-green-600 dark:bg-green-500/80",
  "bg-green-800 dark:bg-green-400",
]

export default function ContributorsPage() {
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
                <Users className="h-8 w-8" />
                <div>
                  <h1 className="text-3xl font-bold">Contributors</h1>
                  <p className="text-muted-foreground">Meet the amazing people behind VIVIM</p>
                </div>
              </div>
              <Button className="gap-2" variant="outline">
                <Github className="h-4 w-4" />
                View on GitHub
              </Button>
            </div>
          </motion.div>

          {/* Contribution Graph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Contribution Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Code2 className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{formatNumber(totalContributions)}</p>
                        <p className="text-xs text-muted-foreground">Contributions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <GitCommit className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{formatNumber(contributors.reduce((sum, c) => sum + c.commits, 0))}</p>
                        <p className="text-xs text-muted-foreground">Commits</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <GitCommit className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{formatNumber(contributors.reduce((sum, c) => sum + c.prs, 0))}</p>
                        <p className="text-xs text-muted-foreground">Pull Requests</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Star className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{contributors.length}</p>
                        <p className="text-xs text-muted-foreground">Contributors</p>
                      </div>
                    </div>
                  </div>

                  {/* Contribution Graph */}
                  <div className="overflow-x-auto">
                    <div className="flex gap-1 min-w-max">
                      {/* Month labels */}
                      <div className="flex gap-1 mb-2">
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, i) => (
                          <div key={month} className="w-3 text-xs text-muted-foreground">
                            {i % 2 === 0 ? month : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {/* Day labels */}
                      <div className="flex flex-col gap-1 mr-2">
                        {["Mon", "", "Wed", "", "Fri", ""].map((day) => (
                          <div key={day} className="h-3 w-3 text-xs text-muted-foreground flex items-center justify-center">
                            {day}
                          </div>
                        ))}
                      </div>
                      {/* Contribution squares */}
                      <div className="grid grid-rows-7 gap-1">
                        {Array.from({ length: 7 }).map((_, rowIndex) => (
                          <div key={rowIndex} className="grid grid-cols-52 gap-1">
                            {contributionData
                              .filter((_, i) => i % 7 === rowIndex)
                              .map((day, colIndex) => (
                                <motion.div
                                  key={`${rowIndex}-${colIndex}`}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: (rowIndex * 52 + colIndex) * 0.005 }}
                                  whileHover={{ scale: 1.2 }}
                                  className={`h-3 w-3 rounded-sm ${levelColors[day.level]} cursor-pointer`}
                                  title={`${day.contributions} contributions on ${day.date.toLocaleDateString()}`}
                                />
                              ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                    <span>Less</span>
                    {levelColors.map((color, i) => (
                      <div key={i} className={`h-3 w-3 rounded-sm ${color}`} />
                    ))}
                    <span>More</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contributors Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contributors.map((contributor, index) => (
                    <motion.div
                      key={contributor.username}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                            {contributor.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{contributor.name}</h3>
                              <p className="text-sm text-muted-foreground">@{contributor.username}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              contributor.role === "Maintainer" 
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                : contributor.role === "Core Contributor"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {contributor.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <div className="flex items-center gap-1">
                              <GitCommit className="h-4 w-4 text-muted-foreground" />
                              <span>{contributor.commits}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span>{contributor.contributions}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Join Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10">
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-bold">Want to Contribute?</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    We welcome contributions from everyone! Check out our contributing guidelines and join our amazing community.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button className="gap-2">
                      <Github className="h-4 w-4" />
                      View Contributing Guide
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Code2 className="h-4 w-4" />
                      Browse Good First Issues
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
