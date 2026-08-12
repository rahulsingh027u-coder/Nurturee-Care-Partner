// =============================================
// NURTUREE CARE PARTNER PORTAL — Mock Data
// =============================================

interface CarePartnerProfile {
  id: string;
  carePartnerId: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  specialty: "child_care" | "elder_care";
  experience: number;
  qualifications: string;
  languages: string[];
  area: string;
  bio: string;
  isAvailable: boolean;
  isVerified: boolean;
  rating: number;
  totalAssignments: number;
  aadhaarVerified: boolean;
  policeVerified: boolean;
  medicalFitness: boolean;
  videoVerified: boolean;
  availability: { day: string; isAvailable: boolean; startTime: string; endTime: string }[];
  earnings: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
    pending: number;
    paid: number;
  };
  profileComplete: boolean;
  specialistProfile?: {
    title: string;
    icon: string;
    tagline: string;
    skills: Array<{ name: string; level: 'expert' | 'advanced' | 'intermediate' | 'beginner'; years: number }>;
    services: Array<{ name: string; description: string; rate: number; unit: string }>;
    certifications: Array<{ name: string; issuer: string; year: number }>;
    stats: {
      completedShifts: number;
      ongoingAssignments: number;
      repeatClients: number;
      averageRating: number;
      totalReviews: number;
      yearsActive: number;
    };
  };
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  city: string;
  careType: "elder_care" | "child_care" | "office_care" | "day_care" | "live_in_care" | "hourly_care";
  bloodGroup?: string;
  allergies?: string;
  address?: string;
  avatar?: string;
  totalSessions: number;
  lastSession: string;
  careNotes: string;
  medicalHistory?: string;
  conditions?: string[];
  // Child care specific fields
  schoolName?: string;
  grade?: string;
  // Elder care specific fields
  primaryDoctor?: string;
  emergencyContact?: string;
}

export interface Shift {
  id: string;
  bookingId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  serviceType: string;
  serviceCategory: "child_care" | "elder_care";
  consultationMode: "online" | "in_home";
  status: "confirmed" | "in_progress" | "completed" | "cancelled";
  date: string;
  startTime: string;
  endTime: string;
  address?: string;
  city?: string;
  notes?: string;
  earnings: number;
  specialInstructions?: string;
}

interface CareTask {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  tasks: TaskItem[];
}

export interface TaskItem {
  id: string;
  category: "medication" | "hygiene" | "nutrition" | "exercise" | "vitals" | "school" | "milestone" | "safety" | "engagement" | "feeding" | "sleep" | "physical_activity" | "learning" | "child_housekeeping" | "other";
  title: string;
  description: string;
  scheduledTime: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
}

export interface MedicationLog {
  id: string;
  patientId: string;
  patientName: string;
  medicine: string;
  dosage: string;
  frequency: string;
  scheduledTime: string;
  status: "taken" | "missed" | "upcoming" | "skipped";
  date: string;
  notes?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "assignment" | "status" | "payment" | "verification" | "info";
  isRead: boolean;
  createdAt: string;
}

interface EarningRecord {
  id: string;
  bookingId: string;
  patientName: string;
  serviceType: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "processing";
}

interface Review {
  id: string;
  patientId: string;
  patientName: string;
  rating: number;       // 1–5 stars
  comment: string;
  date: string;          // ISO date string
  shiftId?: string;
  serviceType?: string;
}

