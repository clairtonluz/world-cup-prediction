-- Development fixture: create random predictions for existing users and finished matches.
--
-- Run only against disposable/local data after matches have finished, for example
-- after scripts/local/simulate-group-stage-finished.sql:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--     -f scripts/local/create-random-predictions-for-finished-matches.sql
--
-- Existing predictions are preserved. This script fills only user/match pairs
-- that have no prediction, because replacing submitted predictions would hide
-- useful test scenarios and could overwrite local manual test data.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "User") THEN
    RAISE EXCEPTION 'Random prediction simulation requires at least one existing user.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "Match" WHERE "status" = 'FINISHED') THEN
    RAISE EXCEPTION 'Random prediction simulation requires at least one finished match.';
  END IF;
END $$;

CREATE TEMP TABLE random_finished_predictions ON COMMIT DROP AS
SELECT
  existing_user."id" AS user_id,
  fixture."id" AS match_id,
  fixture."stage" AS stage,
  fixture."startsAt" AS starts_at,
  fixture."teamA" AS team_a,
  fixture."teamB" AS team_b,
  fixture."teamAScore" AS actual_team_a_score,
  fixture."teamBScore" AS actual_team_b_score,
  floor(random() * 5)::INTEGER AS predicted_team_a_score,
  floor(random() * 5)::INTEGER AS predicted_team_b_score
FROM "User" AS existing_user
CROSS JOIN "Match" AS fixture
WHERE fixture."status" = 'FINISHED'
  AND NOT EXISTS (
    SELECT 1
    FROM "Prediction" AS existing_prediction
    WHERE existing_prediction."userId" = existing_user."id"
      AND existing_prediction."matchId" = fixture."id"
  );

INSERT INTO "Prediction" (
  "id",
  "userId",
  "matchId",
  "teamAScore",
  "teamBScore",
  "predictedAdvancingTeam",
  "points",
  "createdAt",
  "updatedAt"
)
SELECT
  'local_prediction_' || md5(generated.user_id || ':' || generated.match_id),
  generated.user_id,
  generated.match_id,
  generated.predicted_team_a_score,
  generated.predicted_team_b_score,
  CASE
    WHEN generated.stage IN ('ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS')
      THEN CASE WHEN random() < 0.5 THEN generated.team_a ELSE generated.team_b END
    ELSE NULL
  END,
  CASE
    WHEN generated.predicted_team_a_score = generated.actual_team_a_score
      AND generated.predicted_team_b_score = generated.actual_team_b_score
      THEN stage_points.base_points
    WHEN generated.actual_team_a_score = generated.actual_team_b_score
      AND generated.predicted_team_a_score = generated.predicted_team_b_score
      THEN round(stage_points.base_points * 0.3)::INTEGER
    WHEN generated.actual_team_a_score > generated.actual_team_b_score
      AND generated.predicted_team_a_score > generated.predicted_team_b_score
      AND generated.predicted_team_a_score = generated.actual_team_a_score
      THEN round(stage_points.base_points * 0.7)::INTEGER
    WHEN generated.actual_team_a_score > generated.actual_team_b_score
      AND generated.predicted_team_a_score > generated.predicted_team_b_score
      AND generated.predicted_team_b_score = generated.actual_team_b_score
      THEN round(stage_points.base_points * 0.5)::INTEGER
    WHEN generated.actual_team_a_score > generated.actual_team_b_score
      AND generated.predicted_team_a_score > generated.predicted_team_b_score
      THEN round(stage_points.base_points * 0.3)::INTEGER
    WHEN generated.actual_team_b_score > generated.actual_team_a_score
      AND generated.predicted_team_b_score > generated.predicted_team_a_score
      AND generated.predicted_team_b_score = generated.actual_team_b_score
      THEN round(stage_points.base_points * 0.7)::INTEGER
    WHEN generated.actual_team_b_score > generated.actual_team_a_score
      AND generated.predicted_team_b_score > generated.predicted_team_a_score
      AND generated.predicted_team_a_score = generated.actual_team_a_score
      THEN round(stage_points.base_points * 0.5)::INTEGER
    WHEN generated.actual_team_b_score > generated.actual_team_a_score
      AND generated.predicted_team_b_score > generated.predicted_team_a_score
      THEN round(stage_points.base_points * 0.3)::INTEGER
    ELSE 0
  END,
  generated.starts_at - INTERVAL '1 day',
  generated.starts_at - INTERVAL '1 day'
FROM random_finished_predictions AS generated
JOIN (
  VALUES
    ('GROUP_STAGE'::"MatchStage", 10),
    ('ROUND_OF_32'::"MatchStage", 15),
    ('ROUND_OF_16'::"MatchStage", 20),
    ('QUARTER_FINALS'::"MatchStage", 30),
    ('SEMI_FINALS'::"MatchStage", 50),
    ('THIRD_PLACE_MATCH'::"MatchStage", 40),
    ('FINAL'::"MatchStage", 100)
) AS stage_points(stage, base_points)
  ON stage_points.stage = generated.stage
ON CONFLICT ("userId", "matchId") DO NOTHING;

COMMIT;

SELECT
  COUNT(*) AS total_predictions_for_finished_matches
FROM "Prediction" AS prediction
JOIN "Match" AS fixture ON fixture."id" = prediction."matchId"
WHERE fixture."status" = 'FINISHED';
