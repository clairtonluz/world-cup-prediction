import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../prisma/migrations/20260526000000_official_2026_schedule/migration.sql",
    import.meta.url,
  ),
  "utf8",
);
const shiftStartTimesMigration = readFileSync(
  new URL(
    "../prisma/migrations/20260531000000_shift_match_start_times_forward_three_hours/migration.sql",
    import.meta.url,
  ),
  "utf8",
);
const undoShiftStartTimesMigration = readFileSync(
  new URL(
    "../prisma/migrations/20260601000000_undo_shift_match_start_times_forward_three_hours/migration.sql",
    import.meta.url,
  ),
  "utf8",
);
const futureKnockoutScheduleMigration = readFileSync(
  new URL(
    "../prisma/migrations/20260702103000_fix_future_knockout_schedule/migration.sql",
    import.meta.url,
  ),
  "utf8",
);
const reassertFutureKnockoutScheduleMigration = readFileSync(
  new URL(
    "../prisma/migrations/20260702120000_reassert_future_knockout_schedule/migration.sql",
    import.meta.url,
  ),
  "utf8",
);
const normalizeStartTimesUtcMigration = readFileSync(
  new URL(
    "../prisma/migrations/20260702130000_normalize_match_start_times_utc/migration.sql",
    import.meta.url,
  ),
  "utf8",
);
const fixtureRows = migration
  .split("\n")
  .filter((line) => line.trimStart().startsWith("('c2026match"));

describe("official 2026 fixture migration", () => {
  it("inserts the complete 104-match FIFA schedule by stage", () => {
    expect(fixtureRows).toHaveLength(104);
    expect(countStage("GROUP_STAGE")).toBe(72);
    expect(countStage("ROUND_OF_32")).toBe(16);
    expect(countStage("ROUND_OF_16")).toBe(8);
    expect(countStage("QUARTER_FINALS")).toBe(4);
    expect(countStage("SEMI_FINALS")).toBe(2);
    expect(countStage("THIRD_PLACE_MATCH")).toBe(1);
    expect(countStage("FINAL")).toBe(1);
  });

  it("contains twelve six-match groups with two matches in each round", () => {
    for (const group of "ABCDEFGHIJKL") {
      const groupRows = fixtureRows.filter((line) =>
        line.includes(`'GROUP_STAGE', '${group}',`),
      );
      expect(groupRows, `Grupo ${group}`).toHaveLength(6);
      for (const round of [1, 2, 3]) {
        expect(
          groupRows.filter((line) =>
            line.includes(`'GROUP_STAGE', '${group}', ${round},`),
          ),
          `Grupo ${group}, rodada ${round}`,
        ).toHaveLength(2);
      }
    }
  });

  it("keeps official sample fixtures, kickoffs and locations", () => {
    expect(fixtureRows[0]).toContain(
      "'400021443', 'México', 'África do Sul'",
    );
    expect(fixtureRows[0]).toContain(
      "'2026-06-11T16:00:00-03:00', 'Estádio da Cidade do México'",
    );
    expect(fixtureRows[72]).toContain(
      "'400021518', NULL, NULL, '2A', '2B'",
    );
    expect(fixtureRows[103]).toContain(
      "'2026-07-19T16:00:00-03:00', 'Estádio de Nova York/Nova Jersey'",
    );
  });
});

describe("match start time correction migration", () => {
  it("shifts every stored kickoff three hours forward without changing fixture data", () => {
    expect(shiftStartTimesMigration).toContain('UPDATE "Match"');
    expect(shiftStartTimesMigration).toContain(
      '"startsAt" = "startsAt" + INTERVAL \'3 hours\'',
    );
    expect(shiftStartTimesMigration).toContain('"updatedAt" = NOW()');
    expect(shiftStartTimesMigration).not.toContain('"teamA"');
    expect(shiftStartTimesMigration).not.toContain('"teamB"');
    expect(shiftStartTimesMigration).not.toContain('"teamAScore"');
    expect(shiftStartTimesMigration).not.toContain('"teamBScore"');
    expect(shiftStartTimesMigration).not.toContain('"status"');
    expect(shiftStartTimesMigration).not.toContain('"venue"');
    expect(shiftStartTimesMigration).not.toContain('"hostCity"');
    expect(shiftStartTimesMigration).not.toContain('"Prediction"');
  });

  it("undoes the three-hour kickoff shift without changing fixture data", () => {
    expect(undoShiftStartTimesMigration).toContain('UPDATE "Match"');
    expect(undoShiftStartTimesMigration).toContain(
      '"startsAt" = "startsAt" - INTERVAL \'3 hours\'',
    );
    expect(undoShiftStartTimesMigration).toContain('"updatedAt" = NOW()');
    expect(undoShiftStartTimesMigration).not.toContain('"teamA"');
    expect(undoShiftStartTimesMigration).not.toContain('"teamB"');
    expect(undoShiftStartTimesMigration).not.toContain('"teamAScore"');
    expect(undoShiftStartTimesMigration).not.toContain('"teamBScore"');
    expect(undoShiftStartTimesMigration).not.toContain('"status"');
    expect(undoShiftStartTimesMigration).not.toContain('"venue"');
    expect(undoShiftStartTimesMigration).not.toContain('"hostCity"');
    expect(undoShiftStartTimesMigration).not.toContain('"Prediction"');
  });
});