// =============================================
// MOCK CARE PARTNER PROFILE
// =============================================
export const mockCarePartner: CarePartnerProfile = {
  id: "cg_01",
  carePartnerId: "NR12002125",
  name: "Priya Sharma",
  phone: "+919876543210",
  email: "priya.sharma@nurturee.com",
  specialty: "elder_care",
  experience: 5,
  qualifications: "B.Sc Nursing, Certificate in Geriatric Care",
  languages: ["English", "Hindi", "Punjabi"],
  area: "Sector 45, Gurugram",
  bio: "Compassionate elder care specialist with 5 years of experience in geriatric nursing. Specialized in dementia and Alzheimer's patient care.",
  isAvailable: true,
  isVerified: true,
  rating: 4.8,
  totalAssignments: 156,
  aadhaarVerified: false,
  policeVerified: false,
  medicalFitness: false,
  videoVerified: false,
  profileComplete: true,
  availability: [
    { day: "Monday", isAvailable: true, startTime: "08:00", endTime: "18:00" },
    { day: "Tuesday", isAvailable: true, startTime: "08:00", endTime: "18:00" },
    { day: "Wednesday", isAvailable: true, startTime: "08:00", endTime: "18:00" },
    { day: "Thursday", isAvailable: false, startTime: "08:00", endTime: "18:00" },
    { day: "Friday", isAvailable: true, startTime: "08:00", endTime: "18:00" },
    { day: "Saturday", isAvailable: true, startTime: "09:00", endTime: "14:00" },
    { day: "Sunday", isAvailable: false, startTime: "09:00", endTime: "14:00" },
  ],
  earnings: {
    today: 1200,
    thisWeek: 6800,
    lastWeek: 6050,
    thisMonth: 28500,
    total: 342000,
    pending: 4500,
    paid: 30000,
  },
  specialistProfile: {
    title: 'Elder Care Specialist',
    icon: 'heart-pulse',
    tagline: 'Compassionate geriatric care with specialized training in dementia and Alzheimer support',
    skills: [
      { name: 'Dementia & Alzheimer Care', level: 'expert', years: 4 },
      { name: 'Geriatric Nursing', level: 'expert', years: 5 },
      { name: 'Medication Management', level: 'advanced', years: 5 },
      { name: 'Vital Signs Monitoring', level: 'expert', years: 5 },
      { name: 'Mobility & Physiotherapy Assistance', level: 'intermediate', years: 3 },
      { name: 'Palliative & End-of-Life Care', level: 'intermediate', years: 2 },
      { name: 'Nutrition & Diet Planning', level: 'advanced', years: 4 },
      { name: 'CPR & First Aid', level: 'advanced', years: 5 },
    ],
    services: [
      { name: 'Elderly Day Care', description: 'Full-day in-home care with meals, activities, and companionship', rate: 800, unit: 'day' },
      { name: 'Live-in Care', description: '24/7 dedicated care for bedridden or critically ill patients', rate: 1500, unit: 'day' },
      { name: 'Hospital Attendant', description: 'Professional hospital sitter for post-surgery and recovery periods', rate: 700, unit: 'day' },
      { name: 'Dementia Companion', description: 'Specialized cognitive engagement, memory activities, and safety supervision', rate: 900, unit: 'day' },
      { name: 'Post-Surgery Recovery', description: 'Wound care, medication management, and rehabilitation support at home', rate: 1000, unit: 'day' },
      { name: 'Physiotherapy Assistance', description: 'Assist with prescribed physio exercises and mobility training', rate: 600, unit: 'session' },
    ],
    certifications: [
      { name: 'B.Sc Nursing', issuer: 'Maharshi Dayanand University', year: 2019 },
      { name: 'Certificate in Geriatric Care', issuer: 'AIIMS, New Delhi', year: 2020 },
      { name: 'Dementia Care Specialist', issuer: 'Alzheimer\'s Society of India', year: 2022 },
      { name: 'CPR & Basic Life Support', issuer: 'Red Cross Society', year: 2023 },
      { name: 'Palliative Care Training', issuer: 'Tata Memorial Hospital', year: 2024 },
    ],
    stats: {
      completedShifts: 1247,
      ongoingAssignments: 3,
      repeatClients: 42,
      averageRating: 4.8,
      totalReviews: 156,
      yearsActive: 5,
    },
  },
};

