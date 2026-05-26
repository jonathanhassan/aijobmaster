export type ApplicationStatus =
  | "watchlist" | "to_apply" | "applied" | "follow_up"
  | "interview" | "offer" | "rejected";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  watchlist: "Veille",
  to_apply: "À postuler",
  applied: "Postulé",
  follow_up: "Relance",
  interview: "Entretien",
  offer: "Offre",
  rejected: "Refusé",
};

export const STATUS_ORDER: ApplicationStatus[] = [
  "watchlist", "to_apply", "applied", "follow_up", "interview", "offer", "rejected",
];

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  watchlist: "oklch(0.65 0.05 260)",
  to_apply: "oklch(0.70 0.16 230)",
  applied: "oklch(0.65 0.18 280)",
  follow_up: "oklch(0.75 0.16 70)",
  interview: "oklch(0.68 0.20 30)",
  offer: "oklch(0.68 0.16 155)",
  rejected: "oklch(0.55 0.18 25)",
};

export interface Application {
  id: string;
  user_id: string;
  title: string;
  company: string;
  company_logo: string | null;
  company_size: string | null;
  company_website: string | null;
  sector: string | null;
  contract_type: string | null;
  location: string | null;
  remote: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  source_url: string | null;
  description: string | null;
  required_skills: string[];
  nice_to_have_skills: string[];
  benefits: string[];
  status: ApplicationStatus;
  applied_at: string | null;
  cv_used: string | null;
  cover_letter: string | null;
  ai_score: { global: number; technical?: number; experience?: number; soft?: number; location?: number; salary?: number; strengths?: string[]; gaps?: string[]; recommendation?: string; keywords?: string[] } | null;
  personal_note: string | null;
  personal_rating: number | null;
  priority: "low" | "medium" | "high";
  tags: string[];
  contacts: Array<{ name: string; email?: string; linkedin?: string; role?: string }>;
  timeline: Array<{ date: string; event: string; type: string }>;
  interviews: Array<{ date: string; type: string; notes?: string }>;
  follow_ups: Array<{ date: string; note: string }>;
  notes: string | null;
  archived_at: string | null;
  archive_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  current_title: string | null;
  years_experience: number;
  location: string | null;
  remote_preference: string;
  target_salary_min: number | null;
  target_salary_max: number | null;
  currency: string;
  target_contracts: string[];
  target_sectors: string[];
  hard_skills: Array<{ name: string; level: number }>;
  soft_skills: string[];
  languages: Array<{ name: string; level: string }>;
  bio: string | null;
  pitch_30s: string | null;
  pitch_2min: string | null;
  search_status: string;
  available_from: string | null;
  profile_completion: number;
}

export interface CV {
  id: string;
  user_id: string;
  name: string;
  version: string;
  pdf_url: string | null;
  target_title: string | null;
  tags: string[];
  is_default: boolean;
  is_archived: boolean;
  use_count: number;
  average_ats_score: number;
  analysis: CVAnalysis | null;
  created_at: string;
  updated_at: string;
}

export interface CVAnalysis {
  layout_score: number;
  content_score: number;
  ats_score: number;
  strengths: string[];
  warnings: string[];
  errors: string[];
  sections_present: string[];
  sections_missing: string[];
  action_verbs: string[];
  keywords_found: string[];
  keywords_missing: string[];
  recommendations: Array<{ priority: "critical" | "important" | "optimization"; issue: string; solution: string; impact: string }>;
}

export interface Settings {
  id: string;
  user_id: string;
  mammouth_api_key: string | null;
  theme: string;
  color_theme: string;
  density: string;
  notifications_enabled: boolean;
  sla_watchlist: number;
  sla_applied: number;
  sla_interview: number;
}
