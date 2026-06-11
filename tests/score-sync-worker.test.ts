import { describe, expect, it, vi } from "vitest";
import {
  readScoreSyncWorkerConfig,
  runScoreSyncTick,
} from "../scripts/score-sync-worker.mjs";

describe("score sync worker", () => {
  it("sends the sync secret as a bearer token from the environment", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const config = readScoreSyncWorkerConfig({
      MATCH_SYNC_URL: "http://app:3000/api/integrations/score-sync/sync",
      MATCH_SYNC_SECRET: "secret-token",
    });

    const result = await runScoreSyncTick({ ...config, fetchImpl });

    expect(result).toEqual({ ok: true, status: 200 });
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://app:3000/api/integrations/score-sync/sync",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer secret-token",
        },
      },
    );
  });

  it("logs non-OK responses without exposing the sync secret", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    const logger = { error: vi.fn() };

    const result = await runScoreSyncTick({
      url: "http://app:3000/api/integrations/score-sync/sync",
      secret: "secret-token",
      fetchImpl,
      logger,
    });

    expect(result).toEqual({ ok: false, status: 401 });
    expect(logger.error).toHaveBeenCalledWith("match sync request failed with HTTP 401");
    expect(logger.error.mock.calls.flat().join(" ")).not.toContain("secret-token");
  });

  it("redacts the sync secret from network error logs", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("failed for secret-token"));
    const logger = { error: vi.fn() };

    const result = await runScoreSyncTick({
      url: "http://app:3000/api/integrations/score-sync/sync",
      secret: "secret-token",
      fetchImpl,
      logger,
    });

    expect(result).toEqual({ ok: false, status: null });
    expect(logger.error).toHaveBeenCalledWith("failed for [redacted]");
  });
});
