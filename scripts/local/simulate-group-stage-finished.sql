-- Development fixture: finish the 2026 group stage and open the round of 32.
--
-- Run only against disposable/local data after migrations:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--     -f scripts/local/simulate-group-stage-finished.sql
--
-- The script intentionally requires an untouched group stage. It may replace
-- participants in still-scheduled round-of-32 fixtures and deletes predictions
-- only when those participants change. Do not use it with real match results.

BEGIN;

CREATE TEMP TABLE simulated_group_ranking (
  group_code "GroupCode" NOT NULL,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 4),
  team TEXT NOT NULL,
  PRIMARY KEY (group_code, position),
  UNIQUE (group_code, team)
) ON COMMIT DROP;

INSERT INTO simulated_group_ranking (group_code, position, team) VALUES
  ('A', 1, 'México'),
  ('A', 2, 'República da Coreia'),
  ('A', 3, 'Tchéquia'),
  ('A', 4, 'África do Sul'),
  ('B', 1, 'Suíça'),
  ('B', 2, 'Canadá'),
  ('B', 3, 'Catar'),
  ('B', 4, 'Bósnia e Herzegovina'),
  ('C', 1, 'Brasil'),
  ('C', 2, 'Marrocos'),
  ('C', 3, 'Escócia'),
  ('C', 4, 'Haiti'),
  ('D', 1, 'EUA'),
  ('D', 2, 'Paraguai'),
  ('D', 3, 'Austrália'),
  ('D', 4, 'Turquia'),
  ('E', 1, 'Alemanha'),
  ('E', 2, 'Equador'),
  ('E', 3, 'Costa do Marfim'),
  ('E', 4, 'Curaçau'),
  ('F', 1, 'Holanda'),
  ('F', 2, 'Japão'),
  ('F', 3, 'Suécia'),
  ('F', 4, 'Tunísia'),
  ('G', 1, 'Bélgica'),
  ('G', 2, 'RI do Irã'),
  ('G', 3, 'Egito'),
  ('G', 4, 'Nova Zelândia'),
  ('H', 1, 'Espanha'),
  ('H', 2, 'Uruguai'),
  ('H', 3, 'Cabo Verde'),
  ('H', 4, 'Arábia Saudita'),
  ('I', 1, 'França'),
  ('I', 2, 'Noruega'),
  ('I', 3, 'Senegal'),
  ('I', 4, 'Iraque'),
  ('J', 1, 'Argentina'),
  ('J', 2, 'Áustria'),
  ('J', 3, 'Argélia'),
  ('J', 4, 'Jordânia'),
  ('K', 1, 'Portugal'),
  ('K', 2, 'Colômbia'),
  ('K', 3, 'Uzbequistão'),
  ('K', 4, 'RD do Congo'),
  ('L', 1, 'Inglaterra'),
  ('L', 2, 'Croácia'),
  ('L', 3, 'Gana'),
  ('L', 4, 'Panamá');

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM "Match" WHERE "stage" = 'GROUP_STAGE') <> 72 THEN
    RAISE EXCEPTION 'Simulation requires the official schedule with exactly 72 group matches.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Match"
    WHERE "stage" = 'GROUP_STAGE'
      AND (
        "status" <> 'SCHEDULED'
        OR "teamAScore" IS NOT NULL
        OR "teamBScore" IS NOT NULL
      )
  ) THEN
    RAISE EXCEPTION 'Simulation refused: at least one group match already has progress or a result.';
  END IF;

  IF (
    SELECT COUNT(*)
    FROM "Match" AS fixture
    JOIN simulated_group_ranking AS team_a
      ON team_a.group_code = fixture."groupCode"
     AND team_a.team = fixture."teamA"
    JOIN simulated_group_ranking AS team_b
      ON team_b.group_code = fixture."groupCode"
     AND team_b.team = fixture."teamB"
    WHERE fixture."stage" = 'GROUP_STAGE'
  ) <> 72 THEN
    RAISE EXCEPTION 'Simulation team ranking does not cover every official group match.';
  END IF;
END $$;

UPDATE "Match" AS fixture
SET
  "status" = 'FINISHED',
  "teamAScore" = CASE WHEN team_a.position < team_b.position THEN 2 ELSE 0 END,
  "teamBScore" = CASE WHEN team_b.position < team_a.position THEN 2 ELSE 0 END,
  "updatedAt" = CURRENT_TIMESTAMP
FROM simulated_group_ranking AS team_a
JOIN simulated_group_ranking AS team_b
  ON team_b.group_code = team_a.group_code
WHERE fixture."stage" = 'GROUP_STAGE'
  AND fixture."groupCode" = team_a.group_code
  AND fixture."teamA" = team_a.team
  AND fixture."teamB" = team_b.team;

