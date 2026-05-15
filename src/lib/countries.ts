/**
 * ISO 3166-1 alpha-2 countries with ITU E.164 dial codes.
 *
 * Used by the PhoneInput combobox. Names are in French (audience-aligned).
 * Flag glyphs are derived from the ISO-2 code at runtime via Regional
 * Indicator codepoints — keeps the data file small and consistent.
 *
 * Sort order: alphabetical by French name. The search filter is
 * accent-insensitive and matches on name OR dial code.
 *
 * Note: a handful of territories (e.g. NANP regions) share the +1 prefix.
 * Longest-prefix matching is impossible inside +1 without area-code lookup,
 * so we treat all NANP entries as separate selectable options; parsing a
 * stored +1XXX number falls back to the United States.
 */

export type Country = {
  /** ISO 3166-1 alpha-2 code (uppercase). */
  code: string;
  /** Country name in French. */
  name: string;
  /** ITU dial code, with leading "+". */
  dialCode: string;
};

export const COUNTRIES: readonly Country[] = [
  { code: "AF", name: "Afghanistan", dialCode: "+93" },
  { code: "ZA", name: "Afrique du Sud", dialCode: "+27" },
  { code: "AL", name: "Albanie", dialCode: "+355" },
  { code: "DZ", name: "Algérie", dialCode: "+213" },
  { code: "DE", name: "Allemagne", dialCode: "+49" },
  { code: "AD", name: "Andorre", dialCode: "+376" },
  { code: "AO", name: "Angola", dialCode: "+244" },
  { code: "AI", name: "Anguilla", dialCode: "+1264" },
  { code: "AQ", name: "Antarctique", dialCode: "+672" },
  { code: "AG", name: "Antigua-et-Barbuda", dialCode: "+1268" },
  { code: "SA", name: "Arabie saoudite", dialCode: "+966" },
  { code: "AR", name: "Argentine", dialCode: "+54" },
  { code: "AM", name: "Arménie", dialCode: "+374" },
  { code: "AW", name: "Aruba", dialCode: "+297" },
  { code: "AU", name: "Australie", dialCode: "+61" },
  { code: "AT", name: "Autriche", dialCode: "+43" },
  { code: "AZ", name: "Azerbaïdjan", dialCode: "+994" },
  { code: "BS", name: "Bahamas", dialCode: "+1242" },
  { code: "BH", name: "Bahreïn", dialCode: "+973" },
  { code: "BD", name: "Bangladesh", dialCode: "+880" },
  { code: "BB", name: "Barbade", dialCode: "+1246" },
  { code: "BE", name: "Belgique", dialCode: "+32" },
  { code: "BZ", name: "Belize", dialCode: "+501" },
  { code: "BJ", name: "Bénin", dialCode: "+229" },
  { code: "BM", name: "Bermudes", dialCode: "+1441" },
  { code: "BT", name: "Bhoutan", dialCode: "+975" },
  { code: "BY", name: "Biélorussie", dialCode: "+375" },
  { code: "BO", name: "Bolivie", dialCode: "+591" },
  { code: "BA", name: "Bosnie-Herzégovine", dialCode: "+387" },
  { code: "BW", name: "Botswana", dialCode: "+267" },
  { code: "BR", name: "Brésil", dialCode: "+55" },
  { code: "BN", name: "Brunei", dialCode: "+673" },
  { code: "BG", name: "Bulgarie", dialCode: "+359" },
  { code: "BF", name: "Burkina Faso", dialCode: "+226" },
  { code: "BI", name: "Burundi", dialCode: "+257" },
  { code: "KH", name: "Cambodge", dialCode: "+855" },
  { code: "CM", name: "Cameroun", dialCode: "+237" },
  { code: "CA", name: "Canada", dialCode: "+1" },
  { code: "CV", name: "Cap-Vert", dialCode: "+238" },
  { code: "BQ", name: "Caraïbes néerlandaises", dialCode: "+599" },
  { code: "CF", name: "Centrafrique", dialCode: "+236" },
  { code: "CL", name: "Chili", dialCode: "+56" },
  { code: "CN", name: "Chine", dialCode: "+86" },
  { code: "CY", name: "Chypre", dialCode: "+357" },
  { code: "CO", name: "Colombie", dialCode: "+57" },
  { code: "KM", name: "Comores", dialCode: "+269" },
  { code: "CG", name: "Congo", dialCode: "+242" },
  { code: "CD", name: "Congo (RDC)", dialCode: "+243" },
  { code: "KP", name: "Corée du Nord", dialCode: "+850" },
  { code: "KR", name: "Corée du Sud", dialCode: "+82" },
  { code: "CR", name: "Costa Rica", dialCode: "+506" },
  { code: "CI", name: "Côte d'Ivoire", dialCode: "+225" },
  { code: "HR", name: "Croatie", dialCode: "+385" },
  { code: "CU", name: "Cuba", dialCode: "+53" },
  { code: "CW", name: "Curaçao", dialCode: "+599" },
  { code: "DK", name: "Danemark", dialCode: "+45" },
  { code: "DJ", name: "Djibouti", dialCode: "+253" },
  { code: "DM", name: "Dominique", dialCode: "+1767" },
  { code: "EG", name: "Égypte", dialCode: "+20" },
  { code: "SV", name: "El Salvador", dialCode: "+503" },
  { code: "AE", name: "Émirats arabes unis", dialCode: "+971" },
  { code: "EC", name: "Équateur", dialCode: "+593" },
  { code: "ER", name: "Érythrée", dialCode: "+291" },
  { code: "ES", name: "Espagne", dialCode: "+34" },
  { code: "EE", name: "Estonie", dialCode: "+372" },
  { code: "SZ", name: "Eswatini", dialCode: "+268" },
  { code: "US", name: "États-Unis", dialCode: "+1" },
  { code: "ET", name: "Éthiopie", dialCode: "+251" },
  { code: "FJ", name: "Fidji", dialCode: "+679" },
  { code: "FI", name: "Finlande", dialCode: "+358" },
  { code: "FR", name: "France", dialCode: "+33" },
  { code: "GA", name: "Gabon", dialCode: "+241" },
  { code: "GM", name: "Gambie", dialCode: "+220" },
  { code: "GE", name: "Géorgie", dialCode: "+995" },
  { code: "GS", name: "Géorgie du Sud", dialCode: "+500" },
  { code: "GH", name: "Ghana", dialCode: "+233" },
  { code: "GI", name: "Gibraltar", dialCode: "+350" },
  { code: "GR", name: "Grèce", dialCode: "+30" },
  { code: "GD", name: "Grenade", dialCode: "+1473" },
  { code: "GL", name: "Groenland", dialCode: "+299" },
  { code: "GP", name: "Guadeloupe", dialCode: "+590" },
  { code: "GU", name: "Guam", dialCode: "+1671" },
  { code: "GT", name: "Guatemala", dialCode: "+502" },
  { code: "GG", name: "Guernesey", dialCode: "+44" },
  { code: "GN", name: "Guinée", dialCode: "+224" },
  { code: "GW", name: "Guinée-Bissau", dialCode: "+245" },
  { code: "GQ", name: "Guinée équatoriale", dialCode: "+240" },
  { code: "GY", name: "Guyana", dialCode: "+592" },
  { code: "GF", name: "Guyane française", dialCode: "+594" },
  { code: "HT", name: "Haïti", dialCode: "+509" },
  { code: "HN", name: "Honduras", dialCode: "+504" },
  { code: "HK", name: "Hong Kong", dialCode: "+852" },
  { code: "HU", name: "Hongrie", dialCode: "+36" },
  { code: "BV", name: "Île Bouvet", dialCode: "+47" },
  { code: "CX", name: "Île Christmas", dialCode: "+61" },
  { code: "IM", name: "Île de Man", dialCode: "+44" },
  { code: "NF", name: "Île Norfolk", dialCode: "+672" },
  { code: "AX", name: "Îles Åland", dialCode: "+358" },
  { code: "KY", name: "Îles Caïmans", dialCode: "+1345" },
  { code: "CC", name: "Îles Cocos (Keeling)", dialCode: "+61" },
  { code: "CK", name: "Îles Cook", dialCode: "+682" },
  { code: "FO", name: "Îles Féroé", dialCode: "+298" },
  { code: "FK", name: "Îles Malouines", dialCode: "+500" },
  { code: "MP", name: "Îles Mariannes du Nord", dialCode: "+1670" },
  { code: "MH", name: "Îles Marshall", dialCode: "+692" },
  { code: "SB", name: "Îles Salomon", dialCode: "+677" },
  { code: "TC", name: "Îles Turques-et-Caïques", dialCode: "+1649" },
  { code: "VG", name: "Îles Vierges britanniques", dialCode: "+1284" },
  { code: "VI", name: "Îles Vierges américaines", dialCode: "+1340" },
  { code: "IN", name: "Inde", dialCode: "+91" },
  { code: "ID", name: "Indonésie", dialCode: "+62" },
  { code: "IQ", name: "Irak", dialCode: "+964" },
  { code: "IR", name: "Iran", dialCode: "+98" },
  { code: "IE", name: "Irlande", dialCode: "+353" },
  { code: "IS", name: "Islande", dialCode: "+354" },
  { code: "IL", name: "Israël", dialCode: "+972" },
  { code: "IT", name: "Italie", dialCode: "+39" },
  { code: "JM", name: "Jamaïque", dialCode: "+1876" },
  { code: "JP", name: "Japon", dialCode: "+81" },
  { code: "JE", name: "Jersey", dialCode: "+44" },
  { code: "JO", name: "Jordanie", dialCode: "+962" },
  { code: "KZ", name: "Kazakhstan", dialCode: "+7" },
  { code: "KE", name: "Kenya", dialCode: "+254" },
  { code: "KG", name: "Kirghizistan", dialCode: "+996" },
  { code: "KI", name: "Kiribati", dialCode: "+686" },
  { code: "XK", name: "Kosovo", dialCode: "+383" },
  { code: "KW", name: "Koweït", dialCode: "+965" },
  { code: "LA", name: "Laos", dialCode: "+856" },
  { code: "LS", name: "Lesotho", dialCode: "+266" },
  { code: "LV", name: "Lettonie", dialCode: "+371" },
  { code: "LB", name: "Liban", dialCode: "+961" },
  { code: "LR", name: "Libéria", dialCode: "+231" },
  { code: "LY", name: "Libye", dialCode: "+218" },
  { code: "LI", name: "Liechtenstein", dialCode: "+423" },
  { code: "LT", name: "Lituanie", dialCode: "+370" },
  { code: "LU", name: "Luxembourg", dialCode: "+352" },
  { code: "MO", name: "Macao", dialCode: "+853" },
  { code: "MK", name: "Macédoine du Nord", dialCode: "+389" },
  { code: "MG", name: "Madagascar", dialCode: "+261" },
  { code: "MY", name: "Malaisie", dialCode: "+60" },
  { code: "MW", name: "Malawi", dialCode: "+265" },
  { code: "MV", name: "Maldives", dialCode: "+960" },
  { code: "ML", name: "Mali", dialCode: "+223" },
  { code: "MT", name: "Malte", dialCode: "+356" },
  { code: "MA", name: "Maroc", dialCode: "+212" },
  { code: "MQ", name: "Martinique", dialCode: "+596" },
  { code: "MU", name: "Maurice", dialCode: "+230" },
  { code: "MR", name: "Mauritanie", dialCode: "+222" },
  { code: "YT", name: "Mayotte", dialCode: "+262" },
  { code: "MX", name: "Mexique", dialCode: "+52" },
  { code: "FM", name: "Micronésie", dialCode: "+691" },
  { code: "MD", name: "Moldavie", dialCode: "+373" },
  { code: "MC", name: "Monaco", dialCode: "+377" },
  { code: "MN", name: "Mongolie", dialCode: "+976" },
  { code: "ME", name: "Monténégro", dialCode: "+382" },
  { code: "MS", name: "Montserrat", dialCode: "+1664" },
  { code: "MZ", name: "Mozambique", dialCode: "+258" },
  { code: "MM", name: "Myanmar", dialCode: "+95" },
  { code: "NA", name: "Namibie", dialCode: "+264" },
  { code: "NR", name: "Nauru", dialCode: "+674" },
  { code: "NP", name: "Népal", dialCode: "+977" },
  { code: "NI", name: "Nicaragua", dialCode: "+505" },
  { code: "NE", name: "Niger", dialCode: "+227" },
  { code: "NG", name: "Nigéria", dialCode: "+234" },
  { code: "NU", name: "Niue", dialCode: "+683" },
  { code: "NO", name: "Norvège", dialCode: "+47" },
  { code: "NC", name: "Nouvelle-Calédonie", dialCode: "+687" },
  { code: "NZ", name: "Nouvelle-Zélande", dialCode: "+64" },
  { code: "OM", name: "Oman", dialCode: "+968" },
  { code: "UG", name: "Ouganda", dialCode: "+256" },
  { code: "UZ", name: "Ouzbékistan", dialCode: "+998" },
  { code: "PK", name: "Pakistan", dialCode: "+92" },
  { code: "PW", name: "Palaos", dialCode: "+680" },
  { code: "PS", name: "Palestine", dialCode: "+970" },
  { code: "PA", name: "Panama", dialCode: "+507" },
  { code: "PG", name: "Papouasie-Nouvelle-Guinée", dialCode: "+675" },
  { code: "PY", name: "Paraguay", dialCode: "+595" },
  { code: "NL", name: "Pays-Bas", dialCode: "+31" },
  { code: "PE", name: "Pérou", dialCode: "+51" },
  { code: "PH", name: "Philippines", dialCode: "+63" },
  { code: "PN", name: "Pitcairn", dialCode: "+64" },
  { code: "PL", name: "Pologne", dialCode: "+48" },
  { code: "PF", name: "Polynésie française", dialCode: "+689" },
  { code: "PR", name: "Porto Rico", dialCode: "+1787" },
  { code: "PT", name: "Portugal", dialCode: "+351" },
  { code: "QA", name: "Qatar", dialCode: "+974" },
  { code: "RE", name: "La Réunion", dialCode: "+262" },
  { code: "RO", name: "Roumanie", dialCode: "+40" },
  { code: "GB", name: "Royaume-Uni", dialCode: "+44" },
  { code: "RU", name: "Russie", dialCode: "+7" },
  { code: "RW", name: "Rwanda", dialCode: "+250" },
  { code: "EH", name: "Sahara occidental", dialCode: "+212" },
  { code: "BL", name: "Saint-Barthélemy", dialCode: "+590" },
  { code: "KN", name: "Saint-Kitts-et-Nevis", dialCode: "+1869" },
  { code: "SM", name: "Saint-Marin", dialCode: "+378" },
  { code: "MF", name: "Saint-Martin", dialCode: "+590" },
  { code: "SX", name: "Saint-Martin (partie néerl.)", dialCode: "+1721" },
  { code: "PM", name: "Saint-Pierre-et-Miquelon", dialCode: "+508" },
  { code: "VC", name: "Saint-Vincent", dialCode: "+1784" },
  { code: "SH", name: "Sainte-Hélène", dialCode: "+290" },
  { code: "LC", name: "Sainte-Lucie", dialCode: "+1758" },
  { code: "WS", name: "Samoa", dialCode: "+685" },
  { code: "AS", name: "Samoa américaines", dialCode: "+1684" },
  { code: "ST", name: "Sao Tomé-et-Principe", dialCode: "+239" },
  { code: "SN", name: "Sénégal", dialCode: "+221" },
  { code: "RS", name: "Serbie", dialCode: "+381" },
  { code: "SC", name: "Seychelles", dialCode: "+248" },
  { code: "SL", name: "Sierra Leone", dialCode: "+232" },
  { code: "SG", name: "Singapour", dialCode: "+65" },
  { code: "SK", name: "Slovaquie", dialCode: "+421" },
  { code: "SI", name: "Slovénie", dialCode: "+386" },
  { code: "SO", name: "Somalie", dialCode: "+252" },
  { code: "SD", name: "Soudan", dialCode: "+249" },
  { code: "SS", name: "Soudan du Sud", dialCode: "+211" },
  { code: "LK", name: "Sri Lanka", dialCode: "+94" },
  { code: "SE", name: "Suède", dialCode: "+46" },
  { code: "CH", name: "Suisse", dialCode: "+41" },
  { code: "SR", name: "Suriname", dialCode: "+597" },
  { code: "SJ", name: "Svalbard et Jan Mayen", dialCode: "+47" },
  { code: "SY", name: "Syrie", dialCode: "+963" },
  { code: "TJ", name: "Tadjikistan", dialCode: "+992" },
  { code: "TW", name: "Taïwan", dialCode: "+886" },
  { code: "TZ", name: "Tanzanie", dialCode: "+255" },
  { code: "TD", name: "Tchad", dialCode: "+235" },
  { code: "CZ", name: "Tchéquie", dialCode: "+420" },
  { code: "TF", name: "Terres australes françaises", dialCode: "+262" },
  { code: "IO", name: "Territoire britannique de l'océan Indien", dialCode: "+246" },
  { code: "TH", name: "Thaïlande", dialCode: "+66" },
  { code: "TL", name: "Timor oriental", dialCode: "+670" },
  { code: "TG", name: "Togo", dialCode: "+228" },
  { code: "TK", name: "Tokelau", dialCode: "+690" },
  { code: "TO", name: "Tonga", dialCode: "+676" },
  { code: "TT", name: "Trinité-et-Tobago", dialCode: "+1868" },
  { code: "TN", name: "Tunisie", dialCode: "+216" },
  { code: "TM", name: "Turkménistan", dialCode: "+993" },
  { code: "TR", name: "Turquie", dialCode: "+90" },
  { code: "TV", name: "Tuvalu", dialCode: "+688" },
  { code: "UA", name: "Ukraine", dialCode: "+380" },
  { code: "UY", name: "Uruguay", dialCode: "+598" },
  { code: "VU", name: "Vanuatu", dialCode: "+678" },
  { code: "VA", name: "Vatican", dialCode: "+39" },
  { code: "VE", name: "Venezuela", dialCode: "+58" },
  { code: "VN", name: "Viêt Nam", dialCode: "+84" },
  { code: "WF", name: "Wallis-et-Futuna", dialCode: "+681" },
  { code: "YE", name: "Yémen", dialCode: "+967" },
  { code: "ZM", name: "Zambie", dialCode: "+260" },
  { code: "ZW", name: "Zimbabwe", dialCode: "+263" },
];

