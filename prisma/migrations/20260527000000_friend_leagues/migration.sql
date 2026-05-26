CREATE TABLE "League" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "inviteTokenHash" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeagueMember" (
  "leagueId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "joinedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeagueMember_pkey" PRIMARY KEY ("leagueId", "userId")
);

CREATE UNIQUE INDEX "League_inviteTokenHash_key" ON "League"("inviteTokenHash");
CREATE INDEX "League_ownerId_idx" ON "League"("ownerId");
CREATE INDEX "LeagueMember_userId_idx" ON "LeagueMember"("userId");

ALTER TABLE "League"
ADD CONSTRAINT "League_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeagueMember"
ADD CONSTRAINT "LeagueMember_leagueId_fkey"
FOREIGN KEY ("leagueId") REFERENCES "League"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeagueMember"
ADD CONSTRAINT "LeagueMember_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
