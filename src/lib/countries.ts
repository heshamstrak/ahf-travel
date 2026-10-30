export const COUNTRIES: { code: string; name: string }[] = [
  { code: "EG", name: "Egypt" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "United Arab Emirates" },
];

export const codeToName = (code: string) => COUNTRIES.find((c) => c.code === code)?.name ?? code;
export const nameToCode = (name: string) => COUNTRIES.find((c) => c.name === name)?.code ?? "EG";
