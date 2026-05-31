UPDATE "Match"
SET
  "startsAt" = "startsAt" + INTERVAL '3 hours',
  "updatedAt" = NOW();
