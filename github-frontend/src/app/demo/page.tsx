"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Play, 
  Clock, 
  Target, 
  Layers, 
  Zap, 
  ChevronRight,
  CheckCircle2,
  Image
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Journey {
  slug: string
  title: string
  description: string
  duration: string
  target: string
  stepCount: number
  hasScreenshots: boolean
  thumbnailUrl: string | null
}

interface DemoStats {
  journeys: {
    total: number
    captured: number
    pending: number
  }
  screenshots: {
    total: number
  }
}

export default function DemoPage() {
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [stats, setStats] = useState<DemoStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [journeysRes, statusRes] = await Promise.all([
          fetch('/api/demo/journeys'),
          fetch('/api/demo/status')
        ])
        
        const journeysData = await journeysRes.json()
        const statusData = await statusRes.json()
        
        setJourneys(journeysData.journeys || [])
        setStats(statusData)
      } catch (error) {
        console.error('Failed to fetch demo data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const getDurationColor = (duration: string) => {
    const minutes = parseInt(duration)
    if (minutes <= 60) return 'bg-green-500/10 text-green-500'
    if (minutes <= 90) return 'bg-yellow-500/10 text-yellow-500'
    return 'bg-red-500/10 text-red-500'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium mb-8"
            >
              <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              Interactive Demo
            </motion.div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6">
              See VIVIM in{' '}
              <span className="text-primary bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Action
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Explore interactive demo journeys that showcase VIVIM's powerful AI memory, 
              knowledge graph, and context engine capabilities.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="gap-2" asChild>
                  <Link href="/demo/live">
                    <Play className="h-5 w-5" />
                    Run Live Demo
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="outline" className="gap-2" asChild>
                  <a href="#journeys">
                    <Layers className="h-5 w-5" />
                    View Journeys
                  </a>
                </Button>
              </motion.div>
            </div>

            {/* Stats */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
              >
                <div className="flex flex-col items-center p-4 rounded-lg bg-card border">
                  <Zap className="h-6 w-6 text-primary mb-2" />
                  <span className="text-2xl font-bold">{stats.journeys.total}</span>
                  <span className="text-sm text-muted-foreground">Journeys</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-card border">
                  <Image className="h-6 w-6 text-primary mb-2" />
                  <span className="text-2xl font-bold">{stats.screenshots.total}</span>
                  <span className="text-sm text-muted-foreground">Screenshots</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-card border">
                  <CheckCircle2 className="h-6 w-6 text-primary mb-2" />
                  <span className="text-2xl font-bold">{stats.journeys.captured}</span>
                  <span className="text-sm text-muted-foreground">Captured</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-card border">
                  <Clock className="h-6 w-6 text-primary mb-2" />
                  <span className="text-2xl font-bold">45-120s</span>
                  <span className="text-sm text-muted-foreground">Duration</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Journeys Section */}
      <section id="journeys" className="py-20 bg-muted/50">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Demo Journeys
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose a journey that matches your audience and see VIVIM in action
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journeys.map((journey, index) => (
              <motion.div
                key={journey.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link href={`/demo/${journey.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50 group cursor-pointer">
                    <div className="aspect-video relative overflow-hidden rounded-t-lg bg-muted">
                      {journey.thumbnailUrl ? (
                        <img 
                          src={journey.thumbnailUrl} 
                          alt={journey.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Image className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getDurationColor(journey.duration)}`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {journey.duration}
                        </span>
                      </div>
                      {journey.hasScreenshots && (
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Screenshots
                          </span>
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {journey.title}
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </CardTitle>
                      <CardDescription>{journey.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {journey.target || 'All audiences'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Layers className="h-4 w-4" />
                          {journey.stepCount} steps
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Ready for a Live Demo?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Run an interactive demo journey with real-time screenshot capture
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button size="lg" className="gap-2" asChild>
                <Link href="/demo/live">
                  <Play className="h-5 w-5" />
                  Start Interactive Demo
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