// =============================================
// MOCK PATIENTS
// =============================================
export const mockPatients: Patient[] = [
  {
    id: "pat_01",
    name: "Sunita Devi",
    phone: "+919812345001",
    age: 72,
    gender: "Female",
    city: "Gurugram",
    careType: "elder_care",
    bloodGroup: "B+",
    allergies: "Penicillin",
    address: "Flat 301, Lotus Tower, Sector 45",
    totalSessions: 24,
    lastSession: "2025-07-14",
    careNotes: "Patient has mild dementia. Needs reminders for medication. Prefers warm food. Enjoys morning walks with assistance.",
    medicalHistory: "Hypertension, Type 2 Diabetes, Mild Dementia",
    primaryDoctor: "Dr. Anita Verma",
    emergencyContact: "+919812345099",
    conditions: ["Hypertension", "Diabetes", "Dementia"],
  },
  {
    id: "pat_02",
    name: "Rajesh Kumar",
    phone: "+919812345002",
    age: 68,
    gender: "Male",
    city: "Gurugram",
    careType: "elder_care",
    bloodGroup: "O+",
    address: "House 42, Palm Heights, Sector 57",
    totalSessions: 18,
    lastSession: "2025-07-13",
    careNotes: "Post-hip surgery recovery. Needs assistance with mobility exercises. Physiotherapy daily at 10 AM.",
    medicalHistory: "Hip Replacement Surgery, Osteoarthritis",
    primaryDoctor: "Dr. Rajiv Gupta",
    conditions: ["Post-Surgery Recovery", "Arthritis"],
  },
  {
    id: "pat_03",
    name: "Meena Agarwal",
    phone: "+919812345003",
    age: 78,
    gender: "Female",
    city: "Gurugram",
    careType: "elder_care",
    bloodGroup: "A+",
    allergies: "Sulfa drugs",
    address: "Villa 7, Greenwood Estate, Sector 38",
    totalSessions: 32,
    lastSession: "2025-07-14",
    careNotes: "Alzheimer's patient. Requires constant supervision. Wanders if left alone. Calms down with music therapy.",
    medicalHistory: "Alzheimer's Disease, Arthritis, Insomnia",
    primaryDoctor: "Dr. Sunita Rao",
    conditions: ["Alzheimer's", "Arthritis", "Insomnia"],
  },
  {
    id: "pat_04",
    name: "Om Prakash",
    phone: "+919812345004",
    age: 65,
    gender: "Male",
    city: "Gurugram",
    careType: "elder_care",
    address: "Flat 1205, Skyline Tower, Sector 30",
    totalSessions: 8,
    lastSession: "2025-07-12",
    careNotes: "New patient. Recovering from stroke. Left side weakness. Speech therapy ongoing.",
    medicalHistory: "Ischemic Stroke, Hypertension",
    primaryDoctor: "Dr. Prakash Menon",
    conditions: ["Post-Stroke Recovery", "Hypertension"],
  },
  {
    id: "pat_05",
    name: "Kamla Sharma",
    phone: "+919812345005",
    age: 80,
    gender: "Female",
    city: "Gurugram",
    careType: "elder_care",
    bloodGroup: "AB+",
    address: "B-12, Railway Colony, Sector 12",
    totalSessions: 45,
    lastSession: "2025-07-14",
    careNotes: "Bedridden patient. Needs turning every 2 hours. Diabetic wound care on left foot. Diet: low sugar, high protein.",
    medicalHistory: "Bedridden, Diabetic Ulcer, Heart Disease",
    primaryDoctor: "Dr. Meena Iyer",
    conditions: ["Bedridden Care", "Diabetic Wound", "Heart Disease"],
  },
  {
    id: "pat_06",
    name: "Harish Chandra",
    phone: "+919812345006",
    age: 71,
    gender: "Male",
    city: "Gurugram",
    careType: "elder_care",
    address: "E-3, Sushant Lok, Phase I",
    totalSessions: 12,
    lastSession: "2025-07-11",
    careNotes: "Parkinson's disease. Tremors managed with medication. Needs help with fine motor tasks like buttoning shirts.",
    medicalHistory: "Parkinson's Disease, Depression",
    primaryDoctor: "Dr. Vikram Singh",
    conditions: ["Parkinson's", "Depression"],
  },
  // ── CHILD CARE PATIENTS ──
  {
    id: "pat_07",
    name: "Aarav Mehta",
    phone: "+919812345007",
    age: 6,
    gender: "Male",
    city: "Gurugram",
    careType: "child_care",
    allergies: "Peanuts, tree nuts",
    address: "Flat 802, Avalon Court, Sector 56",
    totalSessions: 48,
    lastSession: "2025-07-14",
    careNotes: "Energetic child. Loves building blocks and drawing. Needs help with school homework. Mild peanut allergy — EpiPen in blue school bag. Parent: Sneha Mehta.",
    schoolName: "DPS Sector 56",
    grade: "Class 1",
  },
  {
    id: "pat_08",
    name: "Anaya Kapoor",
    phone: "+919812345008",
    age: 9,
    gender: "Female",
    city: "Gurugram",
    careType: "child_care",
    allergies: "Dust mites",
    address: "House 15, DLF Phase 3",
    totalSessions: 30,
    lastSession: "2025-07-13",
    careNotes: "Quiet and creative. Enjoys reading, dance, and cycling. Needs encouragement to socialise. Parent: Rhea Kapoor.",
    schoolName: "Shikshantar School",
    grade: "Class 4",
  },
];

// =============================================
// MOCK SHIFTS / BOOKINGS
// =============================================
const today = new Date();
const todayStr = today.toISOString().split("T")[0];
const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split("T")[0];
const tomorrowStr = new Date(today.getTime() + 86400000).toISOString().split("T")[0];

