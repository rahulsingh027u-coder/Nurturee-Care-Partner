// =============================================
// NURTUREE CARE PARTNER PORTAL — Onboarding Data
// Shared catalogs used by both OnboardingWizard and ProfileView
// =============================================

export const SKILLS_CATALOG = [
  { name: 'Dementia & Alzheimer Care', category: 'Specialized' },
  { name: 'Geriatric Nursing', category: 'Medical' },
  { name: 'Medication Management', category: 'Medical' },
  { name: 'Vital Signs Monitoring', category: 'Medical' },
  { name: 'Mobility & Physiotherapy Assistance', category: 'Physical' },
  { name: 'Palliative & End-of-Life Care', category: 'Specialized' },
  { name: 'Nutrition & Diet Planning', category: 'Wellness' },
  { name: 'CPR & First Aid', category: 'Medical' },
  { name: 'Patient Hygiene & Grooming', category: 'Personal Care' },
  { name: 'Wound Care Management', category: 'Medical' },
  { name: 'Diabetes Management', category: 'Medical' },
  { name: 'Oxygen & Respiratory Care', category: 'Medical' },
  { name: 'Emotional & Mental Health Support', category: 'Wellness' },
  { name: 'Child Development & Activities', category: 'Child Care' },
  { name: 'Newborn & Infant Care', category: 'Child Care' },
  { name: 'Feeding & Lactation Support', category: 'Child Care' },
  { name: 'Speech & Language Therapy Assistance', category: 'Therapy' },
  { name: 'Behavioral Management', category: 'Specialized' },
  { name: 'Home Safety Assessment', category: 'Safety' },
  { name: 'Emergency Response', category: 'Safety' },
] as const;

export const SERVICES_CATALOG = [
  { name: 'Elderly Day Care', description: 'Full-day in-home care with meals, activities, and companionship', category: 'Elder Care' },
  { name: 'Live-in Care', description: '24/7 dedicated care for bedridden or critically ill patients', category: 'Elder Care' },
  { name: 'Hospital Attendant', description: 'Professional hospital sitter for post-surgery and recovery periods', category: 'Medical' },
  { name: 'Dementia Companion', description: 'Specialized cognitive engagement, memory activities, and safety supervision', category: 'Specialized' },
  { name: 'Post-Surgery Recovery', description: 'Wound care, medication management, and rehabilitation support at home', category: 'Medical' },
  { name: 'Physiotherapy Assistance', description: 'Assist with prescribed physio exercises and mobility training', category: 'Therapy' },
  { name: 'Newborn & Infant Care', description: 'Round-the-clock infant feeding, bathing, sleep routine, and mother support', category: 'Child Care' },
  { name: 'Child Day Care', description: 'Supervised daytime childcare with learning activities and meals', category: 'Child Care' },
  { name: 'Special Needs Companion', description: 'Dedicated support for children with special needs and developmental activities', category: 'Specialized' },
  { name: 'Elderly Companion', description: 'Part-time companionship, walking assistance, and social engagement for seniors', category: 'Elder Care' },
  { name: 'Palliative Care Support', description: 'Compassionate end-of-life care with pain management and family emotional support', category: 'Medical' },
  { name: 'Medication Reminder Service', description: 'Timely medication administration and prescription management at home', category: 'Medical' },
  { name: 'Wound Care & Dressing', description: 'Professional wound cleaning, dressing change, and infection prevention', category: 'Medical' },
  { name: 'Bathing & Hygiene Assistance', description: 'Personal hygiene, grooming, and bathroom safety assistance for patients', category: 'Personal Care' },
  { name: 'Meal Preparation & Diet', description: 'Nutritious meal planning, cooking, and feeding assistance as per dietary needs', category: 'Personal Care' },
  { name: 'Doctor Appointment Escort', description: 'Accompany patient to hospital visits, manage records and follow-up instructions', category: 'Support' },
  { name: 'Lab Sample Collection', description: 'Home blood draw, sample collection, and delivery to diagnostic labs', category: 'Medical' },
] as const;

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export type SkillLevel = 'expert' | 'advanced' | 'intermediate' | 'beginner';

export interface OnboardingData {
  // Step 1: Personal
  name: string;
  email: string;
  phone: string;
  qualifications: string;
  languages: string;
  bio: string;
  experience: number;
  // Step 2: Specialist type
  specialty: 'elder_care' | 'child_care';
  // Step 3: Skills & Services
  skills: Array<{ name: string; level: SkillLevel; years: number }>;
  services: Array<{ name: string; description: string }>;
  // Step 4: Certifications
  certifications: Array<{ name: string; issuer: string; year: number; featured: boolean }>;
  // Step 5: Availability
  availability: Array<{ day: string; isAvailable: boolean; startTime: string; endTime: string }>;
}

const ONBOARDING_STORAGE_KEY = 'nurturee_care_partner_onboarding';

export function getStoredOnboarding(): OnboardingData | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as OnboardingData;
  } catch {
    return null;
  }
}

export function storeOnboarding(data: OnboardingData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data));
}

export function isOnboarded(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ONBOARDING_STORAGE_KEY) !== null;
}