describe("future knockout schedule correction migration", () => {
  it.each([
    ["initial correction", futureKnockoutScheduleMigration],
    ["production reassertion", reassertFutureKnockoutScheduleMigration],
  ])("%s updates every future knockout match from 83 through 104", (_, migrationSql) => {
    const futureKnockoutRows = correctedFutureKnockoutRows(migrationSql);

    expect(futureKnockoutRows).toHaveLength(22);
    expect(futureKnockoutRows.map(matchNumberFromCorrectedRow)).toEqual(
      Array.from({ length: 22 }, (_, index) => index + 83),
    );
  });

  it.each([
    ["initial correction", futureKnockoutScheduleMigration],
    ["production reassertion", reassertFutureKnockoutScheduleMigration],
  ])("%s keeps the correction scoped to match schedule fields", (_, migrationSql) => {
    const updatedTables = [
      ...migrationSql.matchAll(/UPDATE "([^"]+)"/g),
    ].map((match) => match[1]);

    expect(updatedTables).toEqual(["Match", "Match"]);
    expect(migrationSql).not.toContain('"Prediction"');
    expect(migrationSql).not.toContain('"User"');
    expect(migrationSql).not.toContain('"teamAScore"');
    expect(migrationSql).not.toContain('"teamBScore"');
    expect(migrationSql).not.toContain('"advancingTeam"');
    expect(migrationSql).not.toMatch(/SET\s+"status"/);
  });

  it.each([
    ["initial correction", futureKnockoutScheduleMigration],
    ["production reassertion", reassertFutureKnockoutScheduleMigration],
  ])("%s contains the critical Brazil versus Norway correction", (_, migrationSql) => {
    expect(migrationSql).toContain(
      "(91, '400021532', '760504', 'Brasil', 'Noruega', 'W74', 'W77', true, '2026-07-05T17:00:00-03:00'::TIMESTAMPTZ",
    );
  });
});

describe("UTC match start time normalization migration", () => {
  it("contains an explicit UTC kickoff for every official match", () => {
    const rows = normalizedUtcRows(normalizeStartTimesUtcMigration);

    expect(rows).toHaveLength(104);
    expect(rows.map(matchNumberFromCorrectedRow)).toEqual(
      Array.from({ length: 104 }, (_, index) => index + 1),
    );
    for (const row of rows) {
      expect(row).toMatch(/'2026-[^']+Z'::TIMESTAMPTZ/);
    }
  });

  it("keeps the UTC normalization scoped to match start timestamps", () => {
    const updatedTables = [
      ...normalizeStartTimesUtcMigration.matchAll(/UPDATE "([^"]+)"/g),
    ].map((match) => match[1]);

    expect(updatedTables).toEqual(["Match"]);
    expect(normalizeStartTimesUtcMigration).not.toContain("+ INTERVAL");
    expect(normalizeStartTimesUtcMigration).not.toContain("- INTERVAL");
    expect(normalizeStartTimesUtcMigration).not.toContain('"Prediction"');
    expect(normalizeStartTimesUtcMigration).not.toContain('"User"');
    expect(normalizeStartTimesUtcMigration).not.toContain('"teamAScore"');
    expect(normalizeStartTimesUtcMigration).not.toContain('"teamBScore"');
    expect(normalizeStartTimesUtcMigration).not.toContain('"advancingTeam"');
    expect(normalizeStartTimesUtcMigration).not.toMatch(/SET\s+"status"/);
  });

  it("contains the critical UTC kickoff corrections", () => {
    expect(normalizeStartTimesUtcMigration).toContain(
      "(1, '2026-06-11T19:00:00Z'::TIMESTAMPTZ)",
    );
    expect(normalizeStartTimesUtcMigration).toContain(
      "(82, '2026-07-02T00:00:00Z'::TIMESTAMPTZ)",
    );
    expect(normalizeStartTimesUtcMigration).toContain(
      "(91, '2026-07-05T20:00:00Z'::TIMESTAMPTZ)",
    );
  });
});

function countStage(stage: string) {
  return fixtureRows.filter((line) => line.includes(`'${stage}'`)).length;
}

function correctedFutureKnockoutRows(migrationSql: string) {
  return migrationSql
    .split("\n")
    .filter((line) => /^\s+\(\d+, '400021/.test(line));
}

function matchNumberFromCorrectedRow(row: string) {
  return Number(row.match(/^\s+\((\d+),/)?.[1]);
}

function normalizedUtcRows(migrationSql: string) {
  const valuesTable = migrationSql.match(
    /FROM \(\n  VALUES\n(?<rows>[\s\S]*?)\n\) AS corrected_matches/,
  )?.groups?.rows;

  if (!valuesTable) {
    return [];
  }

  return valuesTable
    .split("\n")
    .filter((line) => /^\s+\(\d+, '2026-/.test(line));
}
