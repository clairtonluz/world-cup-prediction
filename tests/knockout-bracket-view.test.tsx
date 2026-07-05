// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STAGE_LABELS } from "@/lib/constants";
import { KnockoutBracketView } from "@/components/bracket/knockout-bracket-view";
import type {
  KnockoutBracket,
  KnockoutBracketMatch,
  KnockoutBracketStage,
  KnockoutStageValue,
} from "@/lib/knockout-bracket";

vi.mock("@/components/shared/team-label", () => ({
  TeamLabel({
    team,
    slot,
  }: {
    team: string | null;
    slot?: string | null;
  }) {
    return <span>{team ?? slot ?? "A definir"}</span>;
  },
}));

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: vi.fn(function showModal(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    }),
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: vi.fn(function close(this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    }),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("KnockoutBracketView", () => {
  it("filters the bracket from the selected phase onward", async () => {
    const user = userEvent.setup();

    render(<KnockoutBracketView bracket={bracket()} />);

    expect(matchButtons(73)).not.toHaveLength(0);

    await user.click(
      screen.getByRole("button", {
        name: `Filtrar a partir de ${STAGE_LABELS.QUARTER_FINALS}`,
      }),
    );

    expect(matchButtons(73)).toHaveLength(0);
    expect(matchButtons(97)).not.toHaveLength(0);
  });

  it("opens match details in a modal and links to the match page", async () => {
    const user = userEvent.setup();

    render(<KnockoutBracketView bracket={bracket()} />);

    await user.click(matchButtons(73)[0]);

    const dialog = await screen.findByRole("dialog", {
      name: /Brasil x Argentina/,
    });

    expect(within(dialog).getByText("Meu palpite")).toBeDefined();
    expect(within(dialog).getByText("2 x 1")).toBeDefined();
    expect(within(dialog).getByText("8 pts")).toBeDefined();
    expect(within(dialog).getByText("Cidade - Estádio")).toBeDefined();
    expect(
      within(dialog).getByText(/seleção definida como 1º colocado do Grupo A/i),
    ).toBeDefined();
    expect(
      within(dialog).getByRole("link", { name: "Ver jogo" }).getAttribute("href"),
    ).toBe("/matches/match-73");

    await user.click(within(dialog).getByRole("button", { name: "Fechar" }));

    await waitFor(() => {
      expect(screen.queryByText("Meu palpite")).toBeNull();
    });
  });
});

function matchButtons(matchNumber: number) {
  return screen.queryAllByRole("button", {
    name: new RegExp(`Abrir detalhes do jogo ${matchNumber}`),
  });
}

function bracket(): KnockoutBracket {
  return {
    stages: [
      stage("ROUND_OF_32", [
        match({
          matchNumber: 73,
          teamA: { team: "Brasil", slot: "1A", projected: false },
          teamB: { team: "Argentina", slot: "2B", projected: false },
          status: "FINISHED",
          teamAScore: 2,
          teamBScore: 1,
          advancingTeam: "Brasil",
          prediction: {
            teamAScore: 2,
            teamBScore: 1,
            predictedAdvancingTeam: "Brasil",
            points: 8,
          },
        }),
        match({ matchNumber: 74 }),
      ]),
      stage("ROUND_OF_16", [match({ matchNumber: 89, sourceMatchNumbers: [73, 74] })]),
      stage("QUARTER_FINALS", [match({ matchNumber: 97, sourceMatchNumbers: [89, 90] })]),
      stage("SEMI_FINALS", [match({ matchNumber: 101, sourceMatchNumbers: [97, 98] })]),
      stage("FINAL", [match({ matchNumber: 104, sourceMatchNumbers: [101, 102] })]),
      stage("THIRD_PLACE_MATCH", [match({ matchNumber: 103, sourceMatchNumbers: [101, 102] })]),
    ],
    hasProjectedParticipants: false,
  };
}

function stage(
  stageValue: KnockoutStageValue,
  matches: KnockoutBracketMatch[],
): KnockoutBracketStage {
  return {
    stage: stageValue,
    label: STAGE_LABELS[stageValue],
    matches: matches.map((stageMatch) => ({ ...stageMatch, stage: stageValue })),
  };
}

function match(
  overrides: Partial<KnockoutBracketMatch> & { matchNumber: number },
): KnockoutBracketMatch {
  return {
    id: `match-${overrides.matchNumber}`,
    matchNumber: overrides.matchNumber,
    stage: "ROUND_OF_32",
    startsAt: new Date("2026-07-01T16:00:00Z"),
    venue: "Estádio",
    hostCity: "Cidade",
    status: "SCHEDULED",
    teamAScore: null,
    teamBScore: null,
    advancingTeam: null,
    participantsConfirmed: false,
    projected: false,
    sourceMatchNumbers: [],
    teamA: { team: null, slot: "1A", projected: false },
    teamB: { team: null, slot: "2B", projected: false },
    prediction: null,
    ...overrides,
  };
}
