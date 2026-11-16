export type MerchantPlan = "basico" | "destacado" | "premium";

export type Category = {
  slug: string;
  name: string;
  kind: "comercio" | "evento";
  sort_order: number;
};

export type Merchant = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  logo_url: string | null;
  banner_url: string | null;
  maps_url: string | null;
  lat: number | null;
  lng: number | null;
  location_label: string;
  whatsapp: string | null;
  instagram: string | null;
  opening_hours: string;
  opens_at: string | null;
  closes_at: string | null;
  plan: MerchantPlan;
  popular_rank: number | null;
  is_published: boolean;
  report_email?: string | null;
};

export type FairEvent = {
  id: string;
  title: string;
  category: string;
  venue: string;
  description: string;
  starts_at: string;
  ends_at: string | null;
  is_published: boolean;
};

export type Coupon = {
  id: string;
  merchant_id: string;
  title: string;
  terms: string;
  kind: "cupo" | "abierta";
  total_quota: number | null;
  remaining: number | null;
  valid_until: string;
  is_active: boolean;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string;
  whatsapp: string | null;
  municipality: string | null;
  birth_year: number | null;
  interests: string[];
  role: "visitor" | "admin";
  consent_at: string | null;
  consent_version: string | null;
  opted_out_at: string | null;
  profile_completed_at: string | null;
  created_at: string;
};

export type CouponClaim = {
  id: string;
  coupon_id: string;
  user_id: string;
  code: string;
  claimed_at: string;
  redeemed_at: string | null;
};