// =============================================
// MOCK REVIEWS (given by customers on Nurturee portal)
// =============================================
export const mockReviews: Review[] = [
  { id: "rv_01", patientId: "pat_01", patientName: "Sunita Devi", rating: 5, comment: "Priya is extremely caring and patient. She manages my mother's medication perfectly and always keeps us updated. Highly recommend!", date: todayStr, shiftId: "sh_01", serviceType: "Full-Time 24hr Care" },
  { id: "rv_02", patientId: "pat_02", patientName: "Rajesh Kumar", rating: 4, comment: "Very professional. Helped me recover after my surgery with proper wound care and physio support. Only suggestion: could arrive 10 mins earlier.", date: yesterdayStr, shiftId: "sh_04", serviceType: "Post-Hospitalisation Care" },
  { id: "rv_03", patientId: "pat_01", patientName: "Sunita Devi", rating: 5, comment: "We have been using Priya's services for 3 months now. She is like family to my mother. Excellent dementia care.", date: new Date(today.getTime() - 2 * 86400000).toISOString().split("T")[0], shiftId: "sh_07", serviceType: "Full-Time 24hr Care" },
  { id: "rv_04", patientId: "pat_04", patientName: "Om Prakash", rating: 4, comment: "Good care partner. Helped with my father's speech exercises after stroke. Friendly and punctual.", date: new Date(today.getTime() - 3 * 86400000).toISOString().split("T")[0], serviceType: "Medical Attendant" },
  { id: "rv_05", patientId: "pat_06", patientName: "Harish Chandra", rating: 5, comment: "Wonderful companion for my father. He really looks forward to her visits. She engages him in activities and keeps him active.", date: new Date(today.getTime() - 4 * 86400000).toISOString().split("T")[0], serviceType: "Companionship & Care" },
  { id: "rv_06", patientId: "pat_05", patientName: "Kamla Sharma", rating: 4, comment: "Priya managed my mother's wound dressing very well. She is knowledgeable and follows doctor's instructions precisely.", date: new Date(today.getTime() - 5 * 86400000).toISOString().split("T")[0], serviceType: "Medical Attendant" },
  { id: "rv_07", patientId: "pat_03", patientName: "Meena Agarwal", rating: 5, comment: "Excellent care for my mother with Alzheimer's. Priya uses music therapy and memory activities that really help calm her. God bless her.", date: new Date(today.getTime() - 7 * 86400000).toISOString().split("T")[0], serviceType: "Dementia/Alzheimer's Care" },
  { id: "rv_08", patientId: "pat_07", patientName: "Aarav Mehta", rating: 5, comment: "My son loves Priya! She helps with homework, plays with him, and follows all allergy instructions perfectly. Best nanny we've had.", date: new Date(today.getTime() - 8 * 86400000).toISOString().split("T")[0], shiftId: "sh_09", serviceType: "After-School Nanny Care" },
];

