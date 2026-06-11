import { pathToFileURL } from "node:url";

const DEFAULT_SYNC_INTERVAL_MS = 60_000;

export function readScoreSyncWorkerConfig(environment = process.env) {
  const url = environment.MATCH_SYNC_URL;
  const secret = environment.MATCH_SYNC_SECRET;

  if (!url) {
    throw new Error("MATCH_SYNC_URL is required");
  }

  if (!secret) {
    throw new Error("MATCH_SYNC_SECRET is required");
  }

  return { url, secret };
}

export async function runScoreSyncTick({
  url,
  secret,
  fetchImpl = fetch,
  logger = console,
}) {
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + secret,
      },
    });

    if (!response.ok) {
      logger.error(`match sync request failed with HTTP ${response.status}`);
      return { ok: false, status: response.status };
    }

    return { ok: true, status: response.status };
  } catch (error) {
    logger.error(safeErrorMessage(error, secret));
    return { ok: false, status: null };
  }
}

export function startScoreSyncWorker({
  environment = process.env,
  fetchImpl = fetch,
  logger = console,
  setIntervalImpl = setInterval,
  intervalMs = DEFAULT_SYNC_INTERVAL_MS,
} = {}) {
  const config = readScoreSyncWorkerConfig(environment);
  const tick = () => {
    void runScoreSyncTick({ ...config, fetchImpl, logger });
  };

  tick();
  return setIntervalImpl(tick, intervalMs);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startScoreSyncWorker();
}

function safeErrorMessage(error, secret) {
  const message = error instanceof Error ? error.message : "match sync request failed";
  return secret ? message.replaceAll(secret, "[redacted]") : message;
}
