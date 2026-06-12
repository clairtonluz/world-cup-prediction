import { describe, expect, it } from "vitest";
import {
  calculateRanking,
  type RankingContext,
  type RankingParticipant,
} from "@/lib/ranking";

const pendingTournament: RankingContext = {
  officialChampion: null,
  revealPredictedChampion: false,
};

describe("calculateRanking", () => {
  it("orders supplied participants consistently while sharing a true tied position", () => {
    const ranking = calculateRanking(
      [
        participant({ id: "friend", name: "Bruna" }),
        participant({ id: "current", name: "Ana" }),
      ],
      "current",
      pendingTournament,
    );

    expect(ranking.rows.map((row) => row.id)).toEqual(["current", "friend"]);
    expect(ranking.rows.map((row) => row.position)).toEqual([1, 1]);
    expect(ranking.currentUser?.position).toBe(1);
  });

  it("includes members with no scored predictions and marks live rankings provisional", () => {
    const zero = participant({ id: "zero", name: "Sem aposta", points: 0 });
    zero.predictions = [];
    const live = participant({ id: "live", name: "Ao vivo", points: 3, status: "STARTED" });

    const ranking = calculateRanking([zero, live], "zero", pendingTournament);

    expect(ranking.provisional).toBe(true);
    expect(ranking.rows[1]).toMatchObject({ id: "zero", totalPoints: 0 });
  });

  it("counts a correctly predicted draw as a correct result", () => {
    const ranking = calculateRanking(
      [
        participant({
          id: "draw",
          name: "Empate",
          teamAScore: 1,
          teamBScore: 1,
          actualTeamAScore: 2,
          actualTeamBScore: 2,
        }),
      ],
      "draw",
      pendingTournament,
    );

    expect(ranking.rows[0]).toMatchObject({
      exactPredictions: 0,
      correctResults: 1,
    });
  });

  it("counts correct knockout qualifiers only in eligible advancing rounds", () => {
    const ranking = calculateRanking(
      [
        participant({
          id: "qualifier",
          name: "Classificado",
          stage: "ROUND_OF_32",
          predictedAdvancingTeam: "Brasil",
          advancingTeam: "Brasil",
        }),
        participant({
          id: "final",
          name: "Final",
          stage: "FINAL",
          predictedAdvancingTeam: "Brasil",
          advancingTeam: "Brasil",
        }),
      ],
      "qualifier",
      pendingTournament,
    );

    expect(ranking.rows.find((row) => row.id === "qualifier")?.correctAdvancingTeams).toBe(1);
    expect(ranking.rows.find((row) => row.id === "final")?.correctAdvancingTeams).toBe(0);
  });

  it("awards champion points after the final and keeps champion as a tie breaker", () => {
    const context = { officialChampion: "Brasil", revealPredictedChampion: true };
    const ranking = calculateRanking(
      [
        participant({
          id: "champion",
          name: "Campeao",
          points: 0,
          predictedChampion: "Brasil",
        }),
        participant({
          id: "points",
          name: "Pontos",
          points: 200,
          predictedChampion: "Argentina",
        }),
      ],
      "champion",
      context,
    );

    expect(ranking.rows.map((row) => row.id)).toEqual(["champion", "points"]);
    expect(ranking.rows[0]).toMatchObject({
      totalPoints: 200,
      championBonusPoints: 200,
      championPredictionCorrect: true,
    });

    const beforeFinal = calculateRanking(
      [participant({ id: "champion", name: "Campeao", predictedChampion: "Brasil" })],
      "champion",
      pendingTournament,
    );
    expect(beforeFinal.rows[0].championBonusPoints).toBe(0);
  });

  it("hides champion predictions until the champion deadline closes", () => {
    const entry = participant({ id: "current", name: "Ana", predictedChampion: "Brasil" });

    expect(calculateRanking([entry], "current", pendingTournament).rows[0].predictedChampion).toBeNull();
    expect(
      calculateRanking([entry], "current", {
        officialChampion: null,
        revealPredictedChampion: true,
      }).rows[0].predictedChampion,
    ).toBe("Brasil");
  });

  it("summarizes champion favorites without revealing individual choices", () => {
    const ranking = calculateRanking(
      [
        participant({ id: "ana", name: "Ana", predictedChampion: "Brasil" }),
        participant({ id: "bia", name: "Bia", predictedChampion: "Brasil" }),
        participant({ id: "caio", name: "Caio", predictedChampion: "Argentina" }),
        participant({ id: "duda", name: "Duda", predictedChampion: null }),
      ],
      "ana",
      pendingTournament,
    );

    expect(ranking.championFavorites).toEqual([
      { team: "Brasil", predictionCount: 2, percentage: 67 },
      { team: "Argentina", predictionCount: 1, percentage: 33 },
    ]);
    expect(ranking.rows.map((row) => row.predictedChampion)).toEqual([
      null,
      null,
      null,
      null,
    ]);
  });

  it("orders tied champion favorites by team name", () => {
    const ranking = calculateRanking(
      [
        participant({ id: "arg", name: "Ana", predictedChampion: "Argentina" }),
        participant({ id: "bra", name: "Bia", predictedChampion: "Brasil" }),
      ],
      "arg",
      pendingTournament,
    );

    expect(ranking.championFavorites.map((favorite) => favorite.team)).toEqual([
      "Argentina",
      "Brasil",
    ]);
  });
});

function participant({
  id,
  name,
  points = 10,
  predictedChampion = null,
  teamAScore = 1,
  teamBScore = 0,
  actualTeamAScore = teamAScore,
  actualTeamBScore = teamBScore,
  stage = "GROUP_STAGE",
  status = "FINISHED",
  predictedAdvancingTeam = null,
  advancingTeam = null,
}: {
  id: string;
  name: string;
  points?: number;
  predictedChampion?: string | null;
  teamAScore?: number;
  teamBScore?: number;
  actualTeamAScore?: number;
  actualTeamBScore?: number;
  stage?: string;
  status?: string;
  predictedAdvancingTeam?: string | null;
  advancingTeam?: string | null;
}): RankingParticipant {
  return {
    id,
    name,
    image: null,
    predictedChampion,
    predictions: [
      {
        teamAScore,
        teamBScore,
        predictedAdvancingTeam,
        points,
        match: {
          stage,
          status,
          teamAScore: actualTeamAScore,
          teamBScore: actualTeamBScore,
          advancingTeam,
        },
      },
    ],
  };
}
