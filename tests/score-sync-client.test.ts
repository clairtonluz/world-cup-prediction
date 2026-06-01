import { beforeEach, describe, expect, it, vi } from "vitest";
import { EspnScoreboardRequestError, fetchEspnScoreboard } from "@/lib/score-sync/client";

vi.mock("server-only", () => ({}));

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("fetchEspnScoreboard", () => {
  it("parses scheduled World Cup events", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({
      events: [
        {
          id: "760415",
          date: "2026-06-11T19:00Z",
          status: { type: { state: "pre", completed: false } },
          competitions: [
            {
              competitors: [
                competitor("home", "Mexico", "0"),
                competitor("away", "South Africa", "0"),
              ],
            },
          ],
        },
      ],
    })));

    const events = await fetchEspnScoreboard("20260611");

    expect(events).toHaveLength(1);
    expect(events[0].id).toBe("760415");
    expect(events[0].status.type.state).toBe("pre");
  });

  it("parses completed penalty shootout events", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({
      events: [
        {
          id: "633850",
          date: "2022-12-18T15:00Z",
          status: { type: { state: "post", completed: true, name: "STATUS_FINAL_PEN" } },
          competitions: [
            {
              competitors: [
                competitor("home", "Argentina", "3", true),
                competitor("away", "France", "3", false),
              ],
            },
          ],
        },
      ],
    })));

    const events = await fetchEspnScoreboard("20221218");

    expect(events[0].status.type.completed).toBe(true);
    expect(events[0].competitions[0].competitors[0].winner).toBe(true);
  });

  it("rejects invalid scoreboard responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ events: [{ id: "" }] })));

    await expect(fetchEspnScoreboard("20260611")).rejects.toBeInstanceOf(
      EspnScoreboardRequestError,
    );
  });
});

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function competitor(homeAway: string, displayName: string, score: string, winner?: boolean) {
  return {
    homeAway,
    score,
    winner,
    team: { displayName },
  };
}
