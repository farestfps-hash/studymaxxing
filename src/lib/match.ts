import type { University } from "./universities";

export type OddsProfile = {
  gpa_unweighted?: number | null;
  gpa_weighted?: number | null;
  sat_score?: number | null;
  act_score?: number | null;
  unt_score?: number | null;
  nuet_score?: number | null;
  annual_budget?: number | null;
  budget_currency?: string | null;
  needs_full_aid?: boolean | null;
};

export type Odds = {
  probability: number;
  classification: "Safety" | "Match" | "Reach";
};

function firstNumber(text?: string): number | null {
  if (!text) return null;
  const m = text.replace(/\s/g, "").match(/\d{3,4}|\d\.\d+|\d+/);
  return m ? Number(m[0]) : null;
}

/** Deterministic, profile-based admission odds used on university cards. */
export function estimateOdds(
  uni: University,
  profile: OddsProfile,
  strengthBonus = 0,
  apCount = 0,
): Odds {
  // Selectivity baseline from QS rank: top-10 ≈ 8%, 1000+ ≈ 85%.
  const rank = Math.max(1, uni.qs);
  let p = 8 + 77 * Math.min(1, Math.log10(rank) / 3);

  const gpa = Number(profile.gpa_unweighted ?? profile.gpa_weighted ?? 0);
  const needGpa = firstNumber(uni.gpa) ?? 3.5;
  if (gpa > 0) {
    const scale = needGpa > 4.2 ? 5 : 4;
    const ratio = gpa / scale - needGpa / scale;
    p += ratio * 120;
  }

  const needSat = firstNumber(uni.sat);
  if (needSat && profile.sat_score) p += ((profile.sat_score - needSat) / 100) * 9;
  const needAct = firstNumber(uni.act);
  if (needAct && profile.act_score) p += (profile.act_score - needAct) * 2.5;
  const needUnt = firstNumber(uni.unt);
  if (needUnt && profile.unt_score) p += (profile.unt_score - needUnt) * 0.45;
  const needNuet = firstNumber(uni.nuet);
  if (needNuet && profile.nuet_score) p += (profile.nuet_score - needNuet) * 0.45;

  p += Math.min(12, apCount * 1.5);
  p += strengthBonus;

  if (profile.needs_full_aid && !/грант|100%|need-blind|бесплатн|полн/i.test(uni.aid)) p -= 8;

  const probability = Math.round(Math.max(3, Math.min(96, p)));
  const classification: Odds["classification"] =
    probability >= 65 ? "Safety" : probability >= 35 ? "Match" : "Reach";
  return { probability, classification };
}
