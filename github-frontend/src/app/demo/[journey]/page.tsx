"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Target,
  Layers,
  CheckCircle2,
  Play,
  Download,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface JourneyStep {
  step: number;
  action: string;
  url: string;
  wait: number;
  screenshot: boolean;
  notes: string;
}

interface Screenshot {
  id: string;
  journeySlug: string;
  stepNumber: number;
  filename: string;
  url: string;
}

interface Journey {
  slug: string;
  title: string;
  description: string;
  duration: string;
  target: string;
  preConditions: string[];
  steps: JourneyStep[];
  screenshots: Screenshot[];
}

export default function JourneyPage() {
  const params = useParams();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<number | null>(
    null,
  );

  useEffect(() => {
    async function fetchJourney() {
      if (!params.journey) return;

      try {
        const res = await fetch(`/api/demo/journeys/${params.journey}`);

        if (!res.ok) {
          throw new Error("Journey not found");
        }

        const data = await res.json();
        setJourney(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load journey");
      } finally {
        setLoading(false);
      }
    }

    fetchJourney();
  }, [params.journey]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Journey Not Found</h1>
        <p className="text-muted-foreground">
          {error || "The requested journey could not be found"}
        </p>
        <Button asChild>
          <Link href="/demo">Back to Demos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/demo"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Demos
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                {journey.title}
              </h1>
              <p className="text-muted-foreground">{journey.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <Clock className="h-4 w-4 mr-1" />
                {journey.duration}
              </span>
              <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-medium">
                <Target className="h-4 w-4 mr-1" />
                {journey.target}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Steps Timeline */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Steps ({journey.steps.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {journey.steps.map((step, index) => (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedScreenshot === index
                          ? "bg-primary/10 border border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedScreenshot(index)}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {step.step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {step.action}
                          </span>
                          {step.screenshot && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {step.url}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pre-conditions */}
            {journey.preConditions.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Pre-Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {journey.preConditions.map((condition, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">
                          {condition}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Screenshots / Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Preview</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/demo/live?journey=${journey.slug}`}>
                        <Play className="h-4 w-4 mr-1" />
                        Run Live
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {journey.screenshots.length > 0 ? (
                  <div className="space-y-4">
                    {journey.screenshots.map((screenshot, index) => (
                      <motion.div
                        key={screenshot.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className={`rounded-lg overflow-hidden border ${
                          selectedScreenshot === index
                            ? "border-primary"
                            : "border-border"
                        }`}
                        onClick={() => setSelectedScreenshot(index)}
                      >
                        <div className="aspect-video bg-muted relative">
                          <img
                            src={screenshot.url}
                            alt={`Step ${screenshot.stepNumber}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                            <p className="text-white text-sm font-medium">
                              Step {screenshot.stepNumber}:{" "}
                              {journey.steps[index]?.notes || "Screenshot"}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Layers className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      No Screenshots Yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Run this journey to capture screenshots
                    </p>
                    <Button asChild>
                      <Link href={`/demo/live?journey=${journey.slug}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Run Live Demo
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
