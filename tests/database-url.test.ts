import { describe, expect, it } from "vitest";
import { resolveDatabaseUrl } from "@/lib/database-url";

describe("resolveDatabaseUrl", () => {
  it("builds a safe URL from PostgreSQL environment values", () => {
    expect(
      resolveDatabaseUrl({
        POSTGRES_DB: "cup/predictions",
        POSTGRES_USER: "world@cup",
        POSTGRES_PASSWORD: "p@ss:word/#%?",
        POSTGRES_PORT: "5544",
      }),
    ).toBe(
      "postgresql://world%40cup:p%40ss%3Aword%2F%23%25%3F@localhost:5544/cup%2Fpredictions?schema=public&options=-c%20TimeZone%3DUTC",
    );
  });

  it("uses the Docker hostname when configured by Compose", () => {
    expect(
      resolveDatabaseUrl({
        POSTGRES_PASSWORD: "password",
        POSTGRES_HOST: "database",
        POSTGRES_PORT: "5432",
      }),
    ).toBe(
      "postgresql://world_cup:password@database:5432/world_cup_predictor?schema=public&options=-c%20TimeZone%3DUTC",
    );
  });

  it("normalizes an explicit connection URL override to use UTC sessions", () => {
    const connectionUrl = "postgresql://external.example/database?schema=private";

    expect(resolveDatabaseUrl({ DATABASE_URL: connectionUrl })).toBe(
      "postgresql://external.example/database?schema=private&options=-c+TimeZone%3DUTC",
    );
  });

  it("appends UTC after existing explicit connection URL session timezone options", () => {
    const connectionUrl =
      "postgresql://external.example/database?schema=private&options=-c+TimeZone%3DAmerica%2FFortaleza";

    expect(resolveDatabaseUrl({ DATABASE_URL: connectionUrl })).toBe(
      "postgresql://external.example/database?schema=private&options=-c+TimeZone%3DAmerica%2FFortaleza+-c+TimeZone%3DUTC",
    );
  });

  it("rejects malformed derived network configuration", () => {
    expect(() =>
      resolveDatabaseUrl({ POSTGRES_PASSWORD: "password", POSTGRES_PORT: "invalid" }),
    ).toThrow("POSTGRES_PORT must be a valid TCP port");
  });
});
