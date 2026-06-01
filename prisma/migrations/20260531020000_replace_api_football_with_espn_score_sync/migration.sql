ALTER TABLE "Match"
RENAME COLUMN "apiUpdatesLocked" TO "scoreSyncLocked";

DROP INDEX IF EXISTS "Match_apiFootballFixtureId_key";

ALTER TABLE "Match"
DROP COLUMN "apiFootballFixtureId",
ADD COLUMN "espnEventId" TEXT;

CREATE UNIQUE INDEX "Match_espnEventId_key" ON "Match"("espnEventId");

ALTER TABLE "ApiFootballSyncSettings"
RENAME TO "ScoreSyncSettings";

ALTER TABLE "ScoreSyncSettings"
RENAME CONSTRAINT "ApiFootballSyncSettings_pkey" TO "ScoreSyncSettings_pkey";

ALTER TABLE "ScoreSyncSettings"
RENAME CONSTRAINT "ApiFootballSyncSettings_intervalMinutes_check" TO "ScoreSyncSettings_intervalMinutes_check";
