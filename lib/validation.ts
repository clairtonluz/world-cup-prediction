import { z } from "zod";
import { MATCH_STAGES, MATCH_STATUSES } from "@/lib/constants";

const score = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().min(0).max(99),
);

export const predictionSchema = z.object({
  matchId: z.cuid(),
  teamAScore: score,
  teamBScore: score,
});

export const matchCoreSchema = z
  .object({
    teamA: z.string().trim().min(1).max(80),
    teamB: z.string().trim().min(1).max(80),
    stage: z.enum(MATCH_STAGES),
    startsAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  })
  .refine(
    ({ teamA, teamB }) =>
      teamA.toLocaleLowerCase() !== teamB.toLocaleLowerCase(),
    { message: "Teams must be different", path: ["teamB"] },
  );

export const matchStatusSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.enum([MATCH_STATUSES[0], MATCH_STATUSES[1]]),
    teamAScore: z.null(),
    teamBScore: z.null(),
  }),
  z.object({
    status: z.literal(MATCH_STATUSES[2]),
    teamAScore: score,
    teamBScore: score,
  }),
]);

export const matchInputSchema = matchCoreSchema.and(matchStatusSchema);

export const favoriteTeamSchema = z.object({
  favoriteTeam: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().min(1).max(80).nullable(),
  ),
});
