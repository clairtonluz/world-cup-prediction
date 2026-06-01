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

function countStage(stage: string) {
  return fixtureRows.filter((line) => line.includes(`'${stage}'`)).length;
}
