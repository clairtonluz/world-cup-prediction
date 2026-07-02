CREATE TEMPORARY TABLE "_future_knockout_schedule_guard" (
  "valid" BOOLEAN NOT NULL CHECK ("valid")
);

INSERT INTO "_future_knockout_schedule_guard" ("valid")
SELECT COUNT(*) = 22
FROM "Match"
WHERE "matchNumber" BETWEEN 83 AND 104
  AND "status" = 'SCHEDULED';

TRUNCATE TABLE "_future_knockout_schedule_guard";

UPDATE "Match"
SET
  "fifaMatchId" = 'schedule-fix-fifa-' || "matchNumber"::TEXT,
  "espnEventId" = 'schedule-fix-espn-' || "matchNumber"::TEXT,
  "updatedAt" = NOW()
WHERE "matchNumber" BETWEEN 83 AND 104;

UPDATE "Match" AS fixture
SET
  "fifaMatchId" = corrected_matches.fifa_match_id,
  "espnEventId" = corrected_matches.espn_event_id,
  "teamA" = corrected_matches.team_a,
  "teamB" = corrected_matches.team_b,
  "teamASlot" = corrected_matches.team_a_slot,
  "teamBSlot" = corrected_matches.team_b_slot,
  "participantsConfirmed" = corrected_matches.participants_confirmed,
  "startsAt" = corrected_matches.starts_at,
  "venue" = corrected_matches.venue,
  "hostCity" = corrected_matches.host_city,
  "updatedAt" = NOW()
FROM (
  VALUES
    (83, '400021526', '760496', 'Portugal', 'Croácia', '2K', '2L', true, '2026-07-02T20:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Toronto', 'Toronto'),
    (84, '400021519', '760497', 'Espanha', 'Áustria', '1H', '2J', true, '2026-07-02T16:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Los Angeles', 'Los Angeles'),
    (85, '400021527', '760498', 'Suíça', 'Argélia', '1B', '3EFGIJ', true, '2026-07-03T00:00:00-03:00'::TIMESTAMPTZ, 'BC Place de Vancouver', 'Vancouver'),
    (86, '400021521', '760500', 'Argentina', 'Cabo Verde', '1J', '2H', true, '2026-07-03T19:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Miami', 'Miami'),
    (87, '400021517', '760501', 'Colômbia', 'Gana', '1K', '3DEIJL', true, '2026-07-03T22:30:00-03:00'::TIMESTAMPTZ, 'Estádio de Kansas City', 'Kansas City'),
    (88, '400021515', '760499', 'Austrália', 'Egito', '2D', '2G', true, '2026-07-03T15:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Dallas', 'Dallas'),
    (89, '400021533', '760503', 'Paraguai', 'França', 'W75', 'W78', true, '2026-07-04T18:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Filadélfia', 'Filadélfia'),
    (90, '400021530', '760502', 'Canadá', 'Marrocos', 'W73', 'W76', true, '2026-07-04T14:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Houston', 'Houston'),
    (91, '400021532', '760504', 'Brasil', 'Noruega', 'W74', 'W77', true, '2026-07-05T17:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Nova York/Nova Jersey', 'Nova Iorque'),
    (92, '400021531', '760505', 'México', 'Inglaterra', 'W79', 'W80', true, '2026-07-05T21:00:00-03:00'::TIMESTAMPTZ, 'Estádio da Cidade do México', 'Cidade do México'),
    (93, '400021529', '760506', NULL, NULL, 'W83', 'W84', false, '2026-07-06T16:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Dallas', 'Dallas'),
    (94, '400021534', '760507', 'Bélgica', 'EUA', 'W81', 'W82', true, '2026-07-06T21:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Seattle', 'Seattle'),
    (95, '400021528', '760509', NULL, NULL, 'W86', 'W88', false, '2026-07-07T13:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Atlanta', 'Atlanta'),
    (96, '400021535', '760508', NULL, NULL, 'W85', 'W87', false, '2026-07-07T17:00:00-03:00'::TIMESTAMPTZ, 'BC Place de Vancouver', 'Vancouver'),
    (97, '400021536', '760510', NULL, NULL, 'W89', 'W90', false, '2026-07-09T17:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Boston', 'Boston'),
    (98, '400021538', '760511', NULL, NULL, 'W93', 'W94', false, '2026-07-10T16:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Los Angeles', 'Los Angeles'),
    (99, '400021539', '760512', NULL, NULL, 'W91', 'W92', false, '2026-07-11T18:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Miami', 'Miami'),
    (100, '400021537', '760513', NULL, NULL, 'W95', 'W96', false, '2026-07-11T22:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Kansas City', 'Kansas City'),
    (101, '400021541', '760514', NULL, NULL, 'W97', 'W98', false, '2026-07-14T16:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Dallas', 'Dallas'),
    (102, '400021540', '760515', NULL, NULL, 'W99', 'W100', false, '2026-07-15T16:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Atlanta', 'Atlanta'),
    (103, '400021542', '760516', NULL, NULL, 'RU101', 'RU102', false, '2026-07-18T18:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Miami', 'Miami'),
    (104, '400021543', '760517', NULL, NULL, 'W101', 'W102', false, '2026-07-19T16:00:00-03:00'::TIMESTAMPTZ, 'Estádio de Nova York/Nova Jersey', 'Nova Iorque')
) AS corrected_matches (
  match_number,
  fifa_match_id,
  espn_event_id,
  team_a,
  team_b,
  team_a_slot,
  team_b_slot,
  participants_confirmed,
  starts_at,
  venue,
  host_city
)
WHERE fixture."matchNumber" = corrected_matches.match_number;

INSERT INTO "_future_knockout_schedule_guard" ("valid")
SELECT NOT EXISTS (
  SELECT 1
  FROM "Match"
  WHERE "matchNumber" BETWEEN 83 AND 104
    AND (
      "fifaMatchId" LIKE 'schedule-fix-fifa-%'
      OR "espnEventId" LIKE 'schedule-fix-espn-%'
    )
);

DROP TABLE "_future_knockout_schedule_guard";