export const mockShifts: Shift[] = [
  {
    id: "sh_01",
    bookingId: "RA384721",
    patientId: "pat_01",
    patientName: "Sunita Devi",
    patientPhone: "+919812345001",
    serviceType: "Full-Time 24hr Care",
    serviceCategory: "elder_care",
    consultationMode: "in_home",
    status: "completed",
    date: todayStr,
    startTime: "08:00",
    endTime: "14:00",
    address: "Flat 301, Lotus Tower, Sector 45, Gurugram",
    city: "Gurugram",
    notes: "Morning medication at 8 AM, breakfast by 9 AM",
    earnings: 700,
    specialInstructions: "Patient has mild dementia. Keep all exits locked. Call family if agitated.",
  },
  {
    id: "sh_02",
    bookingId: "RA384735",
    patientId: "pat_03",
    patientName: "Meena Agarwal",
    patientPhone: "+919812345003",
    serviceType: "Dementia/Alzheimer's Care",
    serviceCategory: "elder_care",
    consultationMode: "in_home",
    status: "in_progress",
    date: todayStr,
    startTime: "14:00",
    endTime: "20:00",
    address: "Villa 7, Greenwood Estate, Sector 38, Gurugram",
    city: "Gurugram",
    earnings: 800,
    specialInstructions: "Play familiar old Bollywood songs to calm patient. Do not leave unattended.",
  },
  {
    id: "sh_03",
    bookingId: "RA384750",
    patientId: "pat_05",
    patientName: "Kamla Sharma",
    patientPhone: "+919812345005",
    serviceType: "Medical Attendant",
    serviceCategory: "elder_care",
    consultationMode: "in_home",
    status: "confirmed",
    date: tomorrowStr,
    startTime: "08:00",
    endTime: "14:00",
    address: "B-12, Railway Colony, Sector 12, Gurugram",
    city: "Gurugram",
    earnings: 600,
    specialInstructions: "Change dressing on left foot wound. Check blood sugar at 9 AM and 1 PM.",
  },
  {
    id: "sh_04",
    bookingId: "RA384710",
    patientId: "pat_02",
    patientName: "Rajesh Kumar",
    patientPhone: "+919812345002",
    serviceType: "Post-Hospitalisation Care",
    serviceCategory: "elder_care",
    consultationMode: "in_home",
    status: "completed",
    date: yesterdayStr,
    startTime: "09:00",
    endTime: "15:00",
    address: "House 42, Palm Heights, Sector 57, Gurugram",
    city: "Gurugram",
    earnings: 650,
    notes: "Assist with physiotherapy exercises. Monitor pain levels.",
  },
  {
    id: "sh_05",
    bookingId: "RA384765",
    patientId: "pat_04",
    patientName: "Om Prakash",
    patientPhone: "+919812345004",
    serviceType: "Medical Attendant",
    serviceCategory: "elder_care",
    consultationMode: "in_home",
    status: "confirmed",
    date: tomorrowStr,
    startTime: "15:00",
    endTime: "19:00",
    address: "Flat 1205, Skyline Tower, Sector 30, Gurugram",
    city: "Gurugram",
    earnings: 500,
    specialInstructions: "Help with speech exercises. Assist with walking using walker.",
  },
  {
    id: "sh_06",
    bookingId: "RA384780",
    patientId: "pat_06",
    patientName: "Harish Chandra",
    patientPhone: "+919812345006",
    serviceType: "Companionship & Care",
    serviceCategory: "elder_care",
    consultationMode: "in_home",
    status: "confirmed",
    date: tomorrowStr,
    startTime: "10:00",
    endTime: "13:00",
    address: "E-3, Sushant Lok, Phase I, Gurugram",
    city: "Gurugram",
    earnings: 450,
  },
  {
    id: "sh_07",
    bookingId: "RA384695",
    patientId: "pat_01",
    patientName: "Sunita Devi",
    patientPhone: "+919812345001",
    serviceType: "Full-Time 24hr Care",
    serviceCategory: "elder_care",
    consultationMode: "in_home",
    status: "completed",
    date: yesterdayStr,
    startTime: "08:00",
    endTime: "20:00",
    address: "Flat 301, Lotus Tower, Sector 45, Gurugram",
    city: "Gurugram",
    earnings: 900,
  },
  {
    id: "sh_08",
    bookingId: "RA384690",
    patientId: "pat_03",
    patientName: "Meena Agarwal",
    patientPhone: "+919812345003",
    serviceType: "Dementia/Alzheimer's Care",
    serviceCategory: "elder_care",
    consultationMode: "in_home",
    status: "cancelled",
    date: yesterdayStr,
    startTime: "14:00",
    endTime: "20:00",
    address: "Villa 7, Greenwood Estate, Sector 38, Gurugram",
    city: "Gurugram",
    earnings: 0,
    notes: "Cancelled by family — patient hospitalised for routine checkup",
  },
  // ── CHILD CARE SHIFTS ──
  {
    id: "sh_09",
    bookingId: "RA384810",
    patientId: "pat_07",
    patientName: "Aarav Mehta",
    patientPhone: "+919812345007",
    serviceType: "After-School Nanny Care",
    serviceCategory: "child_care",
    consultationMode: "in_home",
    status: "in_progress",
    date: todayStr,
    startTime: "14:00",
    endTime: "18:00",
    address: "Flat 802, Avalon Court, Sector 56, Gurugram",
    city: "Gurugram",
    earnings: 550,
    specialInstructions: "Peanut allergy — no peanuts or tree nuts. EpiPen in blue school bag. Parent: Sneha Mehta.",
  },
  {
    id: "sh_10",
    bookingId: "RA384820",
    patientId: "pat_08",
    patientName: "Anaya Kapoor",
    patientPhone: "+919812345008",
    serviceType: "After-School Nanny Care",
    serviceCategory: "child_care",
    consultationMode: "in_home",
    status: "confirmed",
    date: tomorrowStr,
    startTime: "15:00",
    endTime: "19:00",
    address: "House 15, DLF Phase 3, Gurugram",
    city: "Gurugram",
    earnings: 500,
    specialInstructions: "Help with Class 4 homework. Encourage outdoor play. Parent: Rhea Kapoor.",
  },
];

