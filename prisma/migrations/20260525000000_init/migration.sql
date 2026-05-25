CREATE TYPE "MatchStage" AS ENUM (
  'GROUP_STAGE',
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'THIRD_PLACE_MATCH',
  'FINAL'
);

CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'STARTED', 'FINISHED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "keycloakId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "image" TEXT,
  "favoriteTeam" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Match" (
  "id" TEXT NOT NULL,
  "teamA" TEXT NOT NULL,
  "teamB" TEXT NOT NULL,
  "stage" "MatchStage" NOT NULL,
  "startsAt" TIMESTAMPTZ(3) NOT NULL,
  "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
  "teamAScore" INTEGER,
  "teamBScore" INTEGER,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Match_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Match_result_status_check" CHECK (
    ("status" = 'FINISHED' AND "teamAScore" BETWEEN 0 AND 99 AND "teamBScore" BETWEEN 0 AND 99)
    OR ("status" <> 'FINISHED' AND "teamAScore" IS NULL AND "teamBScore" IS NULL)
  )
);

CREATE TABLE "Prediction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "teamAScore" INTEGER NOT NULL,
  "teamBScore" INTEGER NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Prediction_score_check" CHECK ("teamAScore" BETWEEN 0 AND 99 AND "teamBScore" BETWEEN 0 AND 99),
  CONSTRAINT "Prediction_points_check" CHECK ("points" >= 0)
);

CREATE UNIQUE INDEX "User_keycloakId_key" ON "User"("keycloakId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Match_status_startsAt_idx" ON "Match"("status", "startsAt");
CREATE INDEX "Match_stage_idx" ON "Match"("stage");
CREATE UNIQUE INDEX "Prediction_userId_matchId_key" ON "Prediction"("userId", "matchId");
CREATE INDEX "Prediction_matchId_idx" ON "Prediction"("matchId");
CREATE INDEX "Prediction_userId_idx" ON "Prediction"("userId");

ALTER TABLE "Prediction"
ADD CONSTRAINT "Prediction_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Prediction"
ADD CONSTRAINT "Prediction_matchId_fkey"
FOREIGN KEY ("matchId") REFERENCES "Match"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
