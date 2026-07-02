UPDATE "Prediction" AS prediction
SET
  "predictedAdvancingTeam" = CASE
    WHEN prediction."teamAScore" > prediction."teamBScore" THEN fixture."teamA"
    ELSE fixture."teamB"
  END,
  "updatedAt" = NOW()
FROM "Match" AS fixture
WHERE prediction."matchId" = fixture.id
  AND fixture.stage IN (
    'ROUND_OF_32',
    'ROUND_OF_16',
    'QUARTER_FINALS',
    'SEMI_FINALS'
  )
  -- Do not change matches from 2026-07-01 or earlier in America/Fortaleza.
  AND fixture."startsAt" >= '2026-07-02T00:00:00-03:00'::TIMESTAMPTZ
  AND fixture."teamA" IS NOT NULL
  AND fixture."teamB" IS NOT NULL
  AND prediction."teamAScore" <> prediction."teamBScore"
  AND prediction."predictedAdvancingTeam" IS DISTINCT FROM CASE
    WHEN prediction."teamAScore" > prediction."teamBScore" THEN fixture."teamA"
    ELSE fixture."teamB"
  END;

UPDATE "Prediction" AS prediction
SET
  "predictedAdvancingTeam" = corrected_predictions.corrected_advancing_team,
  "updatedAt" = NOW()
FROM "Match" AS fixture
JOIN (
  VALUES
    (
      'cmqy49m3o000j01qy190m2kud',
      84,
      'Espanha',
      'Áustria',
      2,
      2,
      'Croácia',
      'Áustria'
    ),
    (
      'cmr0nf3sb000101mgwvmfjuck',
      84,
      'Espanha',
      'Áustria',
      2,
      2,
      'Croácia',
      'Áustria'
    ),
    (
      'cmqy4j73b001301qyktjsl7jd',
      84,
      'Espanha',
      'Áustria',
      1,
      1,
      'Portugal',
      'Espanha'
    ),
    (
      'cmr29o3j7001201mg4g1dbiod',
      84,
      'Espanha',
      'Áustria',
      1,
      1,
      'Portugal',
      'Espanha'
    ),
    (
      'cmr2d71td001c01mg1qlwii33',
      84,
      'Espanha',
      'Áustria',
      1,
      1,
      'Portugal',
      'Espanha'
    ),
    (
      'cmqy4jz2p001601qy2huzbljf',
      86,
      'Argentina',
      'Cabo Verde',
      1,
      1,
      'Austrália',
      'Cabo Verde'
    ),
    (
      'cmr25gnbd000w01mgm740lub5',
      86,
      'Argentina',
      'Cabo Verde',
      1,
      1,
      'Austrália',
      'Cabo Verde'
    )
) AS corrected_predictions (
  prediction_id,
  match_number,
  team_a,
  team_b,
  team_a_score,
  team_b_score,
  current_advancing_team,
  corrected_advancing_team
)
  ON fixture."matchNumber" = corrected_predictions.match_number
WHERE prediction.id = corrected_predictions.prediction_id
  AND prediction."matchId" = fixture.id
  AND fixture.stage IN (
    'ROUND_OF_32',
    'ROUND_OF_16',
    'QUARTER_FINALS',
    'SEMI_FINALS'
  )
  -- Do not change matches from 2026-07-01 or earlier in America/Fortaleza.
  AND fixture."startsAt" >= '2026-07-02T00:00:00-03:00'::TIMESTAMPTZ
  AND fixture."teamA" = corrected_predictions.team_a
  AND fixture."teamB" = corrected_predictions.team_b
  AND prediction."teamAScore" = corrected_predictions.team_a_score
  AND prediction."teamBScore" = corrected_predictions.team_b_score
  AND prediction."teamAScore" = prediction."teamBScore"
  AND prediction."predictedAdvancingTeam" = corrected_predictions.current_advancing_team
  AND corrected_predictions.corrected_advancing_team IN (fixture."teamA", fixture."teamB")
  AND prediction."predictedAdvancingTeam" IS DISTINCT FROM corrected_predictions.corrected_advancing_team;