export const DEFAULT_COUNTRY_CODE = "FR";

/** Quick lookup by ISO-2 code. */
const COUNTRY_BY_CODE = new Map<string, Country>(
  COUNTRIES.map((c) => [c.code, c]),
);

export function getCountry(code: string): Country | undefined {
  return COUNTRY_BY_CODE.get(code.toUpperCase());
}

/**
 * Regional-indicator flag emoji from an ISO-2 code. Returns a placeholder
 * when the code is not 2 ASCII letters — keeps the UI from collapsing if
 * we ever feed it malformed data.
 */
export function flagEmoji(iso2: string): string {
  const code = iso2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🏳️";
  return String.fromCodePoint(
    ...[...code].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65),
  );
}

/**
 * Strip everything except digits + an optional leading +. Useful before
 * E.164 assembly when accepting human-typed input.
 */
export function digitsOnly(input: string): string {
  return input.replace(/[^\d]/g, "");
}

/**
 * Parse a stored E.164 string back into a country + local-number pair so
 * the UI can pre-fill the form when editing a profile.
 *
 * Algorithm: longest-prefix-match on dial codes. NANP (+1XXX) entries win
 * over plain +1 when the area code matches; otherwise +1 falls back to US.
 * If nothing matches (or input is empty / missing the +) we return the
 * default country with the digits as local — the form will surface the
 * mismatch the moment the user touches the field.
 */
