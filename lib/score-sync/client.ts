import "server-only";

import { z } from "zod";
import { ESPN_SCOREBOARD_DEFAULT_BASE_URL } from "@/lib/score-sync/constants";

const REQUEST_TIMEOUT_MS = 10_000;

const espnCompetitorSchema = z.object({
  homeAway: z.string(),
  score: z.string().nullable().optional(),
  winner: z.boolean().optional(),
  team: z.object({
    displayName: z.string(),
    shortDisplayName: z.string().optional(),
    abbreviation: z.string().optional(),
  }).passthrough(),
}).passthrough();

const espnEventSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  shortName: z.string().optional(),
  date: z.string(),
  status: z.object({
    type: z.object({
      state: z.string().optional(),
      completed: z.boolean().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
    }).passthrough(),
  }).passthrough(),
  competitions: z.array(z.object({
    competitors: z.array(espnCompetitorSchema),
  }).passthrough()).min(1),
}).passthrough();

const espnScoreboardSchema = z.object({
  events: z.array(espnEventSchema).default([]),
}).passthrough();

export type EspnScoreboardEvent = z.infer<typeof espnEventSchema>;

export class EspnScoreboardRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EspnScoreboardRequestError";
  }
}

export async function fetchEspnScoreboard(dateKey: string) {
  const url = new URL(process.env.ESPN_SCOREBOARD_BASE_URL || ESPN_SCOREBOARD_DEFAULT_BASE_URL);
  url.searchParams.set("dates", dateKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    throw new EspnScoreboardRequestError(
      error instanceof Error ? error.message : "ESPN scoreboard request failed",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new EspnScoreboardRequestError(`ESPN scoreboard returned HTTP ${response.status}`);
  }

  const parsed = espnScoreboardSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new EspnScoreboardRequestError("ESPN scoreboard response had an unexpected format");
  }

  return parsed.data.events;
}
