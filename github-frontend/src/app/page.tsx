"use client"

import { motion } from "framer-motion"
import { 
  Github, 
  Star, 
  GitFork, 
  Eye, 
  Zap, 
  Shield, 
  Share2, 
  Cpu, 
  Network,
  ArrowRight,
  Code2,
  Users,
  Rocket
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

const stats = {
  stars: 128,
  forks: 34,
  watchers: 56,
  contributors: 12,
}

const features = [
  {
    icon: Cpu,
    title: "AI Memory Core",
    description: "Advanced AI memory system that learns and evolves with your usage patterns.",
  },
  {
    icon: Network,
    title: "P2P Networking",
    description: "Decentralized peer-to-peer communication for enhanced privacy and performance.",
  },
  {
    icon: Shield,
    title: "Own Your Data",
    description: "Full control over your AI systems and data. No third-party dependencies.",
  },
  {
    icon: Share2,
    title: "Share & Collaborate",
    description: "Easily share your AI configurations and collaborate with the community.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built with performance in mind using modern technologies like Bun and Next.js.",
  },
  {
    icon: Code2,
    title: "Open Source",
    description: "Fully open-source under MIT license. Contribute and customize as you wish.",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-32">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          
          <div className="container relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mx-auto max-w-4xl text-center"
            >
              {/* Badge */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium mb-8"
              >
                <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                Now Open Source on GitHub
              </motion.div>

              {/* Title */}
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6">
                Your Personal{" "}
                <span className="text-primary bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  AI Memory
                </span>{" "}
                Platform
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Own Your AI, Share Your AI, Evolve Your AI. A full-stack application with React PWA frontend, 
                Express.js API server, and P2P networking capabilities.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="gap-2" asChild>
                    <a href="https://github.com/owenservera/vivim-app" target="_blank" rel="noopener noreferrer">
                      <Github className="h-5 w-5" />
                      View on GitHub
                      <ArrowRight className="h-5 w-5" />
                    </a>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" variant="outline" className="gap-2" asChild>
                    <a href="/repository">
                      <Code2 className="h-5 w-5" />
                      Explore Repository
                    </a>
                  </Button>
                </motion.div>
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
              >
                {[
                  { label: "Stars", value: stats.stars, icon: Star },
                  { label: "Forks", value: stats.forks, icon: GitFork },
                  { label: "Watchers", value: stats.watchers, icon: Eye },
                  { label: "Contributors", value: stats.contributors, icon: Users },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    whileHover={{ scale: 1.05 }}
                    className="flex flex-col items-center p-4 rounded-lg bg-card border"
                  >
                    <stat.icon className="h-6 w-6 text-primary mb-2" />
                    <span className="text-2xl font-bold">{stat.value}</span>
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/50">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Powerful Features
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Built with modern technologies and designed for scalability, privacy, and performance.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {features.map((feature, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="py-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Built with Modern Tech
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Leveraging the latest and greatest tools for optimal performance and developer experience.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
            >
              {[
                { name: "Next.js 15", description: "React Framework" },
                { name: "TypeScript", description: "Type Safety" },
                { name: "Tailwind CSS", description: "Styling" },
                { name: "Framer Motion", description: "Animations" },
                { name: "Bun", description: "Runtime" },
                { name: "Express.js", description: "API Server" },
              ].map((tech, index) => (
                <motion.div
                  key={tech.name}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="flex flex-col items-center p-6 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                >
                  <span className="font-semibold text-center">{tech.name}</span>
                  <span className="text-sm text-muted-foreground text-center">{tech.description}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
                Join the VIVIM community and start building your personal AI memory platform today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" variant="secondary" className="gap-2" asChild>
                    <a href="https://github.com/owenservera/vivim-app" target="_blank" rel="noopener noreferrer">
                      <Github className="h-5 w-5" />
                      Star on GitHub
                    </a>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" variant="outline" className="gap-2 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                    <a href="/docs">
                      <Rocket className="h-5 w-5" />
                      View Documentation
                    </a>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