export function parseE164(
  e164: string | null | undefined,
): { country: Country; local: string } {
  const fallback = {
    country: COUNTRY_BY_CODE.get(DEFAULT_COUNTRY_CODE)!,
    local: "",
  };
  if (!e164) return fallback;
  const trimmed = e164.trim();
  if (!trimmed.startsWith("+")) {
    return { ...fallback, local: digitsOnly(trimmed) };
  }
  const digits = `+${digitsOnly(trimmed)}`;

  let best: Country | null = null;
  for (const c of COUNTRIES) {
    if (digits.startsWith(c.dialCode)) {
      if (!best || c.dialCode.length > best.dialCode.length) {
        best = c;
      }
    }
  }
  if (!best) return { ...fallback, local: digits };

  return {
    country: best,
    local: digits.slice(best.dialCode.length),
  };
}

/**
 * Assemble an E.164 string from a country + local number. Drops everything
 * non-digit from the local part. Returns null if local is empty so the
 * caller can decide whether to persist null vs. an incomplete number.
 */
export function toE164(country: Country, local: string): string | null {
  const digits = digitsOnly(local);
  if (digits.length === 0) return null;
  return `${country.dialCode}${digits}`;
}

/**
 * Loose E.164 validator: leading +, 1–3 digit country code already included
 * in the prefix, total 8–17 digits. Tightens the previous "any 6–15 digits"
 * rule now that the UI guarantees the + prefix.
 */
export function isValidE164(value: string): boolean {
  return /^\+[1-9]\d{6,16}$/.test(value);
}
