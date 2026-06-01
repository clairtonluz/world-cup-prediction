ALTER TABLE "Match"
ADD COLUMN "apiFootballFixtureId" INTEGER,
ADD COLUMN "apiUpdatesLocked" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Match_apiFootballFixtureId_key" ON "Match"("apiFootballFixtureId");

CREATE TABLE "ApiFootballSyncSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "intervalMinutes" INTEGER NOT NULL DEFAULT 10,
  "lastSyncStartedAt" TIMESTAMPTZ(3),
  "lastSyncFinishedAt" TIMESTAMPTZ(3),
  "lastSuccessfulSyncAt" TIMESTAMPTZ(3),
  "lastSyncSummary" TEXT,
  "lastSyncError" TEXT,
  "remainingRequests" INTEGER,
  "syncInProgressSince" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "ApiFootballSyncSettings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ApiFootballSyncSettings_intervalMinutes_check" CHECK ("intervalMinutes" BETWEEN 1 AND 180)
);

INSERT INTO "ApiFootballSyncSettings" ("id", "enabled", "intervalMinutes", "updatedAt")
VALUES ('default', true, 10, NOW())
ON CONFLICT ("id") DO NOTHING;
