import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { teamFlagPath } from "@/lib/team-flags";

const OFFICIAL_TEAMS = [
  "Alemanha",
  "Argentina",
  "Argélia",
  "Arábia Saudita",
  "Austrália",
  "Bélgica",
  "Bósnia e Herzegovina",
  "Brasil",
  "Cabo Verde",
  "Canadá",
  "Catar",
  "Colômbia",
  "Costa do Marfim",
  "Croácia",
  "Curaçau",
  "Egito",
  "Equador",
  "Escócia",
  "Espanha",
  "EUA",
  "França",
  "Gana",
  "Haiti",
  "Holanda",
  "Inglaterra",
  "Iraque",
  "Japão",
  "Jordânia",
  "Marrocos",
  "México",
  "Noruega",
  "Nova Zelândia",
  "Panamá",
  "Paraguai",
  "Portugal",
  "RD do Congo",
  "RI do Irã",
  "República da Coreia",
  "Senegal",
  "Suécia",
  "Suíça",
  "Tchéquia",
  "Tunísia",
  "Turquia",
  "Uruguai",
  "Uzbequistão",
  "África do Sul",
  "Áustria",
];

describe("teamFlagPath", () => {
  it("maps every official group-stage team to an existing public flag", () => {
    for (const team of OFFICIAL_TEAMS) {
      const path = teamFlagPath(team);
      expect(path, team).not.toBeNull();
      expect(
        existsSync(new URL(`../public${path}`, import.meta.url)),
        `${team}: ${path}`,
      ).toBe(true);
    }
  });

  it("does not display a flag for unresolved tournament slots", () => {
    expect(teamFlagPath(null)).toBeNull();
    expect(teamFlagPath("W101")).toBeNull();
  });
});
