import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/integrations/score-sync/sync/route";

const mocks = vi.hoisted(() => ({
  runAutomaticScoreSync: vi.fn(),
  revalidateMatchResultViews: vi.fn(),
}));

vi.mock("@/lib/score-sync/sync", () => ({
  runAutomaticScoreSync: mocks.runAutomaticScoreSync,
}));
vi.mock("@/lib/match-result-revalidation", () => ({
  revalidateMatchResultViews: mocks.revalidateMatchResultViews,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("MATCH_SYNC_SECRET", "secret-token");
  mocks.runAutomaticScoreSync.mockResolvedValue({
    status: "completed",
    checkedMatches: 1,
    updatedMatches: 1,
    skippedMatches: 0,
    errors: [],
    remainingRequests: null,
  });
});

describe("score sync route", () => {
  it("rejects requests without the shared sync secret", async () => {
    const response = await POST(new Request("http://local.test/api") as never);

    expect(response.status).toBe(401);
    expect(mocks.runAutomaticScoreSync).not.toHaveBeenCalled();
  });

  it("runs sync and revalidates result views for authorized requests", async () => {
    const response = await POST(
      new Request("http://local.test/api", {
        method: "POST",
        headers: { authorization: "Bearer secret-token" },
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(mocks.runAutomaticScoreSync).toHaveBeenCalled();
    expect(mocks.revalidateMatchResultViews).toHaveBeenCalled();
  });
});
