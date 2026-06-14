import type { KnockoutBracketSide } from "@/lib/knockout-bracket";

export function buildKnockoutMatchExplanation(
  teamA: KnockoutBracketSide,
  teamB: KnockoutBracketSide,
) {
  return [explainParticipant(teamA), explainParticipant(teamB)].join(" ");
}

function explainParticipant(side: KnockoutBracketSide) {
  const origin = describeSlotOrigin(side.slot);

  if (!side.team) {
    return origin
      ? `A definir: vaga do ${origin}.`
      : "A definir: origem ainda não definida.";
  }

  if (!origin) {
    return side.projected
      ? `${side.team}: projeção pela classificação atual para esta posição.`
      : `${side.team}: seleção definida nesta posição.`;
  }

  return side.projected
    ? `${side.team}: projeção pela classificação atual para ${origin}.`
    : `${side.team}: seleção definida como ${origin}.`;
}

function describeSlotOrigin(slot: string | null) {
  if (!slot) {
    return "";
  }

  const fixedGroupSlot = slot.match(/^([12])([A-L])$/);
  if (fixedGroupSlot) {
    return `${fixedGroupSlot[1]}º colocado do Grupo ${fixedGroupSlot[2]}`;
  }

  const thirdPlaceSlot = slot.match(/^3([A-L]+)$/);
  if (thirdPlaceSlot) {
    return `3º colocado vindo de um dos grupos ${formatGroupList(thirdPlaceSlot[1].split(""))}, conforme matriz oficial`;
  }

  const knockoutSource = slot.match(/^(W|RU)(\d+)$/);
  if (knockoutSource) {
    const sourceLabel = knockoutSource[1] === "W" ? "vencedor" : "perdedor";
    return `${sourceLabel} do Jogo ${knockoutSource[2]}`;
  }

  return "";
}

function formatGroupList(groups: string[]) {
  if (groups.length <= 1) {
    return groups.join("");
  }

  return `${groups.slice(0, -1).join(", ")} ou ${groups[groups.length - 1]}`;
}