// =============================================
// MOCK CARE TASKS
// =============================================
export const mockCareTasks: CareTask[] = [
  {
    id: "ct_01",
    patientId: "pat_01",
    patientName: "Sunita Devi",
    date: todayStr,
    tasks: [
      { id: "t_01", category: "medication", title: "Morning Medication", description: "Give BP pill (Telmisartan 40mg) and diabetes pill (Metformin 500mg)", scheduledTime: "08:00", isCompleted: true, completedAt: "08:05" },
      { id: "t_02", category: "vitals", title: "Check Blood Pressure", description: "Measure and record BP. Report if above 140/90", scheduledTime: "08:15", isCompleted: true, completedAt: "08:20" },
      { id: "t_03", category: "vitals", title: "Check Blood Sugar", description: "Fasting blood sugar test before breakfast", scheduledTime: "08:30", isCompleted: true, completedAt: "08:35" },
      { id: "t_04", category: "nutrition", title: "Prepare Breakfast", description: "Oatmeal with low sugar, seasonal fruit, green tea", scheduledTime: "09:00", isCompleted: true, completedAt: "09:10" },
      { id: "t_05", category: "exercise", title: "Morning Walk", description: "Assisted walk in society garden for 20 minutes", scheduledTime: "10:00", isCompleted: false },
      { id: "t_06", category: "medication", title: "Afternoon Medication", description: "Give afternoon diabetes pill", scheduledTime: "13:00", isCompleted: false },
      { id: "t_07", category: "nutrition", title: "Prepare Lunch", description: "Dal rice, sabzi, curd. Low salt, low oil.", scheduledTime: "13:30", isCompleted: false },
      { id: "t_08", category: "hygiene", title: "Afternoon Rest & Hygiene", description: "Help with changing clothes, freshen up", scheduledTime: "15:00", isCompleted: false },
    ],
  },
  {
    id: "ct_02",
    patientId: "pat_03",
    patientName: "Meena Agarwal",
    date: todayStr,
    tasks: [
      { id: "t_09", category: "medication", title: "Alzheimer's Medication", description: "Donepezil 10mg — must be taken with food", scheduledTime: "14:15", isCompleted: true, completedAt: "14:20" },
      { id: "t_10", category: "nutrition", title: "Evening Snack", description: "Light snack — khari biscuit with chai. Low sugar.", scheduledTime: "16:00", isCompleted: false },
      { id: "t_11", category: "exercise", title: "Music Therapy Session", description: "Play old Lata Mangeshkar songs for 30 minutes", scheduledTime: "17:00", isCompleted: false },
      { id: "t_12", category: "hygiene", title: "Evening Bath", description: "Assist with sponge bath. Check skin for bedsores.", scheduledTime: "18:00", isCompleted: false },
      { id: "t_13", category: "medication", title: "Dinner Medication", description: "Donepezil 5mg evening dose, Arthritis pain relief", scheduledTime: "19:30", isCompleted: false },
      { id: "t_14", category: "nutrition", title: "Prepare Dinner", description: "Khichdi with vegetables. Easy to digest.", scheduledTime: "20:00", isCompleted: false },
    ],
  },
  // ── CHILD CARE TASKS: Aarav Mehta ──
  {
    id: "ct_03",
    patientId: "pat_07",
    patientName: "Aarav Mehta",
    date: todayStr,
    tasks: [
      { id: "t_15", category: "hygiene", title: "After-School Freshen Up", description: "Wash hands, face, change from school uniform to home clothes", scheduledTime: "14:15", isCompleted: true, completedAt: "14:20" },
      { id: "t_16", category: "feeding", title: "Afternoon Snack", description: "Peanut-free snack — cucumber sandwich with juice. Check ingredient labels!", scheduledTime: "14:30", isCompleted: true, completedAt: "14:35" },
      { id: "t_17", category: "school", title: "School Homework Review", description: "Check Class 1 homework diary. Help with Maths and English worksheets", scheduledTime: "15:00", isCompleted: false },
      { id: "t_18", category: "engagement", title: "Free Play Time", description: "Building blocks or drawing for 30 minutes. Let child choose activity.", scheduledTime: "15:45", isCompleted: false },
      { id: "t_19", category: "nutrition", title: "Evening Snack", description: "Cut fruits (apple, banana) and a glass of milk", scheduledTime: "16:30", isCompleted: false },
      { id: "t_20", category: "sleep", title: "Quiet Rest / Nap Time", description: "Encourage 20 min quiet rest with storybook. Dim lights.", scheduledTime: "17:00", isCompleted: false },
      { id: "t_21", category: "safety", title: "Allergy Check", description: "Ensure no peanut products in house. Check EpiPen expiry date.", scheduledTime: "17:30", isCompleted: false },
      { id: "t_22", category: "learning", title: "Reading Session", description: "Read one story from Panchatantra. Ask child to narrate back.", scheduledTime: "17:45", isCompleted: false },
    ],
  },
  // ── CHILD CARE TASKS: Anaya Kapoor ──
  {
    id: "ct_04",
    patientId: "pat_08",
    patientName: "Anaya Kapoor",
    date: todayStr,
    tasks: [
      { id: "t_23", category: "school", title: "Pick Up from School", description: "Pick up from Shikshantar School gate at 2:45 PM. Carry ID card.", scheduledTime: "14:45", isCompleted: true, completedAt: "14:50" },
      { id: "t_24", category: "feeding", title: "After-School Snack", description: "Prepare light snack — bread butter, juice. Ask what she wants.", scheduledTime: "15:15", isCompleted: true, completedAt: "15:20" },
      { id: "t_25", category: "learning", title: "Homework Help", description: "Class 4 Maths (fractions) and English (essay writing). Be patient.", scheduledTime: "15:45", isCompleted: false },
      { id: "t_26", category: "engagement", title: "Dance Practice", description: "Anaya has dance class coming up. Help her practice Bharatanatyam routine.", scheduledTime: "16:30", isCompleted: false },
      { id: "t_27", category: "physical_activity", title: "Cycling in Park", description: "Supervise cycling in society park for 20 minutes. Helmet mandatory.", scheduledTime: "17:15", isCompleted: false },
    ],
  },
];