-- Keep ranking results consistent with the scoring implementation for group matches.
UPDATE "Prediction" AS prediction
SET
  "points" = CASE
    WHEN prediction."teamAScore" = fixture."teamAScore"
      AND prediction."teamBScore" = fixture."teamBScore" THEN 10
    WHEN fixture."teamAScore" > fixture."teamBScore"
      AND prediction."teamAScore" > prediction."teamBScore"
      AND prediction."teamAScore" = fixture."teamAScore" THEN 7
    WHEN fixture."teamAScore" > fixture."teamBScore"
      AND prediction."teamAScore" > prediction."teamBScore"
      AND prediction."teamBScore" = fixture."teamBScore" THEN 5
    WHEN fixture."teamAScore" > fixture."teamBScore"
      AND prediction."teamAScore" > prediction."teamBScore" THEN 3
    WHEN fixture."teamBScore" > fixture."teamAScore"
      AND prediction."teamBScore" > prediction."teamAScore"
      AND prediction."teamBScore" = fixture."teamBScore" THEN 7
    WHEN fixture."teamBScore" > fixture."teamAScore"
      AND prediction."teamBScore" > prediction."teamAScore"
      AND prediction."teamAScore" = fixture."teamAScore" THEN 5
    WHEN fixture."teamBScore" > fixture."teamAScore"
      AND prediction."teamBScore" > prediction."teamAScore" THEN 3
    ELSE 0
  END,
  "updatedAt" = CURRENT_TIMESTAMP
FROM "Match" AS fixture
WHERE prediction."matchId" = fixture."id"
  AND fixture."stage" = 'GROUP_STAGE';

CREATE TEMP TABLE simulated_round_of_32 (
  match_number INTEGER PRIMARY KEY,
  team_a_slot TEXT NOT NULL,
  team_b_slot TEXT NOT NULL,
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL
) ON COMMIT DROP;

-- With the results above, the best third-placed groups are BCDEGHJL.
-- FIFA Annexe C maps them as BCDEGHJL:HGBCJDLE.
INSERT INTO simulated_round_of_32 (match_number, team_a_slot, team_b_slot, team_a, team_b) VALUES
  (73, '2A', '2B', 'República da Coreia', 'Canadá'),
  (74, '1C', '2F', 'Brasil', 'Japão'),
  (75, '1E', '3ABCDF', 'Alemanha', 'Escócia'),
  (76, '1F', '2C', 'Holanda', 'Marrocos'),
  (77, '2E', '2I', 'Equador', 'Noruega'),
  (78, '1I', '3CDFGH', 'França', 'Austrália'),
  (79, '1A', '3CEFHI', 'México', 'Cabo Verde'),
  (80, '1L', '3EHIJK', 'Inglaterra', 'Costa do Marfim'),
  (81, '1G', '3AEHIJ', 'Bélgica', 'Argélia'),
  (82, '1D', '3BEFIJ', 'EUA', 'Catar'),
  (83, '1H', '2J', 'Espanha', 'Áustria'),
  (84, '2K', '2L', 'Colômbia', 'Croácia'),
  (85, '1B', '3EFGIJ', 'Suíça', 'Egito'),
  (86, '2D', '2G', 'Paraguai', 'RI do Irã'),
  (87, '1J', '2H', 'Argentina', 'Uruguai'),
  (88, '1K', '3DEIJL', 'Portugal', 'Gana');

DO $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM "Match" AS fixture
    JOIN simulated_round_of_32 AS simulation
      ON simulation.match_number = fixture."matchNumber"
     AND simulation.team_a_slot = fixture."teamASlot"
     AND simulation.team_b_slot = fixture."teamBSlot"
    WHERE fixture."stage" = 'ROUND_OF_32'
  ) <> 16 THEN
    RAISE EXCEPTION 'Simulation round-of-32 participants do not match the official bracket slots.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Match"
    WHERE "stage" = 'ROUND_OF_32'
      AND "status" <> 'SCHEDULED'
  ) THEN
    RAISE EXCEPTION 'Simulation refused: at least one round-of-32 fixture has already started or finished.';
  END IF;
END $$;

-- Match the application rule: stale predictions must not remain attached to a
-- scheduled knockout match when its simulated participants change.
DELETE FROM "Prediction" AS prediction
USING "Match" AS fixture, simulated_round_of_32 AS simulation
WHERE prediction."matchId" = fixture."id"
  AND fixture."matchNumber" = simulation.match_number
  AND fixture."stage" = 'ROUND_OF_32'
  AND fixture."status" = 'SCHEDULED'
  AND (
    fixture."teamA" IS DISTINCT FROM simulation.team_a
    OR fixture."teamB" IS DISTINCT FROM simulation.team_b
  );

UPDATE "Match" AS fixture
SET
  "teamA" = simulation.team_a,
  "teamB" = simulation.team_b,
  "participantsConfirmed" = true,
  "updatedAt" = CURRENT_TIMESTAMP
FROM simulated_round_of_32 AS simulation
WHERE fixture."matchNumber" = simulation.match_number
  AND fixture."stage" = 'ROUND_OF_32';

COMMIT;

SELECT
  "stage",
  "status",
  COUNT(*) AS matches
FROM "Match"
WHERE "stage" IN ('GROUP_STAGE', 'ROUND_OF_32')
GROUP BY "stage", "status"
ORDER BY "stage", "status";
