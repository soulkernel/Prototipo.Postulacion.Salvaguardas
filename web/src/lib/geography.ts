export const provinces = [
  "Azuay",
  "Bolívar",
  "Cañar",
  "Carchi",
  "Chimborazo",
  "Cotopaxi",
  "El Oro",
  "Esmeraldas",
  "Galápagos",
  "Guayas",
  "Imbabura",
  "Loja",
  "Los Ríos",
  "Manabí",
  "Morona Santiago",
  "Napo",
  "Orellana",
  "Pastaza",
  "Pichincha",
  "Santa Elena",
  "Santo Domingo de los Tsáchilas",
  "Sucumbíos",
  "Tungurahua",
  "Zamora Chinchipe",
];
export const cities: Record<string, string[]> = {
  Galápagos: [
    "Puerto Baquerizo Moreno",
    "Puerto Ayora",
    "Puerto Villamil",
    "Puerto Velasco Ibarra",
  ],
  Azuay: ["Cuenca"],
  Bolívar: ["Guaranda"],
  Cañar: ["Azogues"],
  Carchi: ["Tulcán"],
  Chimborazo: ["Riobamba"],
  Cotopaxi: ["Latacunga"],
  "El Oro": ["Machala"],
  Esmeraldas: ["Esmeraldas"],
  Guayas: ["Guayaquil", "Durán", "Daule", "Samborondón"],
  Imbabura: ["Ibarra", "Otavalo"],
  Loja: ["Loja"],
  "Los Ríos": ["Babahoyo", "Quevedo"],
  Manabí: ["Portoviejo", "Manta"],
  "Morona Santiago": ["Macas"],
  Napo: ["Tena"],
  Orellana: ["Puerto Francisco de Orellana"],
  Pastaza: ["Puyo"],
  Pichincha: ["Quito", "Sangolquí"],
  "Santa Elena": ["Santa Elena", "La Libertad", "Salinas"],
  "Santo Domingo de los Tsáchilas": ["Santo Domingo"],
  Sucumbíos: ["Nueva Loja"],
  Tungurahua: ["Ambato"],
  "Zamora Chinchipe": ["Zamora"],
};
type ApplicantAddress = {
  applicant_type?: string;
  province?: string;
  city?: string;
};
export const organizationProvince = "Galápagos";
export function organizationProvinceIssue(c: ApplicantAddress) {
  return (
    c.applicant_type === "organization" && c.province !== organizationProvince
  );
}
// The catalogue is intentionally partial: preserve the existing free-text option
// for localities not listed, but reject a known city in another province.
export function cityMatchesProvince(city: string, province: string) {
  const value = city.trim();
  if (!value) return false;
  if (cities[province]?.includes(value)) return true;
  return !Object.values(cities).some((options) => options.includes(value));
}
export function provinceAddressPatch(c: ApplicantAddress, province: string) {
  const city = c.city || "";
  const compatible =
    cities[province]?.includes(city.trim()) ||
    (c.province === province && cityMatchesProvince(city, province));
  return { province, city: compatible ? city : "" };
}
export function applicantTypeAddressPatch(
  c: ApplicantAddress,
  applicantType: string,
) {
  return {
    applicant_type: applicantType,
    ...(applicantType === "organization"
      ? provinceAddressPatch(c, organizationProvince)
      : {}),
  };
}
export const islands = [
  "Todo Galápagos",
  "San Cristóbal",
  "Santa Cruz",
  "Isabela",
  "Floreana",
  "Baltra",
  "Otras islas",
];
export function geographyIssues(c: {
  applicant_type?: string;
  province?: string;
  city?: string;
  project_islands?: string[];
  other_islands?: string;
}) {
  const errors: string[] = [];
  if (
    !c.province ||
    !provinces.includes(c.province) ||
    organizationProvinceIssue(c)
  )
    errors.push("province");
  if (!c.city?.trim() || !cityMatchesProvince(c.city, c.province || ""))
    errors.push("city");
  if (
    !c.project_islands?.length ||
    c.project_islands.some((i) => !islands.includes(i)) ||
    new Set(c.project_islands).size !== c.project_islands.length ||
    (c.project_islands.includes("Todo Galápagos") &&
      c.project_islands.length !== 1)
  )
    errors.push("project_islands");
  if (c.project_islands?.includes("Otras islas") && !c.other_islands?.trim())
    errors.push("other_islands");
  return errors;
}