// =============================================
// MOCK MEDICATION LOG
// =============================================
export const mockMedications: MedicationLog[] = [
  { id: "med_01", patientId: "pat_01", patientName: "Sunita Devi", medicine: "Telmisartan 40mg", dosage: "1 tablet", frequency: "Once daily (morning)", scheduledTime: "08:00", status: "taken", date: todayStr, notes: "Taken with water after breakfast" },
  { id: "med_02", patientId: "pat_01", patientName: "Sunita Devi", medicine: "Metformin 500mg", dosage: "1 tablet", frequency: "Twice daily", scheduledTime: "08:00", status: "taken", date: todayStr },
  { id: "med_03", patientId: "pat_01", patientName: "Sunita Devi", medicine: "Metformin 500mg", dosage: "1 tablet", frequency: "Twice daily", scheduledTime: "13:00", status: "upcoming", date: todayStr },
  { id: "med_04", patientId: "pat_01", patientName: "Sunita Devi", medicine: "Atorvastatin 10mg", dosage: "1 tablet", frequency: "Once daily (bedtime)", scheduledTime: "21:00", status: "upcoming", date: todayStr },
  { id: "med_05", patientId: "pat_03", patientName: "Meena Agarwal", medicine: "Donepezil 10mg", dosage: "1 tablet", frequency: "Once daily (morning)", scheduledTime: "14:15", status: "taken", date: todayStr, notes: "Must take with food" },
  { id: "med_06", patientId: "pat_03", patientName: "Meena Agarwal", medicine: "Donepezil 5mg", dosage: "1 tablet", frequency: "Once daily (evening)", scheduledTime: "19:30", status: "upcoming", date: todayStr },
  { id: "med_07", patientId: "pat_03", patientName: "Meena Agarwal", medicine: "Ibuprofen 400mg", dosage: "1 tablet", frequency: "As needed for arthritis pain", scheduledTime: "19:30", status: "upcoming", date: todayStr },
  { id: "med_08", patientId: "pat_05", patientName: "Kamla Sharma", medicine: "Insulin Glargine", dosage: "20 units", frequency: "Once daily (morning)", scheduledTime: "07:00", status: "upcoming", date: tomorrowStr },
  { id: "med_09", patientId: "pat_05", patientName: "Kamla Sharma", medicine: "Aspirin 75mg", dosage: "1 tablet", frequency: "Once daily", scheduledTime: "08:00", status: "upcoming", date: tomorrowStr },
  { id: "med_06_missed", patientId: "pat_01", patientName: "Sunita Devi", medicine: "Calcium + Vitamin D", dosage: "1 tablet", frequency: "Once daily (after lunch)", scheduledTime: "13:30", status: "missed", date: yesterdayStr, notes: "Patient was sleeping. Family notified." },
];

