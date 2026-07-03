CREATE TYPE "MatchStartBackupStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

CREATE TABLE "MatchStartBackup" (
  "matchId" TEXT NOT NULL,
  "fileName" TEXT,
  "status" "MatchStartBackupStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "matchStatus" "MatchStatus" NOT NULL,
  "lastError" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMPTZ(3),
  CONSTRAINT "MatchStartBackup_pkey" PRIMARY KEY ("matchId")
);

CREATE UNIQUE INDEX "MatchStartBackup_fileName_key" ON "MatchStartBackup"("fileName");
CREATE INDEX "MatchStartBackup_status_completedAt_idx" ON "MatchStartBackup"("status", "completedAt");

ALTER TABLE "MatchStartBackup"
ADD CONSTRAINT "MatchStartBackup_matchId_fkey"
FOREIGN KEY ("matchId") REFERENCES "Match"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
