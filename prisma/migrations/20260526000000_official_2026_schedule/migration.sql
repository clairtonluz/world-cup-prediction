CREATE TYPE "GroupCode" AS ENUM (
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Match") THEN
    RAISE EXCEPTION 'The official World Cup schedule migration requires an empty Match table.';
  END IF;
END $$;

ALTER TABLE "Match"
  DROP CONSTRAINT "Match_result_status_check",
  ALTER COLUMN "teamA" DROP NOT NULL,
  ALTER COLUMN "teamB" DROP NOT NULL,
  ADD COLUMN "matchNumber" INTEGER,
  ADD COLUMN "fifaMatchId" TEXT,
  ADD COLUMN "teamASlot" TEXT,
  ADD COLUMN "teamBSlot" TEXT,
  ADD COLUMN "participantsConfirmed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "groupCode" "GroupCode",
  ADD COLUMN "groupRound" INTEGER,
  ADD COLUMN "venue" TEXT,
  ADD COLUMN "hostCity" TEXT,
  ADD COLUMN "advancingTeam" TEXT,
  ADD COLUMN "predictionsResetAt" TIMESTAMPTZ(3);

INSERT INTO "Match" ("id", "matchNumber", "fifaMatchId", "teamA", "teamB", "teamASlot", "teamBSlot", "participantsConfirmed", "stage", "groupCode", "groupRound", "startsAt", "venue", "hostCity", "status", "createdAt", "updatedAt") VALUES
  ('c2026match00000000000000000001', 1, '400021443', 'México', 'África do Sul', NULL, NULL, true, 'GROUP_STAGE', 'A', 1, '2026-06-11T16:00:00-03:00', 'Estádio da Cidade do México', 'Cidade do México', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000002', 2, '400021441', 'República da Coreia', 'Tchéquia', NULL, NULL, true, 'GROUP_STAGE', 'A', 1, '2026-06-11T23:00:00-03:00', 'Estádio de Guadalajara', 'Guadalajara', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000003', 3, '400021449', 'Canadá', 'Bósnia e Herzegovina', NULL, NULL, true, 'GROUP_STAGE', 'B', 1, '2026-06-12T16:00:00-03:00', 'Estádio de Toronto', 'Toronto', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000004', 4, '400021458', 'EUA', 'Paraguai', NULL, NULL, true, 'GROUP_STAGE', 'D', 1, '2026-06-12T22:00:00-03:00', 'Estádio de Los Angeles', 'Los Angeles', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000005', 5, '400021447', 'Catar', 'Suíça', NULL, NULL, true, 'GROUP_STAGE', 'B', 1, '2026-06-13T16:00:00-03:00', 'Estádio da Baía de São Francisco', 'Área da baía de São Francisco', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000006', 6, '400021456', 'Brasil', 'Marrocos', NULL, NULL, true, 'GROUP_STAGE', 'C', 1, '2026-06-13T19:00:00-03:00', 'Estádio de Nova York/Nova Jersey', 'Nova Iorque', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000007', 7, '400021453', 'Haiti', 'Escócia', NULL, NULL, true, 'GROUP_STAGE', 'C', 1, '2026-06-13T22:00:00-03:00', 'Estádio de Boston', 'Boston', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000008', 8, '400021463', 'Austrália', 'Turquia', NULL, NULL, true, 'GROUP_STAGE', 'D', 1, '2026-06-14T01:00:00-03:00', 'BC Place de Vancouver', 'Vancouver', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000009', 9, '400021464', 'Alemanha', 'Curaçau', NULL, NULL, true, 'GROUP_STAGE', 'E', 1, '2026-06-14T14:00:00-03:00', 'Estádio de Houston', 'Houston', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000010', 10, '400021470', 'Holanda', 'Japão', NULL, NULL, true, 'GROUP_STAGE', 'F', 1, '2026-06-14T17:00:00-03:00', 'Estádio de Dallas', 'Dallas', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000011', 11, '400021467', 'Costa do Marfim', 'Equador', NULL, NULL, true, 'GROUP_STAGE', 'E', 1, '2026-06-14T20:00:00-03:00', 'Estádio de Filadélfia', 'Filadélfia', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000012', 12, '400021474', 'Suécia', 'Tunísia', NULL, NULL, true, 'GROUP_STAGE', 'F', 1, '2026-06-14T23:00:00-03:00', 'Estádio de Monterrey', 'Monterrey', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000013', 13, '400021482', 'Espanha', 'Cabo Verde', NULL, NULL, true, 'GROUP_STAGE', 'H', 1, '2026-06-15T13:00:00-03:00', 'Estádio de Atlanta', 'Atlanta', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000014', 14, '400021478', 'Bélgica', 'Egito', NULL, NULL, true, 'GROUP_STAGE', 'G', 1, '2026-06-15T16:00:00-03:00', 'Estádio de Seattle', 'Seattle', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000015', 15, '400021486', 'Arábia Saudita', 'Uruguai', NULL, NULL, true, 'GROUP_STAGE', 'H', 1, '2026-06-15T19:00:00-03:00', 'Estádio de Miami', 'Miami', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000016', 16, '400021476', 'RI do Irã', 'Nova Zelândia', NULL, NULL, true, 'GROUP_STAGE', 'G', 1, '2026-06-15T22:00:00-03:00', 'Estádio de Los Angeles', 'Los Angeles', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000017', 17, '400021490', 'França', 'Senegal', NULL, NULL, true, 'GROUP_STAGE', 'I', 1, '2026-06-16T16:00:00-03:00', 'Estádio de Nova York/Nova Jersey', 'Nova Iorque', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000018', 18, '400021488', 'Iraque', 'Noruega', NULL, NULL, true, 'GROUP_STAGE', 'I', 1, '2026-06-16T19:00:00-03:00', 'Estádio de Boston', 'Boston', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000019', 19, '400021496', 'Argentina', 'Argélia', NULL, NULL, true, 'GROUP_STAGE', 'J', 1, '2026-06-16T22:00:00-03:00', 'Estádio de Kansas City', 'Kansas City', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000020', 20, '400021498', 'Áustria', 'Jordânia', NULL, NULL, true, 'GROUP_STAGE', 'J', 1, '2026-06-17T01:00:00-03:00', 'Estádio da Baía de São Francisco', 'Área da baía de São Francisco', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000021', 21, '400021502', 'Portugal', 'RD do Congo', NULL, NULL, true, 'GROUP_STAGE', 'K', 1, '2026-06-17T14:00:00-03:00', 'Estádio de Houston', 'Houston', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000022', 22, '400021507', 'Inglaterra', 'Croácia', NULL, NULL, true, 'GROUP_STAGE', 'L', 1, '2026-06-17T17:00:00-03:00', 'Estádio de Dallas', 'Dallas', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000023', 23, '400021510', 'Gana', 'Panamá', NULL, NULL, true, 'GROUP_STAGE', 'L', 1, '2026-06-17T20:00:00-03:00', 'Estádio de Toronto', 'Toronto', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000024', 24, '400021504', 'Uzbequistão', 'Colômbia', NULL, NULL, true, 'GROUP_STAGE', 'K', 1, '2026-06-17T23:00:00-03:00', 'Estádio da Cidade do México', 'Cidade do México', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000025', 25, '400021440', 'Tchéquia', 'África do Sul', NULL, NULL, true, 'GROUP_STAGE', 'A', 2, '2026-06-18T13:00:00-03:00', 'Estádio de Atlanta', 'Atlanta', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000026', 26, '400021446', 'Suíça', 'Bósnia e Herzegovina', NULL, NULL, true, 'GROUP_STAGE', 'B', 2, '2026-06-18T16:00:00-03:00', 'Estádio de Los Angeles', 'Los Angeles', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000027', 27, '400021450', 'Canadá', 'Catar', NULL, NULL, true, 'GROUP_STAGE', 'B', 2, '2026-06-18T19:00:00-03:00', 'BC Place de Vancouver', 'Vancouver', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000028', 28, '400021442', 'México', 'República da Coreia', NULL, NULL, true, 'GROUP_STAGE', 'A', 2, '2026-06-18T22:00:00-03:00', 'Estádio de Guadalajara', 'Guadalajara', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000029', 29, '400021462', 'EUA', 'Austrália', NULL, NULL, true, 'GROUP_STAGE', 'D', 2, '2026-06-19T16:00:00-03:00', 'Estádio de Seattle', 'Seattle', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000030', 30, '400021454', 'Escócia', 'Marrocos', NULL, NULL, true, 'GROUP_STAGE', 'C', 2, '2026-06-19T19:00:00-03:00', 'Estádio de Boston', 'Boston', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000031', 31, '400021457', 'Brasil', 'Haiti', NULL, NULL, true, 'GROUP_STAGE', 'C', 2, '2026-06-19T21:30:00-03:00', 'Estádio de Filadélfia', 'Filadélfia', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000032', 32, '400021460', 'Turquia', 'Paraguai', NULL, NULL, true, 'GROUP_STAGE', 'D', 2, '2026-06-20T00:00:00-03:00', 'Estádio da Baía de São Francisco', 'Área da baía de São Francisco', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000033', 33, '400021472', 'Holanda', 'Suécia', NULL, NULL, true, 'GROUP_STAGE', 'F', 2, '2026-06-20T14:00:00-03:00', 'Estádio de Houston', 'Houston', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000034', 34, '400021469', 'Alemanha', 'Costa do Marfim', NULL, NULL, true, 'GROUP_STAGE', 'E', 2, '2026-06-20T17:00:00-03:00', 'Estádio de Toronto', 'Toronto', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000035', 35, '400021465', 'Equador', 'Curaçau', NULL, NULL, true, 'GROUP_STAGE', 'E', 2, '2026-06-20T21:00:00-03:00', 'Estádio de Kansas City', 'Kansas City', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000036', 36, '400021475', 'Tunísia', 'Japão', NULL, NULL, true, 'GROUP_STAGE', 'F', 2, '2026-06-21T01:00:00-03:00', 'Estádio de Monterrey', 'Monterrey', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000037', 37, '400021483', 'Espanha', 'Arábia Saudita', NULL, NULL, true, 'GROUP_STAGE', 'H', 2, '2026-06-21T13:00:00-03:00', 'Estádio de Atlanta', 'Atlanta', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000038', 38, '400021477', 'Bélgica', 'RI do Irã', NULL, NULL, true, 'GROUP_STAGE', 'G', 2, '2026-06-21T16:00:00-03:00', 'Estádio de Los Angeles', 'Los Angeles', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000039', 39, '400021487', 'Uruguai', 'Cabo Verde', NULL, NULL, true, 'GROUP_STAGE', 'H', 2, '2026-06-21T19:00:00-03:00', 'Estádio de Miami', 'Miami', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000040', 40, '400021480', 'Nova Zelândia', 'Egito', NULL, NULL, true, 'GROUP_STAGE', 'G', 2, '2026-06-21T22:00:00-03:00', 'BC Place de Vancouver', 'Vancouver', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000041', 41, '400021494', 'Argentina', 'Áustria', NULL, NULL, true, 'GROUP_STAGE', 'J', 2, '2026-06-22T14:00:00-03:00', 'Estádio de Dallas', 'Dallas', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000042', 42, '400021492', 'França', 'Iraque', NULL, NULL, true, 'GROUP_STAGE', 'I', 2, '2026-06-22T18:00:00-03:00', 'Estádio de Filadélfia', 'Filadélfia', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000043', 43, '400021491', 'Noruega', 'Senegal', NULL, NULL, true, 'GROUP_STAGE', 'I', 2, '2026-06-22T21:00:00-03:00', 'Estádio de Nova York/Nova Jersey', 'Nova Iorque', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000044', 44, '400021499', 'Jordânia', 'Argélia', NULL, NULL, true, 'GROUP_STAGE', 'J', 2, '2026-06-23T00:00:00-03:00', 'Estádio da Baía de São Francisco', 'Área da baía de São Francisco', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000045', 45, '400021503', 'Portugal', 'Uzbequistão', NULL, NULL, true, 'GROUP_STAGE', 'K', 2, '2026-06-23T14:00:00-03:00', 'Estádio de Houston', 'Houston', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000046', 46, '400021506', 'Inglaterra', 'Gana', NULL, NULL, true, 'GROUP_STAGE', 'L', 2, '2026-06-23T17:00:00-03:00', 'Estádio de Boston', 'Boston', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000047', 47, '400021511', 'Panamá', 'Croácia', NULL, NULL, true, 'GROUP_STAGE', 'L', 2, '2026-06-23T20:00:00-03:00', 'Estádio de Toronto', 'Toronto', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000048', 48, '400021501', 'Colômbia', 'RD do Congo', NULL, NULL, true, 'GROUP_STAGE', 'K', 2, '2026-06-23T23:00:00-03:00', 'Estádio de Guadalajara', 'Guadalajara', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000049', 49, '400021451', 'Suíça', 'Canadá', NULL, NULL, true, 'GROUP_STAGE', 'B', 3, '2026-06-24T16:00:00-03:00', 'BC Place de Vancouver', 'Vancouver', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000050', 50, '400021448', 'Bósnia e Herzegovina', 'Catar', NULL, NULL, true, 'GROUP_STAGE', 'B', 3, '2026-06-24T16:00:00-03:00', 'Estádio de Seattle', 'Seattle', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000051', 51, '400021455', 'Escócia', 'Brasil', NULL, NULL, true, 'GROUP_STAGE', 'C', 3, '2026-06-24T19:00:00-03:00', 'Estádio de Miami', 'Miami', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000052', 52, '400021452', 'Marrocos', 'Haiti', NULL, NULL, true, 'GROUP_STAGE', 'C', 3, '2026-06-24T19:00:00-03:00', 'Estádio de Atlanta', 'Atlanta', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000053', 53, '400021444', 'Tchéquia', 'México', NULL, NULL, true, 'GROUP_STAGE', 'A', 3, '2026-06-24T22:00:00-03:00', 'Estádio da Cidade do México', 'Cidade do México', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000054', 54, '400021445', 'África do Sul', 'República da Coreia', NULL, NULL, true, 'GROUP_STAGE', 'A', 3, '2026-06-24T22:00:00-03:00', 'Estádio de Monterrey', 'Monterrey', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000055', 55, '400021468', 'Curaçau', 'Costa do Marfim', NULL, NULL, true, 'GROUP_STAGE', 'E', 3, '2026-06-25T17:00:00-03:00', 'Estádio de Filadélfia', 'Filadélfia', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000056', 56, '400021466', 'Equador', 'Alemanha', NULL, NULL, true, 'GROUP_STAGE', 'E', 3, '2026-06-25T17:00:00-03:00', 'Estádio de Nova York/Nova Jersey', 'Nova Iorque', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000057', 57, '400021471', 'Japão', 'Suécia', NULL, NULL, true, 'GROUP_STAGE', 'F', 3, '2026-06-25T20:00:00-03:00', 'Estádio de Dallas', 'Dallas', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000058', 58, '400021473', 'Tunísia', 'Holanda', NULL, NULL, true, 'GROUP_STAGE', 'F', 3, '2026-06-25T20:00:00-03:00', 'Estádio de Kansas City', 'Kansas City', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000059', 59, '400021459', 'Turquia', 'EUA', NULL, NULL, true, 'GROUP_STAGE', 'D', 3, '2026-06-25T23:00:00-03:00', 'Estádio de Los Angeles', 'Los Angeles', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000060', 60, '400021461', 'Paraguai', 'Austrália', NULL, NULL, true, 'GROUP_STAGE', 'D', 3, '2026-06-25T23:00:00-03:00', 'Estádio da Baía de São Francisco', 'Área da baía de São Francisco', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000061', 61, '400021489', 'Noruega', 'França', NULL, NULL, true, 'GROUP_STAGE', 'I', 3, '2026-06-26T16:00:00-03:00', 'Estádio de Boston', 'Boston', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000062', 62, '400021493', 'Senegal', 'Iraque', NULL, NULL, true, 'GROUP_STAGE', 'I', 3, '2026-06-26T16:00:00-03:00', 'Estádio de Toronto', 'Toronto', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000063', 63, '400021485', 'Cabo Verde', 'Arábia Saudita', NULL, NULL, true, 'GROUP_STAGE', 'H', 3, '2026-06-26T21:00:00-03:00', 'Estádio de Houston', 'Houston', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000064', 64, '400021484', 'Uruguai', 'Espanha', NULL, NULL, true, 'GROUP_STAGE', 'H', 3, '2026-06-26T21:00:00-03:00', 'Estádio de Guadalajara', 'Guadalajara', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000065', 65, '400021479', 'Egito', 'RI do Irã', NULL, NULL, true, 'GROUP_STAGE', 'G', 3, '2026-06-27T00:00:00-03:00', 'Estádio de Seattle', 'Seattle', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000066', 66, '400021481', 'Nova Zelândia', 'Bélgica', NULL, NULL, true, 'GROUP_STAGE', 'G', 3, '2026-06-27T00:00:00-03:00', 'BC Place de Vancouver', 'Vancouver', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000067', 67, '400021508', 'Panamá', 'Inglaterra', NULL, NULL, true, 'GROUP_STAGE', 'L', 3, '2026-06-27T18:00:00-03:00', 'Estádio de Nova York/Nova Jersey', 'Nova Iorque', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000068', 68, '400021509', 'Croácia', 'Gana', NULL, NULL, true, 'GROUP_STAGE', 'L', 3, '2026-06-27T18:00:00-03:00', 'Estádio de Filadélfia', 'Filadélfia', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000069', 69, '400021505', 'Colômbia', 'Portugal', NULL, NULL, true, 'GROUP_STAGE', 'K', 3, '2026-06-27T20:30:00-03:00', 'Estádio de Miami', 'Miami', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000070', 70, '400021500', 'RD do Congo', 'Uzbequistão', NULL, NULL, true, 'GROUP_STAGE', 'K', 3, '2026-06-27T20:30:00-03:00', 'Estádio de Atlanta', 'Atlanta', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000071', 71, '400021497', 'Argélia', 'Áustria', NULL, NULL, true, 'GROUP_STAGE', 'J', 3, '2026-06-27T23:00:00-03:00', 'Estádio de Kansas City', 'Kansas City', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000072', 72, '400021495', 'Jordânia', 'Argentina', NULL, NULL, true, 'GROUP_STAGE', 'J', 3, '2026-06-27T23:00:00-03:00', 'Estádio de Dallas', 'Dallas', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000073', 73, '400021518', NULL, NULL, '2A', '2B', false, 'ROUND_OF_32', NULL, NULL, '2026-06-28T16:00:00-03:00', 'Estádio de Los Angeles', 'Los Angeles', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000074', 74, '400021516', NULL, NULL, '1C', '2F', false, 'ROUND_OF_32', NULL, NULL, '2026-06-29T14:00:00-03:00', 'Estádio de Houston', 'Houston', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000075', 75, '400021513', NULL, NULL, '1E', '3ABCDF', false, 'ROUND_OF_32', NULL, NULL, '2026-06-29T17:30:00-03:00', 'Estádio de Boston', 'Boston', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000076', 76, '400021522', NULL, NULL, '1F', '2C', false, 'ROUND_OF_32', NULL, NULL, '2026-06-29T22:00:00-03:00', 'Estádio de Monterrey', 'Monterrey', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000077', 77, '400021514', NULL, NULL, '2E', '2I', false, 'ROUND_OF_32', NULL, NULL, '2026-06-30T14:00:00-03:00', 'Estádio de Dallas', 'Dallas', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000078', 78, '400021523', NULL, NULL, '1I', '3CDFGH', false, 'ROUND_OF_32', NULL, NULL, '2026-06-30T18:00:00-03:00', 'Estádio de Nova York/Nova Jersey', 'Nova Iorque', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000079', 79, '400021520', NULL, NULL, '1A', '3CEFHI', false, 'ROUND_OF_32', NULL, NULL, '2026-06-30T22:00:00-03:00', 'Estádio da Cidade do México', 'Cidade do México', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000080', 80, '400021512', NULL, NULL, '1L', '3EHIJK', false, 'ROUND_OF_32', NULL, NULL, '2026-07-01T13:00:00-03:00', 'Estádio de Atlanta', 'Atlanta', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000081', 81, '400021525', NULL, NULL, '1G', '3AEHIJ', false, 'ROUND_OF_32', NULL, NULL, '2026-07-01T17:00:00-03:00', 'Estádio de Seattle', 'Seattle', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000082', 82, '400021524', NULL, NULL, '1D', '3BEFIJ', false, 'ROUND_OF_32', NULL, NULL, '2026-07-01T21:00:00-03:00', 'Estádio da Baía de São Francisco', 'Área da baía de São Francisco', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000083', 83, '400021519', NULL, NULL, '1H', '2J', false, 'ROUND_OF_32', NULL, NULL, '2026-07-02T16:00:00-03:00', 'Estádio de Los Angeles', 'Los Angeles', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000084', 84, '400021526', NULL, NULL, '2K', '2L', false, 'ROUND_OF_32', NULL, NULL, '2026-07-02T20:00:00-03:00', 'Estádio de Toronto', 'Toronto', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000085', 85, '400021527', NULL, NULL, '1B', '3EFGIJ', false, 'ROUND_OF_32', NULL, NULL, '2026-07-03T00:00:00-03:00', 'BC Place de Vancouver', 'Vancouver', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000086', 86, '400021515', NULL, NULL, '2D', '2G', false, 'ROUND_OF_32', NULL, NULL, '2026-07-03T15:00:00-03:00', 'Estádio de Dallas', 'Dallas', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000087', 87, '400021521', NULL, NULL, '1J', '2H', false, 'ROUND_OF_32', NULL, NULL, '2026-07-03T19:00:00-03:00', 'Estádio de Miami', 'Miami', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000088', 88, '400021517', NULL, NULL, '1K', '3DEIJL', false, 'ROUND_OF_32', NULL, NULL, '2026-07-03T22:30:00-03:00', 'Estádio de Kansas City', 'Kansas City', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000089', 89, '400021530', NULL, NULL, 'W73', 'W75', false, 'ROUND_OF_16', NULL, NULL, '2026-07-04T14:00:00-03:00', 'Estádio de Houston', 'Houston', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000090', 90, '400021533', NULL, NULL, 'W74', 'W77', false, 'ROUND_OF_16', NULL, NULL, '2026-07-04T18:00:00-03:00', 'Estádio de Filadélfia', 'Filadélfia', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000091', 91, '400021532', NULL, NULL, 'W76', 'W78', false, 'ROUND_OF_16', NULL, NULL, '2026-07-05T17:00:00-03:00', 'Estádio de Nova York/Nova Jersey', 'Nova Iorque', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000092', 92, '400021531', NULL, NULL, 'W79', 'W80', false, 'ROUND_OF_16', NULL, NULL, '2026-07-05T21:00:00-03:00', 'Estádio da Cidade do México', 'Cidade do México', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000093', 93, '400021529', NULL, NULL, 'W83', 'W84', false, 'ROUND_OF_16', NULL, NULL, '2026-07-06T16:00:00-03:00', 'Estádio de Dallas', 'Dallas', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000094', 94, '400021534', NULL, NULL, 'W81', 'W82', false, 'ROUND_OF_16', NULL, NULL, '2026-07-06T21:00:00-03:00', 'Estádio de Seattle', 'Seattle', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000095', 95, '400021528', NULL, NULL, 'W86', 'W88', false, 'ROUND_OF_16', NULL, NULL, '2026-07-07T13:00:00-03:00', 'Estádio de Atlanta', 'Atlanta', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000096', 96, '400021535', NULL, NULL, 'W85', 'W87', false, 'ROUND_OF_16', NULL, NULL, '2026-07-07T17:00:00-03:00', 'BC Place de Vancouver', 'Vancouver', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000097', 97, '400021536', NULL, NULL, 'W89', 'W90', false, 'QUARTER_FINALS', NULL, NULL, '2026-07-09T17:00:00-03:00', 'Estádio de Boston', 'Boston', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000098', 98, '400021538', NULL, NULL, 'W93', 'W94', false, 'QUARTER_FINALS', NULL, NULL, '2026-07-10T16:00:00-03:00', 'Estádio de Los Angeles', 'Los Angeles', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000099', 99, '400021539', NULL, NULL, 'W91', 'W92', false, 'QUARTER_FINALS', NULL, NULL, '2026-07-11T18:00:00-03:00', 'Estádio de Miami', 'Miami', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000100', 100, '400021537', NULL, NULL, 'W95', 'W96', false, 'QUARTER_FINALS', NULL, NULL, '2026-07-11T22:00:00-03:00', 'Estádio de Kansas City', 'Kansas City', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000101', 101, '400021541', NULL, NULL, 'W97', 'W98', false, 'SEMI_FINALS', NULL, NULL, '2026-07-14T16:00:00-03:00', 'Estádio de Dallas', 'Dallas', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000102', 102, '400021540', NULL, NULL, 'W99', 'W100', false, 'SEMI_FINALS', NULL, NULL, '2026-07-15T16:00:00-03:00', 'Estádio de Atlanta', 'Atlanta', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000103', 103, '400021542', NULL, NULL, 'RU101', 'RU102', false, 'THIRD_PLACE_MATCH', NULL, NULL, '2026-07-18T18:00:00-03:00', 'Estádio de Miami', 'Miami', 'SCHEDULED', NOW(), NOW()),
  ('c2026match00000000000000000104', 104, '400021543', NULL, NULL, 'W101', 'W102', false, 'FINAL', NULL, NULL, '2026-07-19T16:00:00-03:00', 'Estádio de Nova York/Nova Jersey', 'Nova Iorque', 'SCHEDULED', NOW(), NOW());

ALTER TABLE "Match"
  ALTER COLUMN "matchNumber" SET NOT NULL,
  ALTER COLUMN "fifaMatchId" SET NOT NULL,
  ALTER COLUMN "venue" SET NOT NULL,
  ALTER COLUMN "hostCity" SET NOT NULL;

CREATE UNIQUE INDEX "Match_matchNumber_key" ON "Match"("matchNumber");
CREATE UNIQUE INDEX "Match_fifaMatchId_key" ON "Match"("fifaMatchId");
CREATE INDEX "Match_groupCode_groupRound_idx" ON "Match"("groupCode", "groupRound");

ALTER TABLE "Match"
  ADD CONSTRAINT "Match_result_status_check" CHECK (
    ("status" = 'SCHEDULED' AND "teamAScore" IS NULL AND "teamBScore" IS NULL AND "advancingTeam" IS NULL)
    OR ("status" = 'STARTED' AND "advancingTeam" IS NULL AND (
      ("teamAScore" IS NULL AND "teamBScore" IS NULL)
      OR ("teamAScore" BETWEEN 0 AND 99 AND "teamBScore" BETWEEN 0 AND 99)
    ))
    OR ("status" = 'FINISHED' AND "teamAScore" BETWEEN 0 AND 99 AND "teamBScore" BETWEEN 0 AND 99)
  ),
  ADD CONSTRAINT "Match_fixture_structure_check" CHECK (
    (
      "stage" = 'GROUP_STAGE'
      AND "groupCode" IS NOT NULL
      AND "groupRound" BETWEEN 1 AND 3
      AND "teamASlot" IS NULL
      AND "teamBSlot" IS NULL
      AND "teamA" IS NOT NULL
      AND "teamB" IS NOT NULL
      AND "participantsConfirmed" = true
      AND "advancingTeam" IS NULL
    )
    OR (
      "stage" <> 'GROUP_STAGE'
      AND "groupCode" IS NULL
      AND "groupRound" IS NULL
      AND "teamASlot" IS NOT NULL
      AND "teamBSlot" IS NOT NULL
    )
  ),
  ADD CONSTRAINT "Match_confirmed_participants_check" CHECK (
    "participantsConfirmed" = false OR ("teamA" IS NOT NULL AND "teamB" IS NOT NULL)
  ),
  ADD CONSTRAINT "Match_knockout_advancing_team_check" CHECK (
    "stage" = 'GROUP_STAGE'
    OR "status" <> 'FINISHED'
    OR (
      "advancingTeam" IS NOT NULL
      AND "advancingTeam" IN ("teamA", "teamB")
      AND (
        "teamAScore" = "teamBScore"
        OR ("teamAScore" > "teamBScore" AND "advancingTeam" = "teamA")
        OR ("teamBScore" > "teamAScore" AND "advancingTeam" = "teamB")
      )
    )
  );
