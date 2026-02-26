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
  Calendar,
  Heart,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatNumber } from "@/lib/utils"

const contributors = [
  {
    username: "owenservera",
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
        className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-green-500/10 blur-3xl"
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

const roleColors: Record<string, string> = {
  "Maintainer": "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  "Core Contributor": "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
  "Contributor": "bg-muted text-muted-foreground",
}

export default function ContributorsPage() {
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
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-500/20 via-transparent to-transparent" />
              
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
                    >
                      <Users className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <h1 className="text-3xl font-bold">Contributors</h1>
                      <p className="text-muted-foreground">Meet the amazing people behind VIVIM</p>
                    </div>
                  </div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-500/90 hover:to-emerald-600/90">
                      <Github className="h-4 w-4" />
                      View on GitHub
                    </Button>
                  </motion.div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  {[
                    { icon: Code2, label: "Contributions", value: totalContributions, color: "from-blue-500 to-cyan-500" },
                    { icon: GitCommit, label: "Commits", value: contributors.reduce((sum, c) => sum + c.commits, 0), color: "from-green-500 to-emerald-500" },
                    { icon: Star, label: "Pull Requests", value: contributors.reduce((sum, c) => sum + c.prs, 0), color: "from-purple-500 to-pink-500" },
                    { icon: Users, label: "Contributors", value: contributors.length, color: "from-orange-500 to-red-500" },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <stat.icon className={`h-4 w-4 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                        <span className="text-sm text-muted-foreground">{stat.label}</span>
                      </div>
                      <p className="text-2xl font-bold">{formatNumber(stat.value)}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contribution Graph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <Card className="overflow-hidden border-0 shadow-xl shadow-primary/5">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  Contribution Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="flex gap-1 min-w-max">
                    <div className="flex flex-col gap-1 mr-2">
                      {["Mon", "", "Wed", "", "Fri", "", ""].map((day, i) => (
                        <div key={i} className="h-3 text-xs text-muted-foreground flex items-center justify-end w-8">
                          {day}
                        </div>
                      ))}
                    </div>
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
                                transition={{ delay: (rowIndex * 52 + colIndex) * 0.003 }}
                                whileHover={{ scale: 1.3 }}
                                className={`h-3 w-3 rounded-sm ${levelColors[day.level]} cursor-pointer`}
                                title={`${day.contributions} contributions`}
                              />
                            ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mt-4">
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
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="overflow-hidden border-0 shadow-xl shadow-primary/5">
              <CardHeader className="pb-3 border-b bg-gradient-to-r from-green-500/10 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-500" />
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
                      transition={{ delay: 0.3 + index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="p-4 rounded-xl border hover:bg-green-500/5 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="text-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                              {contributor.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {index < 3 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.5 + index * 0.1 }}
                              className={`absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? "bg-yellow-500 text-white" : index === 1 ? "bg-gray-400 text-white" : "bg-orange-600 text-white"
                              }`}
                            >
                              {index + 1}
                            </motion.div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold group-hover:text-green-500 transition-colors">{contributor.name}</h3>
                              <p className="text-sm text-muted-foreground">@{contributor.username}</p>
                            </div>
                            <span className={`px-2.5 py-1 text-xs rounded-full ${roleColors[contributor.role]}`}>
                              {contributor.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <div className="flex items-center gap-1">
                              <GitCommit className="h-4 w-4 text-green-500" />
                              <span>{contributor.commits}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-blue-500" />
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
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-primary/10 to-purple-500/10" />
              <CardContent className="py-8 relative">
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mx-auto"
                  >
                    <Heart className="h-8 w-8 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold">Want to Contribute?</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    We welcome contributions from everyone! Check out our contributing guidelines and join our amazing community.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600">
                        <Sparkles className="h-4 w-4" />
                        View Contributing Guide
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="outline" className="gap-2">
                        <Code2 className="h-4 w-4" />
                        Browse Good First Issues
                      </Button>
                    </motion.div>
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
