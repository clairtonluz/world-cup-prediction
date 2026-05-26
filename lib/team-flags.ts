const TEAM_FLAG_CODES: Record<string, string> = {
  Alemanha: "GER",
  Argentina: "ARG",
  Argélia: "ALG",
  "Arábia Saudita": "KSA",
  Austrália: "AUS",
  Bélgica: "BEL",
  "Bósnia e Herzegovina": "BIH",
  Brasil: "BRA",
  "Cabo Verde": "CPV",
  Canadá: "CAN",
  Catar: "QAT",
  Colômbia: "COL",
  "Costa do Marfim": "CIV",
  Croácia: "CRO",
  Curaçau: "CUW",
  Egito: "EGY",
  Equador: "ECU",
  Escócia: "SCO",
  Espanha: "ESP",
  EUA: "USA",
  França: "FRA",
  Gana: "GHA",
  Haiti: "HAI",
  Holanda: "NED",
  Inglaterra: "ENG",
  Iraque: "IRQ",
  Japão: "JPN",
  Jordânia: "JOR",
  Marrocos: "MAR",
  México: "MEX",
  Noruega: "NOR",
  "Nova Zelândia": "NZL",
  Panamá: "PAN",
  Paraguai: "PAR",
  Portugal: "POR",
  "RD do Congo": "COD",
  "RI do Irã": "IRN",
  "República da Coreia": "KOR",
  Senegal: "SEN",
  Suécia: "SWE",
  Suíça: "SUI",
  Tchéquia: "CZE",
  Tunísia: "TUN",
  Turquia: "TUR",
  Uruguai: "URU",
  Uzbequistão: "UZB",
  "África do Sul": "RSA",
  Áustria: "AUT",
};

export function teamFlagPath(team: string | null) {
  if (!team) {
    return null;
  }

  const flagCode = TEAM_FLAG_CODES[team];
  return flagCode ? `/flags/${flagCode}.png` : null;
}
