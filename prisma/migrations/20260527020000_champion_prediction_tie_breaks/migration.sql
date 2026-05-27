ALTER TABLE "User"
  ADD COLUMN "predictedChampion" TEXT;

ALTER TABLE "Prediction"
  ADD COLUMN "predictedAdvancingTeam" TEXT;
