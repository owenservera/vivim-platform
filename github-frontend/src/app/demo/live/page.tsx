"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Journey {
  slug: string;
  title: string;
  duration: string;
}

interface RunStatus {
  currentJourney: string | null;
  progress: number;
  status: "idle" | "running" | "completed" | "error" | "cancelled";
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

interface DemoStatus {
  journeys: {
    total: number;
    captured: number;
    pending: number;
  };
  runStatus: RunStatus;
}

export default function LiveDemoPage() {
  const searchParams = useSearchParams();
  const initialJourney = searchParams.get("journey") || "";

  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selectedJourney, setSelectedJourney] = useState(initialJourney);
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [journeysRes, statusRes] = await Promise.all([
          fetch("/api/demo/journeys"),
          fetch("/api/demo/status"),
        ]);

        const journeysData = await journeysRes.json();
        const statusData = await statusRes.json();

        setJourneys(journeysData.journeys || []);
        setStatus(statusData);

        if (initialJourney && journeysData.journeys) {
          const journey = journeysData.journeys.find(
            (j: Journey) => j.slug === initialJourney,
          );
          if (journey) {
            setSelectedJourney(journey.slug);
          }
        }
      } catch (error) {
        console.error("Failed to fetch demo data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Poll for status updates when running
    const interval = setInterval(async () => {
      if (running) {
        try {
          const res = await fetch("/api/demo/status");
          const data = await res.json();
          setStatus(data);

          if (
            data.runStatus.status === "completed" ||
            data.runStatus.status === "error"
          ) {
            setRunning(false);
          }
        } catch (error) {
          console.error("Failed to fetch status:", error);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [initialJourney, running]);

  const runJourney = useCallback(async () => {
    if (!selectedJourney || running) return;

    setRunning(true);

    try {
      const res = await fetch(`/api/demo/run/${selectedJourney}`, {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Failed to run journey:", error);
        setRunning(false);
      }
    } catch (error) {
      console.error("Failed to run journey:", error);
      setRunning(false);
    }
  }, [selectedJourney, running]);

  const cancelRun = useCallback(async () => {
    try {
      await fetch("/api/demo/run", {
        method: "DELETE",
      });
      setRunning(false);
    } catch (error) {
      console.error("Failed to cancel run:", error);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isRunning = status?.runStatus.status === "running";
  const progress = status?.runStatus.progress || 0;

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-4xl">
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

          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Live Demo Runner
          </h1>
          <p className="text-muted-foreground">
            Run an interactive demo journey with real-time screenshot capture
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Select Journey</CardTitle>
                <CardDescription>Choose a demo journey to run</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <select
                  value={selectedJourney}
                  onChange={(e) => setSelectedJourney(e.target.value)}
                  disabled={running}
                  className="w-full p-2 rounded-md border bg-background"
                >
                  <option value="">Select a journey...</option>
                  {journeys.map((journey) => (
                    <option key={journey.slug} value={journey.slug}>
                      {journey.title} ({journey.duration})
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  {!running ? (
                    <Button
                      onClick={runJourney}
                      disabled={!selectedJourney}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Demo
                    </Button>
                  ) : (
                    <Button
                      onClick={cancelRun}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Status
                  {isRunning ? (
                    <span className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse" />
                  ) : status?.runStatus.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : status?.runStatus.status === "error" ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <span className="h-3 w-3 rounded-full bg-gray-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isRunning && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="capitalize font-medium">
                      {status?.runStatus.status || "idle"}
                    </span>
                  </div>
                  {status?.runStatus.currentJourney && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Journey</span>
                      <span className="font-medium">
                        {status.runStatus.currentJourney}
                      </span>
                    </div>
                  )}
                  {status?.runStatus.startedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Started</span>
                      <span>
                        {new Date(
                          status.runStatus.startedAt,
                        ).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  {status?.runStatus.error && (
                    <div className="p-2 rounded-md bg-red-500/10 text-red-500 text-sm">
                      {status.runStatus.error}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full min-h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {isRunning ? (
                    <motion.div
                      key="running"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full py-12"
                    >
                      <div className="relative mb-4">
                        <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Clock className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <p className="text-lg font-medium mb-2">
                        Capturing Screenshots...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {status?.runStatus.currentJourney} - {progress}%
                      </p>
                    </motion.div>
                  ) : selectedJourney ? (
                    <motion.div
                      key="ready"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full py-12"
                    >
                      <div className="rounded-full bg-primary/10 p-4 mb-4">
                        <Play className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-lg font-medium mb-2">Ready to Run</p>
                      <p className="text-sm text-muted-foreground text-center max-w-xs">
                        Click "Start Demo" to begin capturing screenshots for
                        the {selectedJourney} journey
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full py-12"
                    >
                      <div className="rounded-full bg-muted p-4 mb-4">
                        <Layers className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium mb-2">
                        Select a Journey
                      </p>
                      <p className="text-sm text-muted-foreground text-center max-w-xs">
                        Choose a demo journey from the dropdown to get started
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
