import { describe, expect, it } from "vitest";
import { calculateRanking, type RankingParticipant } from "@/lib/ranking";

describe("calculateRanking", () => {
  it("orders only supplied participants using the shared tie breakers", () => {
    const ranking = calculateRanking(
      [
        participant("friend", "Bruna", 10, 1, 0),
        participant("outsider", "Global leader", 100, 4, 0),
        participant("current", "Ana", 10, 1, 0),
      ].filter((row) => row.id !== "outsider"),
      "current",
    );

    expect(ranking.rows.map((row) => row.id)).toEqual(["current", "friend"]);
    expect(ranking.currentUser?.position).toBe(1);
  });

  it("includes members with no scored predictions and marks live rankings provisional", () => {
    const zero = participant("zero", "Sem aposta", 0, 0, 0);
    zero.predictions = [];
    const live = participant("live", "Ao vivo", 3, 0, 0, "STARTED");

    const ranking = calculateRanking([zero, live], "zero");

    expect(ranking.provisional).toBe(true);
    expect(ranking.rows[1]).toMatchObject({ id: "zero", totalPoints: 0 });
  });
});

function participant(
  id: string,
  name: string,
  points: number,
  teamAScore: number,
  teamBScore: number,
  status = "FINISHED",
): RankingParticipant {
  return {
    id,
    name,
    image: null,
    predictions: [
      {
        teamAScore,
        teamBScore,
        points,
        match: {
          stage: "GROUP_STAGE",
          status,
          teamAScore,
          teamBScore,
        },
      },
    ],
  };
}
