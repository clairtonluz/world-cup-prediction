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
      "postgresql://world%40cup:p%40ss%3Aword%2F%23%25%3F@localhost:5544/cup%2Fpredictions?schema=public",
    );
  });

  it("uses the Docker hostname when configured by Compose", () => {
    expect(
      resolveDatabaseUrl({
        POSTGRES_PASSWORD: "password",
        POSTGRES_HOST: "database",
        POSTGRES_PORT: "5432",
      }),
    ).toBe("postgresql://world_cup:password@database:5432/world_cup_predictor?schema=public");
  });

  it("allows an explicit connection URL override", () => {
    const connectionUrl = "postgresql://external.example/database?schema=private";

    expect(resolveDatabaseUrl({ DATABASE_URL: connectionUrl })).toBe(connectionUrl);
  });

  it("rejects malformed derived network configuration", () => {
    expect(() =>
      resolveDatabaseUrl({ POSTGRES_PASSWORD: "password", POSTGRES_PORT: "invalid" }),
    ).toThrow("POSTGRES_PORT must be a valid TCP port");
  });
});