// =============================================
// MOCK NOTIFICATIONS
// =============================================
export const mockNotifications: Notification[] = [
  { id: "n_01", title: "New Shift Assigned", message: "You have been assigned to Kamla Sharma for tomorrow, 8:00 AM - 2:00 PM. Medical Attendant service.", type: "assignment", isRead: false, createdAt: new Date(today.getTime() - 1800000).toISOString() },
  { id: "n_02", title: "Shift Completed", message: "Your shift for Sunita Devi (RA384721) has been marked as completed. ₹700 earned.", type: "status", isRead: false, createdAt: new Date(today.getTime() - 7200000).toISOString() },
  { id: "n_03", title: "Payment Processed", message: "Payment of ₹9,500 for last week's shifts has been processed and will be credited within 48 hours.", type: "payment", isRead: false, createdAt: new Date(today.getTime() - 86400000).toISOString() },
  { id: "n_04", title: "Verification Approved", message: "Your Police Verification has been approved. All verifications are now complete.", type: "verification", isRead: true, createdAt: new Date(today.getTime() - 259200000).toISOString() },
  { id: "n_05", title: "Schedule Update", message: "Meena Agarwal's family has changed the Thursday shift to Friday 2-8 PM.", type: "info", isRead: true, createdAt: new Date(today.getTime() - 345600000).toISOString() },
  { id: "n_06", title: "Shift Cancelled", message: "Shift for Meena Agarwal (RA384690) from yesterday has been cancelled by family.", type: "status", isRead: true, createdAt: new Date(today.getTime() - 432000000).toISOString() },
];

// =============================================
// MOCK EARNINGS RECORDS
// =============================================
export const mockEarnings: EarningRecord[] = [
  { id: "e_01", bookingId: "RA384721", patientName: "Sunita Devi", serviceType: "Full-Time 24hr Care", date: todayStr, amount: 700, status: "paid" },
  { id: "e_02", bookingId: "RA384710", patientName: "Rajesh Kumar", serviceType: "Post-Hospitalisation Care", date: yesterdayStr, amount: 650, status: "paid" },
  { id: "e_03", bookingId: "RA384695", patientName: "Sunita Devi", serviceType: "Full-Time 24hr Care", date: yesterdayStr, amount: 900, status: "paid" },
  { id: "e_04", bookingId: "RA384680", patientName: "Kamla Sharma", serviceType: "Medical Attendant", date: new Date(today.getTime() - 2 * 86400000).toISOString().split("T")[0], amount: 600, status: "paid" },
  { id: "e_05", bookingId: "RA384670", patientName: "Harish Chandra", serviceType: "Companionship & Care", date: new Date(today.getTime() - 2 * 86400000).toISOString().split("T")[0], amount: 450, status: "paid" },
  { id: "e_06", bookingId: "RA384660", patientName: "Meena Agarwal", serviceType: "Dementia/Alzheimer's Care", date: new Date(today.getTime() - 3 * 86400000).toISOString().split("T")[0], amount: 800, status: "paid" },
  { id: "e_07", bookingId: "RA384650", patientName: "Sunita Devi", serviceType: "Full-Time 24hr Care", date: new Date(today.getTime() - 3 * 86400000).toISOString().split("T")[0], amount: 700, status: "processing" },
  { id: "e_08", bookingId: "RA384640", patientName: "Rajesh Kumar", serviceType: "Post-Hospitalisation Care", date: new Date(today.getTime() - 4 * 86400000).toISOString().split("T")[0], amount: 650, status: "paid" },
  { id: "e_09", bookingId: "RA384630", patientName: "Kamla Sharma", serviceType: "Medical Attendant", date: new Date(today.getTime() - 5 * 86400000).toISOString().split("T")[0], amount: 600, status: "pending" },
  { id: "e_10", bookingId: "RA384620", patientName: "Om Prakash", serviceType: "Medical Attendant", date: new Date(today.getTime() - 5 * 86400000).toISOString().split("T")[0], amount: 500, status: "pending" },
  { id: "e_11", bookingId: "RA384610", patientName: "Meena Agarwal", serviceType: "Dementia/Alzheimer's Care", date: new Date(today.getTime() - 6 * 86400000).toISOString().split("T")[0], amount: 800, status: "paid" },
  { id: "e_12", bookingId: "RA384600", patientName: "Sunita Devi", serviceType: "Full-Time 24hr Care", date: new Date(today.getTime() - 7 * 86400000).toISOString().split("T")[0], amount: 700, status: "paid" },
];

// =============================================
// MONTHLY EARNINGS CHART DATA
// =============================================
export const mockMonthlyEarnings = [
  { month: "Jan", earnings: 24500 },
  { month: "Feb", earnings: 26800 },
  { month: "Mar", earnings: 31200 },
  { month: "Apr", earnings: 28500 },
  { month: "May", earnings: 29800 },
  { month: "Jun", earnings: 32400 },
  { month: "Jul", earnings: 28500 },
];

export const mockWeeklyEarnings = [
  { day: "Mon", earnings: 1200 },
  { day: "Tue", earnings: 1400 },
  { day: "Wed", earnings: 0 },
  { day: "Thu", earnings: 1600 },
  { day: "Fri", earnings: 1300 },
  { day: "Sat", earnings: 900 },
  { day: "Sun", earnings: 0 },
];
