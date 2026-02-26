"use client"

import { motion } from "framer-motion"
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
  GitBranch
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { formatNumber, formatDate } from "@/lib/utils"

const repoStats = {
  stars: 128,
  forks: 34,
  watchers: 56,
  size: "2.4 MB",
  defaultBranch: "main",
  license: "MIT",
  lastCommit: new Date().toISOString(),
}

const files = [
  { name: "pwa", type: "folder", description: "React PWA frontend" },
  { name: "server", type: "folder", description: "Express.js API server" },
  { name: "network", type: "folder", description: "P2P network engine" },
  { name: "admin-panel", type: "folder", description: "Admin dashboard" },
  { name: "vivim.docs.context", type: "folder", description: "Documentation site" },
  { name: "package.json", type: "file", language: "json", description: "Project configuration" },
  { name: "README.md", type: "file", language: "markdown", description: "Project readme" },
  { name: "tsconfig.json", type: "file", language: "json", description: "TypeScript configuration" },
  { name: ".gitignore", type: "file", language: "plaintext", description: "Git ignore rules" },
  { name: "bun.lock", type: "file", language: "plaintext", description: "Bun lockfile" },
]

const recentCommits = [
  { hash: "a3f8d92", message: "Update P2P networking module", author: "VIVIM Team", date: new Date().toISOString() },
  { hash: "b7e2c41", message: "Fix memory leak in server", author: "VIVIM Team", date: new Date(Date.now() - 86400000).toISOString() },
  { hash: "c9d4e56", message: "Add new AI agent features", author: "VIVIM Team", date: new Date(Date.now() - 172800000).toISOString() },
  { hash: "d1f6g78", message: "Improve documentation", author: "VIVIM Team", date: new Date(Date.now() - 259200000).toISOString() },
  { hash: "e2h8i90", message: "Initial commit", author: "VIVIM Team", date: new Date(Date.now() - 345600000).toISOString() },
]

const languages = [
  { name: "TypeScript", percentage: 45, color: "#3178c6" },
  { name: "JavaScript", percentage: 30, color: "#f7df1e" },
  { name: "CSS", percentage: 15, color: "#563d7c" },
  { name: "HTML", percentage: 10, color: "#e34c26" },
]

export default function RepositoryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <div className="container py-6">
          {/* Repo Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 text-lg">
                <Book className="h-5 w-5" />
                <span className="font-semibold">owenservera</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                <span className="font-bold text-xl">vivim-app</span>
                <span className="px-2 py-0.5 text-xs font-medium border rounded-full">Public</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download ZIP
                </Button>
                <Button size="sm" className="gap-2">
                  <Star className="h-4 w-4" />
                  Star
                  <span className="text-xs bg-primary-foreground/20 px-1.5 py-0.5 rounded-full">
                    {formatNumber(repoStats.stars)}
                  </span>
                </Button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span className="font-semibold">{formatNumber(repoStats.stars)}</span>
                <span className="text-muted-foreground">stars</span>
              </div>
              <div className="flex items-center gap-1">
                <GitFork className="h-4 w-4" />
                <span className="font-semibold">{formatNumber(repoStats.forks)}</span>
                <span className="text-muted-foreground">forks</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span className="font-semibold">{formatNumber(repoStats.watchers)}</span>
                <span className="text-muted-foreground">watchers</span>
              </div>
              <div className="flex items-center gap-1">
                <Code2 className="h-4 w-4" />
                <span>{repoStats.size}</span>
              </div>
              <div className="flex items-center gap-1">
                <GitBranch className="h-4 w-4" />
                <span>{repoStats.defaultBranch}</span>
              </div>
              <div className="flex items-center gap-1">
                <Book className="h-4 w-4" />
                <span>{repoStats.license}</span>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <Tabs defaultValue="files" className="space-y-4">
            <TabsList>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="readme">README</TabsTrigger>
              <TabsTrigger value="commits">Commits</TabsTrigger>
            </TabsList>

            <TabsContent value="files">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* File Browser */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="lg:col-span-2"
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Repository Files</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[600px]">
                        <div className="space-y-1">
                          {files.map((file, index) => (
                            <motion.div
                              key={file.name}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ x: 4 }}
                              className="flex items-center gap-3 p-3 rounded-md hover:bg-muted cursor-pointer transition-colors"
                            >
                              {file.type === "folder" ? (
                                <Folder className="h-5 w-5 text-primary" />
                              ) : (
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{file.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{file.description}</p>
                              </div>
                              {file.language && (
                                <span className="text-xs text-muted-foreground">{file.language}</span>
                              )}
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
                  {/* About */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">About</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Your Personal AI Memory Platform. Own, share, and evolve your AI systems.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                          ai
                        </span>
                        <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                          memory
                        </span>
                        <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                          p2p
                        </span>
                        <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                          react
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Languages */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Languages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {languages.map((lang) => (
                          <div key={lang.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{lang.name}</span>
                              <span className="text-muted-foreground">{lang.percentage}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${lang.percentage}%` }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: lang.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Releases */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Releases</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded">
                              v1.0.0
                            </span>
                            <span className="text-sm text-muted-foreground">Latest</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(new Date())}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            <TabsContent value="readme">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>README.md</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="markdown-body prose dark:prose-invert max-w-none">
                      <h1>VIVIM</h1>
                      <p>Your Personal AI Memory Platform</p>
                      
                      <h2>Mission</h2>
                      <ul>
                        <li><strong>Own Your AI</strong> – Users maintain control over their AI systems</li>
                        <li><strong>Share Your AI</strong> – Enables sharing of AI configurations/knowledge</li>
                        <li><strong>Evolve Your AI</strong> – Supports continuous improvement and adaptation</li>
                      </ul>

                      <h2>Project Structure</h2>
                      <pre><code>vivim-app/
├── pwa/              # React PWA frontend
├── server/           # Express.js API server
├── network/          # P2P network engine
├── admin-panel/      # Admin dashboard
└── vivim.docs.context/  # Documentation site</code></pre>

                      <h2>Development</h2>
                      <p>See individual package READMEs for development instructions.</p>

                      <h2>Documentation</h2>
                      <p>Documentation is located in <code>vivim.docs.context/</code></p>
                      <pre><code>cd vivim.docs.context
npm run build
npm run start</code></pre>

                      <h2>License</h2>
                      <p>MIT License - See LICENSE file for details</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="commits">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Commits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {recentCommits.map((commit, index) => (
                          <motion.div
                            key={commit.hash}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-start gap-3 p-3 rounded-md hover:bg-muted transition-colors"
                          >
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Code2 className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-primary hover:underline cursor-pointer">
                                  {commit.hash}
                                </span>
                                <span className="text-sm font-medium truncate">{commit.message}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{commit.author}</span>
                                <span>•</span>
                                <span>{formatDate(commit.date)}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
