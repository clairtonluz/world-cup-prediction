import { z } from "zod";
import { MATCH_STATUSES } from "@/lib/constants";

const score = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().min(0).max(99),
);

export const matchIdSchema = z.cuid();
export const friendGroupIdSchema = z.cuid();
export const userIdSchema = z.cuid();

export const inviteTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const friendGroupSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const predictionSchema = z.object({
  matchId: matchIdSchema,
  teamAScore: score,
  teamBScore: score,
  predictedAdvancingTeam: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() !== "" ? value : null,
    z.string().trim().min(1).max(80).nullable(),
  ),
});

const nullableScore = z.preprocess(
  (value) => (value === "" || value === null ? null : value),
  z.coerce.number().int().min(0).max(99).nullable(),
);

const advancingTeam = z.preprocess(
  (value) => (typeof value === "string" && value.trim() !== "" ? value : null),
  z.string().trim().min(1).max(80).nullable(),
);

export const matchResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal(MATCH_STATUSES[0]),
    teamAScore: z.null(),
    teamBScore: z.null(),
    advancingTeam: z.null(),
  }),
  z
    .object({
      status: z.literal(MATCH_STATUSES[1]),
      teamAScore: nullableScore,
      teamBScore: nullableScore,
      advancingTeam: z.null(),
    })
    .refine(
      ({ teamAScore, teamBScore }) =>
        (teamAScore === null) === (teamBScore === null),
      { message: "O placar parcial deve informar os dois lados." },
    ),
  z.object({
    status: z.literal(MATCH_STATUSES[2]),
    teamAScore: score,
    teamBScore: score,
    advancingTeam,
  }),
]);

export const favoriteTeamSchema = z.object({
  favoriteTeam: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().min(1).max(80).nullable(),
  ),
});

export const championPredictionSchema = z.object({
  predictedChampion: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() !== "" ? value : null,
    z.string().trim().min(1).max(80).nullable(),
  ),
});
