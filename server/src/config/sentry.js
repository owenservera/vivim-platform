/**
 * Sentry Configuration Schema
 *
 * Extends the main configuration with Sentry-specific settings
 */

import { z } from 'zod';

export const sentryConfigSchema = z.object({
  sentryDsn: z.string().optional(),
  sentryRelease: z.string().optional(),
  sentryEnvironment: z.string().optional(),
  sentryTracesSampleRate: z.number().min(0).max(1).default(0.1),
  sentryProfilesSampleRate: z.number().min(0).max(1).default(0.1),
  sentryDebug: z.boolean().default(false),
});

export function loadSentryConfig() {
  const rawConfig = {
    sentryDsn: process.env.SENTRY_DSN,
    sentryRelease: process.env.SENTRY_RELEASE,
    sentryEnvironment: process.env.SENTRY_ENVIRONMENT,
    sentryTracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
      ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
      : undefined,
    sentryProfilesSampleRate: process.env.SENTRY_PROFILES_SAMPLE_RATE
      ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE)
      : undefined,
    sentryDebug: process.env.SENTRY_DEBUG === 'true',
  };
  return sentryConfigSchema.parse(rawConfig);
}

export const sentryConfig = loadSentryConfig();

export default sentryConfig;
