// TypeScript mirror of the live gfa_residence schema (verified 2026-07). Reuse, do not recreate.
export interface Residence {
  id: string; name: string; address: string | null; city: string | null; state: string | null;
  population_served: string | null; narr_level: string | null; narr_cert_status: string | null;
  narr_cert_date: string | null; narr_cert_expiry: string | null; total_beds: number | null;
  shared_room_fee: number | null; private_room_fee: number | null; accepts_mat: boolean | null;
  accepts_supervision: boolean | null; contact_phone: string | null; warmline: string | null;
  contact_email: string | null; active: boolean | null;
}
export interface Bed { id: string; residence_id: string; label: string; room_type: string | null; status: string | null; resident_id: string | null; occupied_since: string | null; }
export interface WaitlistEntry { id: string; residence_id: string; applicant_name: string; preferred_name: string | null; contact_phone: string | null; referral_source: string | null; priority: number | null; status: string | null; }
export interface FeeEntry { id: string; resident_id: string; entry_type: string; amount: number; description: string | null; due_date: string | null; paid_date: string | null; method: string | null; }
export interface Incident { id: string; resident_id: string | null; level: number; incident_type: string | null; description: string | null; action_taken: string | null; status: string | null; occurred_at: string; }
export interface PhaseHistory { id: string; resident_id: string; from_phase: number | null; to_phase: number; effective_date: string; milestone_note: string | null; }

export type Role = 'resident' | 'peer_mentor' | 'recovery_coach' | 'house_manager'
  | 'gfa_support' | 'residence_admin' | 'compliance_admin' | 'executive_director';
export const STAFF_ROLES: Role[] = ['peer_mentor','recovery_coach','house_manager','gfa_support','residence_admin','compliance_admin','executive_director'];
