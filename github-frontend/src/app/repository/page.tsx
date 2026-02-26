"use client"

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { 
  Book, 
  FileText, 
  Folder, 
  ChevronRight, 
  Star, 
  GitFork, 
  Eye,
  Code2,
  Download,
  Clock,
  GitBranch,
  Calendar,
  FolderOpen,
  FileCode,
  FileJson,
  FileMarkdown,
  Globe,
  Sparkles,
  TrendingUp,
  Users,
  Award,
  Activity,
  File
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { formatNumber, formatDate } from "@/lib/utils"
import { useState, useRef } from "react"

const repoStats = {
  stars: 128,
  forks: 34,
  watchers: 56,
  size: "2.4 MB",
  defaultBranch: "main",
  license: "MIT",
  lastCommit: new Date().toISOString(),
  issues: 23,
  pulls: 8,
}

const files = [
  { name: "pwa", type: "folder", description: "React PWA frontend", path: "pwa/" },
  { name: "server", type: "folder", description: "Express.js API server", path: "server/" },
  { name: "network", type: "folder", description: "P2P network engine", path: "network/" },
  { name: "admin-panel", type: "folder", description: "Admin dashboard", path: "admin-panel/" },
  { name: "sdk", type: "folder", description: "Developer SDK", path: "sdk/" },
  { name: "vivim.docs.context", type: "folder", description: "Documentation site", path: "docs/" },
  { name: "package.json", type: "file", language: "json", description: "Project configuration", path: "package.json" },
  { name: "README.md", type: "file", language: "markdown", description: "Project readme", path: "README.md" },
  { name: "tsconfig.json", type: "file", language: "json", description: "TypeScript configuration", path: "tsconfig.json" },
  { name: ".gitignore", type: "file", language: "plaintext", description: "Git ignore rules", path: ".gitignore" },
  { name: "LICENSE", type: "file", language: "plaintext", description: "MIT License", path: "LICENSE" },
]

const recentCommits = [
  { hash: "a3f8d92", message: "feat: Update P2P networking module with CRDT sync", author: "VIVIM Team", date: new Date().toISOString(), avatar: "V" },
  { hash: "b7e2c41", message: "fix: Memory leak in server heap", author: "VIVIM Team", date: new Date(Date.now() - 86400000).toISOString(), avatar: "V" },
  { hash: "c9d4e56", message: "feat: Add new AI agent features", author: "VIVIM Team", date: new Date(Date.now() - 172800000).toISOString(), avatar: "V" },
  { hash: "d1f6g78", message: "docs: Improve documentation", author: "VIVIM Team", date: new Date(Date.now() - 259200000).toISOString(), avatar: "V" },
  { hash: "e2h8i90", message: "chore: Initial commit", author: "VIVIM Team", date: new Date(Date.now() - 345600000).toISOString(), avatar: "V" },
]

const languages = [
  { name: "TypeScript", percentage: 45, color: "#3178c6" },
  { name: "JavaScript", percentage: 30, color: "#f7df1e" },
  { name: "CSS", percentage: 15, color: "#563d7c" },
  { name: "HTML", percentage: 10, color: "#e34c26" },
]

const releases = [
  { version: "v1.0.0", date: new Date().toISOString(), downloads: 1234, notes: "Initial release" },
  { version: "v0.9.0", date: new Date(Date.now() - 604800000).toISOString(), downloads: 856, notes: "Beta release" },
  { version: "v0.8.0", date: new Date(Date.now() - 1209600000).toISOString(), downloads: 432, notes: "Alpha release" },
]

const FileIcon = ({ type, language }: { type: string; language?: string }) => {
  if (type === "folder") {
    return <Folder className="h-5 w-5 text-primary" />
  }
  
  switch (language) {
    case "json":
      return <FileJson className="h-5 w-5 text-yellow-500" />
    case "markdown":
      return <FileMarkdown className="h-5 w-5 text-blue-400" />
    case "typescript":
    case "javascript":
      return <FileCode className="h-5 w-5 text-green-500" />
    default:
      return <File className="h-5 w-5 text-muted-foreground" />
  }
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
        className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"
        animate={{ x: [0, -100, 0], y: [0, 50, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
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

const StatCard = ({ icon: Icon, label, value, delay }: { icon: any; label: string; value: string | number; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.05, y: -5 }}
    className="flex items-center gap-3 p-3 rounded-xl bg-card/50 backdrop-blur-sm border hover:border-primary/50 transition-all cursor-pointer group"
  >
    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </motion.div>
)

const LanguageBar = ({ name, percentage, color, delay }: { name: string; percentage: number; color: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="space-y-2"
  >
    <div className="flex justify-between text-sm">
      <span className="font-medium">{name}</span>
      <span className="text-muted-foreground">{percentage}%</span>
    </div>
    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ delay: delay + 0.3, duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full relative"
        style={{ backgroundColor: color }}
      >
        <motion.div
          className="absolute inset-0 bg-white/30"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  </motion.div>
)

const CommitItem = ({ commit, index }: { commit: typeof recentCommits[0]; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
    className="relative pl-8 pb-6 last:pb-0 group"
  >
    <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 to-transparent group-hover:bg-primary transition-colors" />
    <motion.div
      className="absolute left-1.5 top-1 h-3 w-3 rounded-full bg-primary"
      whileHover={{ scale: 1.5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
    </motion.div>
    
    <div className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {commit.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm text-primary hover:underline cursor-pointer font-mono bg-primary/10 px-1.5 py-0.5 rounded">
              {commit.hash}
            </code>
            <span className="text-sm font-medium truncate">{commit.message}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span>{commit.author}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(commit.date)}
            </span>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
)

const FileItem = ({ file, index }: { file: typeof files[0]; index: number }) => {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ x: 8, scale: 1.01 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 cursor-pointer transition-all group border border-transparent hover:border-primary/20"
    >
      <motion.div
        animate={{ scale: isHovered ? 1.1 : 1 }}
        transition={{ duration: 0.2 }}
        className="shrink-0"
      >
        {file.type === "folder" ? (
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Folder className="h-5 w-5 text-primary" />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <FileIcon type={file.type} language={file.language} />
          </div>
        )}
      </motion.div>
      
      <div className="flex-1 min-w-0">
        <motion.p 
          className="font-semibold truncate flex items-center gap-2"
          animate={{ color: isHovered ? "hsl(var(--primary))" : "inherit" }}
        >
          {file.name}
          {file.type === "folder" && (
            <FolderOpen className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </motion.p>
        <p className="text-sm text-muted-foreground truncate">{file.description}</p>
      </div>
      
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronRight className="h-4 w-4 text-primary" />
      </motion.div>
    </motion.div>
  )
}

export default function RepositoryPage() {
  const [activeTab, setActiveTab] = useState("files")
  
  return (
    <div className="min-h-screen flex flex-col relative">
      <Navigation />
      
      <main className="flex-1 relative">
        <AnimatedBackground />
        
        <div className="container py-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border p-6 sm:p-8 mb-6">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
              
              <div className="relative">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0"
                    >
                      <Globe className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2 text-lg flex-wrap">
                        <span className="font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                          owenservera
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <motion.span 
                          whileHover={{ scale: 1.02 }}
                          className="font-bold text-2xl gradient-text cursor-pointer"
                        >
                          vivim-app
                        </motion.span>
                        <span className="px-2.5 py-1 text-xs font-medium border rounded-full bg-primary/10 text-primary">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                          Public
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Watch
                        <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                          {formatNumber(repoStats.watchers)}
                        </span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <GitFork className="h-4 w-4" />
                        Fork
                        <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                          {formatNumber(repoStats.forks)}
                        </span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                        <Star className="h-4 w-4 fill-current" />
                        Star
                        <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                          {formatNumber(repoStats.stars)}
                        </span>
                      </Button>
                    </motion.div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <StatCard icon={Star} label="Stars" value={formatNumber(repoStats.stars)} delay={0.1} />
                  <StatCard icon={GitFork} label="Forks" value={formatNumber(repoStats.forks)} delay={0.15} />
                  <StatCard icon={Eye} label="Watchers" value={formatNumber(repoStats.watchers)} delay={0.2} />
                  <StatCard icon={Activity} label="Issues" value={repoStats.issues} delay={0.25} />
                  <StatCard icon={GitBranch} label="Branch" value={repoStats.defaultBranch} delay={0.3} />
                  <StatCard icon={Award} label="License" value={repoStats.license} delay={0.35} />
                  <StatCard icon={TrendingUp} label="Size" value={repoStats.size} delay={0.4} />
                </div>
              </div>
            </div>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <TabsList className="bg-card/50 backdrop-blur-sm p-1 h-auto flex flex-wrap gap-1">
                <TabsTrigger value="files" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <Folder className="h-4 w-4" /> Files
                </TabsTrigger>
                <TabsTrigger value="readme" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <FileText className="h-4 w-4" /> README
                </TabsTrigger>
                <TabsTrigger value="commits" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <Clock className="h-4 w-4" /> Commits
                </TabsTrigger>
                <TabsTrigger value="releases" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <Download className="h-4 w-4" /> Releases
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <AnimatePresence mode="wait">
              {activeTab === "files" && (
                <motion.div
                  key="files"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="lg:col-span-2"
                    >
                      <Card className="overflow-hidden border-0 shadow-xl shadow-primary/5">
                        <CardHeader className="pb-3 border-b bg-muted/30">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Folder className="h-5 w-5 text-primary" />
                            Repository Files
                            <span className="text-sm font-normal text-muted-foreground ml-auto">{files.length} items</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <ScrollArea className="h-[500px]">
                            <div className="p-4 space-y-1">
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 pb-3 border-b">
                                <span className="font-medium text-foreground">root</span>
                              </motion.div>
                              {files.map((file, index) => (
                                <FileItem key={file.name} file={file} index={index} />
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className="space-y-6"
                    >
                      <Card className="overflow-hidden border-0 shadow-lg shadow-primary/5">
                        <CardHeader className="pb-3 border-b bg-gradient-to-r from-primary/10 to-transparent">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" /> About
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                          <p className="text-sm text-muted-foreground">Your Personal AI Memory Platform. Own, share, and evolve your AI systems with cutting-edge P2P technology.</p>
                          <div className="flex flex-wrap gap-2">
                            {["ai", "memory", "p2p", "react", "typescript", "crdt", "blockchain"].map((tag) => (
                              <motion.span key={tag} whileHover={{ scale: 1.05 }} className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full cursor-pointer hover:bg-primary/20 transition-colors">
                                {tag}
                              </motion.span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="overflow-hidden border-0 shadow-lg shadow-primary/5">
                        <CardHeader className="pb-3 border-b bg-gradient-to-r from-purple-500/10 to-transparent">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Code2 className="h-5 w-5 text-purple-500" /> Languages
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex-1 h-3 rounded-full overflow-hidden flex">
                              {languages.map((lang, i) => (
                                <motion.div
                                  key={lang.name}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${lang.percentage}%` }}
                                  transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
                                  style={{ backgroundColor: lang.color }}
                                  className="first:rounded-l-full last:rounded-r-full"
                                />
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            {languages.map((lang, index) => (
                              <LanguageBar key={lang.name} name={lang.name} percentage={lang.percentage} color={lang.color} delay={0.6 + index * 0.1} />
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="overflow-hidden border-0 shadow-lg shadow-primary/5">
                        <CardHeader className="pb-3 border-b bg-gradient-to-r from-green-500/10 to-transparent">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Download className="h-5 w-5 text-green-500" /> Latest Release
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-4">
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-green-500">v1.0.0</span>
                              <span className="text-xs text-muted-foreground">Latest</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">Initial release</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" /> {formatDate(releases[0].date)}
                            </div>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeTab === "readme" && (
                <motion.div key="readme" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                  <Card className="overflow-hidden border-0 shadow-xl shadow-primary/5">
                    <CardHeader className="pb-3 border-b bg-muted/30">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileMarkdown className="h-5 w-5 text-blue-500" /> README.md
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">VIVIM</h1>
                        <p className="text-xl text-muted-foreground mb-6">Your Personal AI Memory Platform — Own, Share, Evolve Your AI</p>
                        <h2 className="text-2xl font-bold mt-8 mb-4">Mission</h2>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2"><span className="text-primary">▸</span><span><strong className="text-primary">Own Your AI</strong> – Users maintain full control over their AI systems and data</span></li>
                          <li className="flex items-start gap-2"><span className="text-primary">▸</span><span><strong className="text-primary">Share Your AI</strong> – Enables secure sharing of AI configurations and knowledge</span></li>
                          <li className="flex items-start gap-2"><span className="text-primary">▸</span><span><strong className="text-primary">Evolve Your AI</strong> – Supports continuous improvement and adaptation</span></li>
                        </ul>
                        <h2 className="text-2xl font-bold mt-8 mb-4">Project Structure</h2>
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto"><code className="text-sm">{`vivim-app/
├── pwa/              # React PWA frontend
├── server/           # Express.js API server
├── network/          # P2P network engine
├── admin-panel/      # Admin dashboard
├── sdk/              # Developer SDK
└── docs/            # Documentation site`}</code></pre>
                        <h2 className="text-2xl font-bold mt-8 mb-4">Technology Stack</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                          {["React 19", "TypeScript", "Tailwind CSS", "Framer Motion", "Bun", "LibP2P", "Yjs CRDT", "PostgreSQL", "Redis"].map((tech) => (
                            <motion.div key={tech} whileHover={{ scale: 1.02 }} className="p-3 rounded-lg bg-muted/50 border hover:border-primary/50 transition-colors">{tech}</motion.div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === "commits" && (
                <motion.div key="commits" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                  <Card className="overflow-hidden border-0 shadow-xl shadow-primary/5">
                    <CardHeader className="pb-3 border-b bg-muted/30">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Recent Commits
                        <span className="text-sm font-normal text-muted-foreground ml-auto">{recentCommits.length} commits</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <ScrollArea className="h-[400px] pr-4">
                        {recentCommits.map((commit, index) => (
                          <CommitItem key={commit.hash} commit={commit} index={index} />
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === "releases" && (
                <motion.div key="releases" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                  <Card className="overflow-hidden border-0 shadow-xl shadow-primary/5">
                    <CardHeader className="pb-3 border-b bg-muted/30">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Download className="h-5 w-5 text-green-500" /> Releases
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      {releases.map((release, index) => (
                        <motion.div
                          key={release.version}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 rounded-xl border ${index === 0 ? "bg-gradient-to-r from-green-500/10 to-transparent border-green-500/20" : "bg-muted/30"}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className={`font-bold text-lg ${index === 0 ? "text-green-500" : ""}`}>{release.version}</span>
                              {index === 0 && <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-500 rounded-full">Latest</span>}
                            </div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button size="sm" variant="outline" className="gap-2">
                                <Download className="h-4 w-4" /> Download
                              </Button>
                            </motion.div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{release.notes}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(release.date)}</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {release.downloads} downloads</span>
                          </div>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
