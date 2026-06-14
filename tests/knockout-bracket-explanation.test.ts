import { describe, expect, it } from "vitest";
import { buildKnockoutMatchExplanation } from "@/lib/knockout-bracket-explanation";
import type { KnockoutBracketSide } from "@/lib/knockout-bracket";

describe("buildKnockoutMatchExplanation", () => {
  it("explains fixed group position slots", () => {
    expect(
      buildKnockoutMatchExplanation(
        side("Brasil", "1A"),
        side("Argentina", "2B"),
      ),
    ).toBe(
      "Brasil: seleção definida como 1º colocado do Grupo A. Argentina: seleção definida como 2º colocado do Grupo B.",
    );
  });

  it("explains third-place matrix slots", () => {
    expect(
      buildKnockoutMatchExplanation(
        side(null, "3ABCDF"),
        side("França", "3CEFHI", true),
      ),
    ).toBe(
      "A definir: vaga do 3º colocado vindo de um dos grupos A, B, C, D ou F, conforme matriz oficial. França: projeção pela classificação atual para 3º colocado vindo de um dos grupos C, E, F, H ou I, conforme matriz oficial.",
    );
  });

  it("explains previous knockout match winner and runner-up slots", () => {
    expect(
      buildKnockoutMatchExplanation(
        side(null, "W89"),
        side(null, "RU101"),
      ),
    ).toBe(
      "A definir: vaga do vencedor do Jogo 89. A definir: vaga do perdedor do Jogo 101.",
    );
  });

  it("falls back when the slot format is unknown", () => {
    expect(
      buildKnockoutMatchExplanation(
        side("Espanha", null),
        side(null, null),
      ),
    ).toBe(
      "Espanha: seleção definida nesta posição. A definir: origem ainda não definida.",
    );
  });
});

function side(
  team: string | null,
  slot: string | null,
  projected = false,
): KnockoutBracketSide {
  return { team, slot, projected };
}
