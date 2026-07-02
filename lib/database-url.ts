const DEFAULT_DATABASE_HOST = "localhost";
const DEFAULT_DATABASE_PORT = "5432";
const DEFAULT_DATABASE_NAME = "world_cup_predictor";
const DEFAULT_DATABASE_USER = "world_cup";
const DATABASE_HOST_PATTERN = /^[a-zA-Z0-9.-]+$/;
// Prisma's pg adapter normalizes TIMESTAMPTZ text as UTC, so keep sessions in UTC.
const UTC_SESSION_TIME_ZONE_OPTION = "-c TimeZone=UTC";

export function resolveDatabaseUrl(environment: NodeJS.ProcessEnv = process.env) {
  if (environment.DATABASE_URL) {
    return withUtcSessionTimeZone(environment.DATABASE_URL);
  }

  const password = environment.POSTGRES_PASSWORD;
  if (!password) {
    throw new Error("Set DATABASE_URL or POSTGRES_PASSWORD");
  }

  const host = environment.POSTGRES_HOST ?? DEFAULT_DATABASE_HOST;
  const port = environment.POSTGRES_PORT ?? DEFAULT_DATABASE_PORT;
  const database = environment.POSTGRES_DB ?? DEFAULT_DATABASE_NAME;
  const user = environment.POSTGRES_USER ?? DEFAULT_DATABASE_USER;

  if (!DATABASE_HOST_PATTERN.test(host)) {
    throw new Error("POSTGRES_HOST must be a hostname; use DATABASE_URL for other connection formats");
  }

  if (!isValidPort(port)) {
    throw new Error("POSTGRES_PORT must be a valid TCP port");
  }

  return [
    "postgresql://",
    encodeURIComponent(user),
    ":",
    encodeURIComponent(password),
    "@",
    host,
    ":",
    port,
    "/",
    encodeURIComponent(database),
    "?schema=public",
  ].join("") + `&options=${encodeURIComponent(UTC_SESSION_TIME_ZONE_OPTION)}`;
}

function isValidPort(port: string) {
  if (!/^\d+$/.test(port)) {
    return false;
  }

  const numericPort = Number(port);
  return numericPort >= 1 && numericPort <= 65535;
}

function withUtcSessionTimeZone(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const existingOptions = url.searchParams.get("options");

  if (existingOptions?.toLowerCase().includes("timezone=utc")) {
    return url.toString();
  }

  url.searchParams.set(
    "options",
    existingOptions
      ? `${existingOptions} ${UTC_SESSION_TIME_ZONE_OPTION}`
      : UTC_SESSION_TIME_ZONE_OPTION,
  );

  return url.toString();
}
