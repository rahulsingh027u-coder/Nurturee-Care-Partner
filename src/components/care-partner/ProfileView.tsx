'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  UserCircle,
  Star,
  MapPin,
  Phone,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Edit3,
  Save,
  X,
  Camera,
  Award,
  FileCheck,
  Heart,
  Globe,
  Briefcase,
  Send,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  Ban,
  Stethoscope,
  GraduationCap,
  Sparkles,
  TrendingUp,
  BadgeCheck,
  IndianRupee,
  Activity,
  Pencil,
  Plus,
  Minus,
  ChevronDown,
  MessageSquare,
  PhoneCall,
  Siren,
} from 'lucide-react';
import { mockCarePartner, mockShifts, mockReviews } from '@/lib/care-partner-data';
import SOSEmergencyDialog from './SOSEmergencyDialog';
import { getStoredOnboarding, SKILLS_CATALOG, SERVICES_CATALOG } from '@/lib/onboarding-data';
import type { SkillLevel } from '@/lib/onboarding-data';
import { VERIFICATION_STORAGE_KEY, STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION } from '@/lib/constants';

interface SelectedSkill {
  name: string;
  level: SkillLevel;
  years: number;
}

const LEVEL_CONFIG: Record<SkillLevel, { color: string; bg: string; border: string; label: string }> = {
  expert: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Expert' },
  advanced: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Advanced' },
  intermediate: { color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', label: 'Intermediate' },
  beginner: { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Beginner' },
};

interface SelectedService {
  name: string;
  description: string;
}

type VerificationType = 'aadhaar' | 'police' | 'medical' | 'video';
type VerificationStatus = 'not_started' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'max_attempts_reached';

interface VerificationDoc {
  id: string;
  type: VerificationType;
  status: VerificationStatus;
  attempts: Array<{
    attemptNumber: number;
    submittedAt: string;
    documents: Array<{ id: string; name: string; size: number; type: string }>;
    formFields: Record<string, string>;
    status: VerificationStatus;
    reviewedAt?: string;
  }>;
  currentDraft: { documents: Array<{ id: string; name: string; size: number; type: string }>; formFields: Record<string, string> };
}

interface ProfileViewProps {
  onNavigate?: (view: string) => void;
}

export default function ProfileView({ onNavigate }: ProfileViewProps) {
  // Read onboarding data if available (filled during signup wizard)
  const onboardingData = typeof window !== 'undefined' ? getStoredOnboarding() : null;

  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editingSkills, setEditingSkills] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>(
    onboardingData?.skills?.map((s) => ({ name: s.name, level: s.level, years: s.years })) ||
      mockCarePartner.specialistProfile?.skills?.map((s) => ({ name: s.name, level: s.level, years: s.years })) || []
  );
  const [customSkillName, setCustomSkillName] = useState('');
  const [editingServices, setEditingServices] = useState(false);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    onboardingData?.services?.map((s) => ({ name: s.name, description: s.description })) ||
      mockCarePartner.specialistProfile?.services?.map((s) => ({ name: s.name, description: s.description })) || []
  );
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServiceDescription, setCustomServiceDescription] = useState('');
  const [editingCerts, setEditingCerts] = useState(false);
  const [certifications, setCertifications] = useState<
    Array<{ name: string; issuer: string; year: number; featured: boolean }>
  >(
    onboardingData?.certifications?.map((c) => ({ ...c, featured: false })) ||
      mockCarePartner.specialistProfile?.certifications?.map((c) => ({ ...c, featured: false })) || []
  );
  const [newCertName, setNewCertName] = useState('');
  const [newCertIssuer, setNewCertIssuer] = useState('');
  const [newCertYear, setNewCertYear] = useState('');
  const [profile, setProfile] = useState({
    name: onboardingData?.name || mockCarePartner.name,
    email: onboardingData?.email || mockCarePartner.email,
    phone: onboardingData?.phone || mockCarePartner.phone,
    experience: onboardingData?.experience || mockCarePartner.experience,
    qualifications: onboardingData?.qualifications || mockCarePartner.qualifications,
    languages: onboardingData?.languages || mockCarePartner.languages.join(', '),
    bio: onboardingData?.bio || mockCarePartner.bio,
  });
  const [availability, setAvailability] = useState(
    (onboardingData?.availability || mockCarePartner.availability).map((a) => ({ ...a }))
  );
  const [isAvailable, setIsAvailable] = useState(mockCarePartner.isAvailable);
  const [sosOpen, setSosOpen] = useState(false);

  // Read verification docs from localStorage — must match VerificationPage's storage format

  const getStoredVerificationDocs = (): VerificationDoc[] => {
    try {
      // Version check — if storage format is outdated, clear and start fresh
      const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
      if (storedVersion !== String(CURRENT_STORAGE_VERSION)) {
        localStorage.removeItem(VERIFICATION_STORAGE_KEY);
        localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION));
        // Fall through to fresh defaults
      } else {
        const stored = localStorage.getItem(VERIFICATION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length === 4) {
            return parsed;
          }
        }
      }
    } catch {
      // fall through
    }
    // Fresh defaults — all NOT started (no fake approved data)
    return [
      { id: 'v-aadhaar', type: 'aadhaar', status: 'not_started', attempts: [], currentDraft: { documents: [], formFields: {} } },
      { id: 'v-police', type: 'police', status: 'not_started', attempts: [], currentDraft: { documents: [], formFields: {} } },
      { id: 'v-medical', type: 'medical', status: 'not_started', attempts: [], currentDraft: { documents: [], formFields: {} } },
      { id: 'v-video', type: 'video', status: 'not_started', attempts: [], currentDraft: { documents: [], formFields: {} } },
    ];
  };

  const verificationDocs = useMemo(() => getStoredVerificationDocs(), []);

  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const specialtyLabels: Record<string, string> = {
    elder_care: 'Elder Care',
    child_care: 'Child Care',
    office_care: 'Office Care',
    day_care: 'Day Care',
    live_in_care: 'Live-in Care',
    hourly_care: 'Hourly Care',
  };
  const specialtyLabel = specialtyLabels[mockCarePartner.specialty] || 'Care';

  // Map verification docs to display items for the Verification Status card
  const verDisplay = [
    { title: 'Aadhaar Verification', type: 'aadhaar' as VerificationType, icon: Shield },
    { title: 'Police Verification', type: 'police' as VerificationType, icon: FileCheck },
    { title: 'Medical Fitness', type: 'medical' as VerificationType, icon: Heart },
    { title: 'Video Verification', type: 'video' as VerificationType, icon: UserCircle },
  ];

  const allVerified = verificationDocs.every((d) => d.status === 'approved');
  const hasUnverified = verificationDocs.some((d) => d.status !== 'approved');
  const activeCount = verificationDocs.filter((d) => d.status === 'submitted' || d.status === 'under_review').length;
  const lockedCount = verificationDocs.filter((d) => d.status === 'max_attempts_reached').length;

  // ─── Dynamic Stats (computed from shifts, reviews, profile) ──────────
  // Shifts Done = count of completed shifts
  const completedShifts = mockShifts.filter((s) => s.status === 'completed').length;
  // Active = in_progress shifts right now
  const activeAssignments = mockShifts.filter((s) => s.status === 'in_progress').length;
  // Repeat Clients = patients who appear in 2+ completed shifts
  const patientShiftCounts = new Map<string, number>();
  for (const shift of mockShifts) {
    if (shift.status === 'completed') {
      patientShiftCounts.set(shift.patientId, (patientShiftCounts.get(shift.patientId) || 0) + 1);
    }
  }
  const repeatClients = Array.from(patientShiftCounts.values()).filter((count) => count >= 2).length;
  // Rating = average from reviews
  const totalReviews = mockReviews.length;
  const ratingSum = mockReviews.reduce((acc, rv) => acc + rv.rating, 0);
  const averageRating = totalReviews > 0 ? ratingSum / totalReviews : 0;
  // Years Active = from profile experience
  const yearsActive = profile.experience;

  const getStatusDisplay = (status: VerificationStatus) => {
    switch (status) {
      case 'approved':
        return { label: 'Verified', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle };
      case 'submitted':
        return { label: 'Submitted', color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: Send };
      case 'under_review':
        return { label: 'Under Review', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock };
      case 'rejected':
        return { label: 'Rejected', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle };
      case 'max_attempts_reached':
        return { label: 'Locked', color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-300', icon: Ban };
      default:
        return { label: 'Not Verified', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200', icon: XCircle };
    }
  };

  const handleSave = () => setIsEditing(false);

  const handleCancel = () => {
    setProfile({
      name: onboardingData?.name || mockCarePartner.name,
      email: onboardingData?.email || mockCarePartner.email,
      phone: onboardingData?.phone || mockCarePartner.phone,
      experience: onboardingData?.experience || mockCarePartner.experience,
      qualifications: onboardingData?.qualifications || mockCarePartner.qualifications,
      languages: onboardingData?.languages || mockCarePartner.languages.join(', '),
      bio: onboardingData?.bio || mockCarePartner.bio,
    });
    setIsEditing(false);
  };

  // ─── Skills Management ──────────────────────────────────────────────────

  const isSkillSelected = (name: string) => selectedSkills.some((s) => s.name === name);

  const toggleSkill = (name: string) => {
    setSelectedSkills((prev) => {
      if (prev.some((s) => s.name === name)) {
        return prev.filter((s) => s.name !== name);
      }
      return [...prev, { name, level: 'intermediate' as SkillLevel, years: 1 }];
    });
  };

  const updateSkillLevel = (name: string, level: SkillLevel) => {
    setSelectedSkills((prev) =>
      prev.map((s) => (s.name === name ? { ...s, level } : s))
    );
  };

  const updateSkillYears = (name: string, years: number) => {
    setSelectedSkills((prev) =>
      prev.map((s) => (s.name === name ? { ...s, years: Math.max(0, Math.min(50, years)) } : s))
    );
  };

  const handleSaveSkills = () => {
    // In production this would save to backend
    setEditingSkills(false);
  };

  const addCustomSkill = () => {
    const trimmed = customSkillName.trim();
    if (!trimmed || isSkillSelected(trimmed)) return;
    setSelectedSkills((prev) => [...prev, { name: trimmed, level: 'intermediate' as SkillLevel, years: 1 }]);
    setCustomSkillName('');
  };

  const handleCancelSkills = () => {
    setSelectedSkills(
      onboardingData?.skills?.map((s) => ({ name: s.name, level: s.level, years: s.years })) ||
        mockCarePartner.specialistProfile?.skills?.map((s) => ({ name: s.name, level: s.level, years: s.years })) || []
    );
    setCustomSkillName('');
    setEditingSkills(false);
  };

  // Group catalog skills by category (excluding already selected)
  const getCatalogByCategory = () => {
    const unselected = SKILLS_CATALOG.filter((s) => !isSkillSelected(s.name));
    const grouped: Record<string, typeof SKILLS_CATALOG[number][]> = {};
    for (const skill of unselected) {
      const cat = skill.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(skill);
    }
    return grouped;
  };

  // ─── Services Management ─────────────────────────────────────────────────

  const isServiceSelected = (name: string) => selectedServices.some((s) => s.name === name);

  const toggleService = (name: string, description: string) => {
    setSelectedServices((prev) => {
      if (prev.some((s) => s.name === name)) {
        return prev.filter((s) => s.name !== name);
      }
      return [...prev, { name, description }];
    });
  };

  const handleSaveServices = () => {
    setEditingServices(false);
  };

  const addCustomService = () => {
    const name = customServiceName.trim();
    if (!name || isServiceSelected(name)) return;
    setSelectedServices((prev) => [...prev, { name, description: customServiceDescription.trim() || 'Custom service' }]);
    setCustomServiceName('');
    setCustomServiceDescription('');
  };

  const handleCancelServices = () => {
    setSelectedServices(
      onboardingData?.services?.map((s) => ({ name: s.name, description: s.description })) ||
        mockCarePartner.specialistProfile?.services?.map((s) => ({ name: s.name, description: s.description })) || []
    );
    setCustomServiceName('');
    setCustomServiceDescription('');
    setEditingServices(false);
  };

  const getServicesCatalogByCategory = () => {
    const unselected = SERVICES_CATALOG.filter((s) => !isServiceSelected(s.name));
    const grouped: Record<string, typeof SERVICES_CATALOG[number][]> = {};
    for (const service of unselected) {
      const cat = service.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(service);
    }
    return grouped;
  };

  // ─── Certifications Management ────────────────────────────────────────

  const featuredCount = certifications.filter((c) => c.featured).length;

  const toggleFeatured = (name: string) => {
    setCertifications((prev) =>
      prev.map((c) => {
        if (c.name !== name) return c;
        if (c.featured) return { ...c, featured: false };
        if (featuredCount >= 2) return c; // max 2 featured
        return { ...c, featured: true };
      })
    );
  };

  const removeCertification = (name: string) => {
    setCertifications((prev) => prev.filter((c) => c.name !== name));
  };

  const addCertification = () => {
    const name = newCertName.trim();
    const issuer = newCertIssuer.trim();
    const year = parseInt(newCertYear.trim(), 10);
    if (!name || !issuer || !year || year < 1950 || year > new Date().getFullYear() + 1) return;
    if (certifications.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    setCertifications((prev) => [...prev, { name, issuer, year, featured: false }]);
    setNewCertName('');
    setNewCertIssuer('');
    setNewCertYear('');
  };

  const handleSaveCerts = () => {
    // In production this would send to backend for verification
    // Verified certs become trust badges on the profile
    setEditingCerts(false);
  };

  const handleCancelCerts = () => {
    setCertifications(
      onboardingData?.certifications?.map((c) => ({ ...c, featured: false })) ||
        mockCarePartner.specialistProfile?.certifications?.map((c) => ({ ...c, featured: false })) || []
    );
    setNewCertName('');
    setNewCertIssuer('');
    setNewCertYear('');
    setEditingCerts(false);
  };

  const toggleDayAvailability = (index: number) => {
    setAvailability((prev) =>
      prev.map((day, i) => (i === index ? { ...day, isAvailable: !day.isAvailable } : day))
    );
  };

  const handleOpenVerification = () => {
    if (onNavigate) {
      onNavigate('verification');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Section 1: Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="size-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl font-bold flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="size-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                {isEditing && (
                  <label className="absolute -bottom-1 -right-1 size-7 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
                    <Camera className="size-3.5 text-gray-500" />
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setAvatarUrl(ev.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-xs font-mono text-gray-400">{mockCarePartner.carePartnerId}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge className="bg-blue-50 text-blue-700 rounded-full px-3 py-1 hover:bg-blue-100 border-0">
                    {specialtyLabel}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="size-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-medium text-gray-700">{averageRating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({totalReviews} reviews)</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 pt-0.5">
                  <MapPin className="size-3.5" />
                  <span>{mockCarePartner.area}</span>
                </div>
              </div>
            </div>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                <Edit3 className="size-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} className="gap-2">
                  <Save className="size-4" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2">
                  <X className="size-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Personal Information Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="size-5 text-gray-400" />
              Personal Information
            </CardTitle>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5 text-gray-500 hover:text-gray-700">
                <Edit3 className="size-3.5" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Full Name', value: profile.name },
                { label: 'Email', value: profile.email, icon: Mail },
                { label: 'Phone', value: profile.phone, icon: Phone },
                { label: 'Experience', value: `${profile.experience} years` },
                { label: 'Qualifications', value: profile.qualifications },
                { label: 'Languages', value: profile.languages, icon: Globe },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{item.label}</p>
                  <div className="flex items-center gap-1.5">
                    {'icon' in item && item.icon && <item.icon className="size-3.5 text-gray-400" />}
                    <p className="text-sm font-medium text-gray-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { id: 'edit-name', label: 'Full Name', value: profile.name, key: 'name' as const, type: 'text' },
                { id: 'edit-email', label: 'Email', value: profile.email, key: 'email' as const, type: 'email' },
                { id: 'edit-phone', label: 'Phone', value: profile.phone, key: 'phone' as const, type: 'tel' },
                { id: 'edit-experience', label: 'Experience (years)', value: profile.experience, key: 'experience' as const, type: 'number' },
              ].map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id} className="text-xs font-medium text-gray-500">{field.label}</Label>
                  <Input
                    id={field.id}
                    type={field.type}
                    value={field.value}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-qualifications" className="text-xs font-medium text-gray-500">Qualifications</Label>
                <Input
                  id="edit-qualifications"
                  value={profile.qualifications}
                  onChange={(e) => setProfile((p) => ({ ...p, qualifications: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-languages" className="text-xs font-medium text-gray-500">Languages (comma-separated)</Label>
                <Input
                  id="edit-languages"
                  value={profile.languages}
                  onChange={(e) => setProfile((p) => ({ ...p, languages: e.target.value }))}
                  placeholder="English, Hindi, Punjabi"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Specialist Profile Card */}
      {mockCarePartner.specialistProfile && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Stethoscope className="size-5 text-gray-400" />
                {mockCarePartner.specialistProfile.title}
              </CardTitle>
              <Badge className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full px-3 py-1 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/60">
                <Sparkles className="size-3 mr-1" />
                {specialtyLabel}
              </Badge>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-6 space-y-6">
            {/* Tagline */}
            <p className="text-sm text-gray-600 leading-relaxed">{mockCarePartner.specialistProfile.tagline}</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { label: 'Shifts Done', value: completedShifts.toLocaleString('en-IN'), icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Active', value: activeAssignments, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Repeat Clients', value: repeatClients, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Rating', value: averageRating.toFixed(1), icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Reviews', value: totalReviews, icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Years', value: yearsActive, icon: GraduationCap, color: 'text-teal-600', bg: 'bg-teal-50' },
              ].map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div key={stat.label} className="text-center rounded-xl border border-gray-100 bg-white p-3">
                    <div className={`size-8 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-1.5`}>
                      <StatIcon className={`size-4 ${stat.color}`} />
                    </div>
                    <p className="text-base font-bold text-gray-900">{stat.value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Skills */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="size-4 text-gray-400" />
                  Core Skills & Expertise
                  {selectedSkills.length > 0 && (
                    <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200 bg-gray-50 px-1.5 py-0">
                      {selectedSkills.length} selected
                    </Badge>
                  )}
                </h3>
                {!editingSkills ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSkills(true)}
                    className="gap-1.5 text-gray-500 hover:text-blue-600 h-7 px-2"
                  >
                    <Pencil className="size-3" />
                    <span className="text-xs">Edit</span>
                  </Button>
                ) : (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelSkills}
                      className="text-gray-500 hover:text-gray-700 h-7 px-2"
                    >
                      <span className="text-xs">Cancel</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveSkills}
                      className="gap-1 h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      <Save className="size-3" />
                      Save
                    </Button>
                  </div>
                )}
              </div>

              {!editingSkills ? (
                /* ─── View Mode: Skill badges ─── */
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No skills added yet. Tap Edit to add your skills.</p>
                  ) : (
                    selectedSkills.map((skill) => {
                      const lvl = LEVEL_CONFIG[skill.level];
                      return (
                        <div
                          key={skill.name}
                          className={`inline-flex items-center gap-1.5 rounded-lg border ${lvl.border} ${lvl.bg} px-3 py-1.5 cursor-default`}
                        >
                          <BadgeCheck className={`size-3.5 ${lvl.color}`} />
                          <span className={`text-xs font-medium ${lvl.color}`}>{skill.name}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{skill.years}y</span>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* ─── Edit Mode: Selected skills with level/years + catalog ─── */
                <div className="space-y-4">
                  {/* Already selected skills — editable cards */}
                  {selectedSkills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Your Skills</p>
                      {selectedSkills.map((skill) => {
                        const lvl = LEVEL_CONFIG[skill.level];
                        return (
                          <div
                            key={skill.name}
                            className={`flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border ${lvl.border} ${lvl.bg} p-3`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <BadgeCheck className={`size-4 ${lvl.color} shrink-0`} />
                              <span className="text-sm font-medium text-gray-900 truncate">{skill.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Level dropdown */}
                              <div className="relative">
                                <select
                                  value={skill.level}
                                  onChange={(e) => updateSkillLevel(skill.name, e.target.value as SkillLevel)}
                                  className={`appearance-none rounded-lg border ${lvl.border} bg-white px-2.5 py-1.5 pr-7 text-xs font-medium ${lvl.color} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                >
                                  <option value="beginner">Beginner</option>
                                  <option value="intermediate">Intermediate</option>
                                  <option value="advanced">Advanced</option>
                                  <option value="expert">Expert</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 pointer-events-none text-gray-400" />
                              </div>
                              {/* Years input */}
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min={0}
                                  max={50}
                                  value={skill.years}
                                  onChange={(e) => updateSkillYears(skill.name, parseInt(e.target.value) || 0)}
                                  className="w-14 h-8 text-xs text-center rounded-lg border-gray-200"
                                />
                                <span className="text-[10px] text-gray-400 font-medium">yrs</span>
                              </div>
                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => toggleSkill(skill.name)}
                                className="flex items-center justify-center size-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Minus className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add more skills from catalog */}
                  {(() => {
                    const catalog = getCatalogByCategory();
                    const hasCatalog = Object.keys(catalog).length > 0;
                    if (!hasCatalog) return null;
                    return (
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Add More Skills</p>
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-3 max-h-60 overflow-y-auto">
                          {Object.entries(catalog).map(([category, skills]) => (
                            <div key={category} className="mb-3 last:mb-0">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{category}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {skills.map((skill) => (
                                  <button
                                    key={skill.name}
                                    type="button"
                                    onClick={() => toggleSkill(skill.name)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors active:scale-[0.97]"
                                  >
                                    <Plus className="size-3" />
                                    {skill.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Add custom skill (Other) */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Other</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={customSkillName}
                        onChange={(e) => setCustomSkillName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }}
                        placeholder="Type a custom skill name..."
                        className="flex-1 h-9 text-sm rounded-lg border-gray-200"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCustomSkill}
                        disabled={!customSkillName.trim() || isSkillSelected(customSkillName.trim())}
                        className="gap-1.5 h-9 px-3 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="size-3.5" />
                        <span className="text-xs">Add</span>
                      </Button>
                    </div>
                    {customSkillName.trim() && isSkillSelected(customSkillName.trim()) && (
                      <p className="text-[10px] text-amber-600">This skill is already in your list.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Services Offered */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <IndianRupee className="size-4 text-gray-400" />
                  Services Offered
                  {selectedServices.length > 0 && (
                    <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200 bg-gray-50 px-1.5 py-0">
                      {selectedServices.length} active
                    </Badge>
                  )}
                </h3>
                {!editingServices ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingServices(true)}
                    className="gap-1.5 text-gray-500 hover:text-blue-600 h-7 px-2"
                  >
                    <Pencil className="size-3" />
                    <span className="text-xs">Edit</span>
                  </Button>
                ) : (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelServices}
                      className="text-gray-500 hover:text-gray-700 h-7 px-2"
                    >
                      <span className="text-xs">Cancel</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveServices}
                      className="gap-1 h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      <Save className="size-3" />
                      Save
                    </Button>
                  </div>
                )}
              </div>

              {!editingServices ? (
                /* ─── View Mode ─── */
                <div className="space-y-2">
                  {selectedServices.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No services added yet. Tap Edit to add services you offer.</p>
                  ) : (
                    selectedServices.map((service) => (
                      <div
                        key={service.name}
                        className="rounded-lg border border-gray-100 bg-white p-3 hover:border-gray-200 hover:shadow-sm transition-all"
                      >
                        <p className="text-sm font-medium text-gray-900">{service.name}</p>
                        <p className="text-xs text-gray-500 truncate">{service.description}</p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* ─── Edit Mode ─── */
                <div className="space-y-4">
                  {/* Selected services — removable cards */}
                  {selectedServices.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Your Services</p>
                      {selectedServices.map((service) => (
                        <div
                          key={service.name}
                          className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/30 p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{service.name}</p>
                            <p className="text-xs text-gray-500 truncate">{service.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleService(service.name, service.description)}
                            className="flex items-center justify-center size-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                          >
                            <Minus className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add more services from catalog */}
                  {(() => {
                    const catalog = getServicesCatalogByCategory();
                    const hasCatalog = Object.keys(catalog).length > 0;
                    if (!hasCatalog) return null;
                    return (
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Add More Services</p>
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-3 max-h-60 overflow-y-auto">
                          {Object.entries(catalog).map(([category, services]) => (
                            <div key={category} className="mb-3 last:mb-0">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{category}</p>
                              <div className="flex flex-col gap-1.5">
                                {services.map((service) => (
                                  <button
                                    key={service.name}
                                    type="button"
                                    onClick={() => toggleService(service.name, service.description)}
                                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2.5 text-left hover:border-blue-300 hover:bg-blue-50 transition-colors active:scale-[0.99]"
                                  >
                                    <div className="size-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                                      <Plus className="size-3 text-blue-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-700">{service.name}</p>
                                      <p className="text-[10px] text-gray-400 truncate">{service.description}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Add custom service (Other) */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Other</p>
                    <div className="space-y-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={customServiceName}
                          onChange={(e) => setCustomServiceName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomService(); } }}
                          placeholder="Service name..."
                          className="flex-1 h-9 text-sm rounded-lg border-gray-200"
                        />
                      </div>
                      <Input
                        type="text"
                        value={customServiceDescription}
                        onChange={(e) => setCustomServiceDescription(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomService(); } }}
                        placeholder="Short description (optional)..."
                        className="h-9 text-sm rounded-lg border-gray-200"
                      />
                      <div className="flex items-center justify-between">
                        {customServiceName.trim() && isServiceSelected(customServiceName.trim()) && (
                          <p className="text-[10px] text-amber-600">This service is already in your list.</p>
                        )}
                        <div className="ml-auto">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addCustomService}
                            disabled={!customServiceName.trim() || isServiceSelected(customServiceName.trim())}
                            className="gap-1.5 h-8 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="size-3.5" />
                            <span className="text-xs">Add Service</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reviews & Ratings */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="size-4 text-gray-400" />
                  Reviews & Ratings
                  {totalReviews > 0 && (
                    <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200 bg-gray-50 px-1.5 py-0">
                      {totalReviews} reviews
                    </Badge>
                  )}
                </h3>
                {totalReviews > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="size-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold text-gray-900">{averageRating.toFixed(1)}</span>
                    <span className="text-[10px] text-gray-400">/ 5</span>
                  </div>
                )}
              </div>

              {totalReviews === 0 ? (
                <p className="text-xs text-gray-400 italic">No reviews yet. Reviews from customers will appear here.</p>
              ) : (
                <>
                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                    {mockReviews
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((review) => (
                        <div
                          key={review.id}
                          className="rounded-lg border border-gray-100 bg-white p-3 hover:border-gray-200 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 text-[10px] font-bold flex items-center justify-center">
                                {review.patientName.split(' ').map((n) => n[0]).join('')}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-900">{review.patientName}</p>
                                {review.serviceType && (
                                  <p className="text-[10px] text-gray-400">{review.serviceType}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`size-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{review.comment}</p>
                          <p className="text-[10px] text-gray-400 mt-1.5">
                            {new Date(review.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      ))}
                  </div>
                  {totalReviews > 5 && (
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400 bg-gray-50 rounded-lg py-2.5 px-3 border border-dashed border-gray-200">
                      <ArrowUpRight className="size-3" />
                      <span>Showing latest 5 of {totalReviews} reviews</span>
                    </div>
                  )}
                  <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-indigo-500 bg-indigo-50 rounded-lg py-2.5 px-3">
                    <Globe className="size-3" />
                    <span className="font-medium">View all reviews on Customer App</span>
                  </div>
                </>
              )}
            </div>

            {/* Certifications */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="size-4 text-gray-400" />
                  Certifications & Training
                  {certifications.length > 0 && (
                    <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200 bg-gray-50 px-1.5 py-0">
                      {certifications.length} added
                    </Badge>
                  )}
                  {featuredCount > 0 && (
                    <Badge className="text-[10px] text-amber-700 border-amber-200 bg-amber-50 px-1.5 py-0">
                      {featuredCount} featured
                    </Badge>
                  )}
                </h3>
                {!editingCerts ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingCerts(true)}
                    className="gap-1.5 text-gray-500 hover:text-blue-600 h-7 px-2"
                  >
                    <Pencil className="size-3" />
                    <span className="text-xs">Edit</span>
                  </Button>
                ) : (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelCerts}
                      className="text-gray-500 hover:text-gray-700 h-7 px-2"
                    >
                      <span className="text-xs">Cancel</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveCerts}
                      className="gap-1 h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      <Save className="size-3" />
                      Save
                    </Button>
                  </div>
                )}
              </div>

              {!editingCerts ? (
                /* ─── View Mode ─── */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {certifications.length === 0 ? (
                    <p className="text-xs text-gray-400 italic col-span-full">No certifications added yet. Tap Edit to add your certifications.</p>
                  ) : (
                    certifications.map((cert) => (
                      <div
                        key={cert.name}
                        className={`flex items-start gap-3 rounded-lg border p-3 transition-all ${
                          cert.featured
                            ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm'
                            : 'border-gray-100 bg-white'
                        }`}
                      >
                        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          cert.featured ? 'bg-amber-100' : 'bg-emerald-50'
                        }`}>
                          {cert.featured ? (
                            <Award className="size-4 text-amber-600" />
                          ) : (
                            <BadgeCheck className="size-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-gray-900">{cert.name}</p>
                            {cert.featured && (
                              <Badge className="text-[9px] leading-none text-amber-700 border-amber-200 bg-amber-100 px-1 py-0 h-3.5">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500">{cert.issuer}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{cert.year}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* ─── Edit Mode ─── */
                <div className="space-y-3">
                  {/* Info note */}
                  <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 p-2.5">
                    <AlertCircle className="size-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      Add your certifications below. You can feature up to 2 on your profile — these will be displayed as trust badges once verified by our team.
                    </p>
                  </div>

                  {/* Existing certs list */}
                  <div className="space-y-2">
                    {certifications.map((cert) => (
                      <div
                        key={cert.name}
                        className={`rounded-lg border p-3 transition-all ${
                          cert.featured
                            ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-white'
                            : 'border-gray-100 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-xs font-semibold text-gray-900">{cert.name}</p>
                              {cert.featured && (
                                <Badge className="text-[9px] leading-none text-amber-700 border-amber-200 bg-amber-100 px-1 py-0 h-3.5">
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500">{cert.issuer} &middot; {cert.year}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant={cert.featured ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleFeatured(cert.name)}
                              disabled={!cert.featured && featuredCount >= 2}
                              className={`gap-1 h-7 px-2 text-[10px] ${
                                cert.featured
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                                  : 'text-gray-500 border-gray-200 hover:text-amber-600 hover:border-amber-300'
                              } ${!cert.featured && featuredCount >= 2 ? 'opacity-40 cursor-not-allowed' : ''}`}
                              title={featuredCount >= 2 && !cert.featured ? 'Maximum 2 featured certifications reached' : 'Feature on profile'}
                            >
                              <Award className="size-3" />
                              {cert.featured ? 'Featured' : 'Feature'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCertification(cert.name)}
                              className="h-7 px-1.5 text-gray-400 hover:text-red-500"
                            >
                              <Minus className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add new certification form */}
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3 space-y-2">
                    <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                      <Plus className="size-3" />
                      Add New Certification
                    </p>
                    <div className="space-y-1.5">
                      <Input
                        placeholder="Certification name"
                        value={newCertName}
                        onChange={(e) => setNewCertName(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Input
                        placeholder="Issuing organization"
                        value={newCertIssuer}
                        onChange={(e) => setNewCertIssuer(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Input
                        placeholder="Year (e.g. 2024)"
                        value={newCertYear}
                        onChange={(e) => setNewCertYear(e.target.value)}
                        className="h-8 text-xs"
                        type="number"
                        min="1950"
                        max={new Date().getFullYear() + 1}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={addCertification}
                      disabled={!newCertName.trim() || !newCertIssuer.trim() || !newCertYear.trim()}
                      className="gap-1 h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs w-full"
                    >
                      <Plus className="size-3" />
                      Add Certification
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 4: Availability Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="size-5 text-gray-400" />
            Weekly Availability
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-medium text-gray-900">I am available for assignments</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isAvailable ? 'You will receive new assignment notifications' : 'You will not receive new assignments'}
              </p>
            </div>
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
          </div>
          <div className="space-y-2">
            {availability.map((day, index) => (
              <div
                key={day.day}
                className={`flex items-center justify-between p-3 rounded-lg border border-gray-100 transition-colors ${
                  day.isAvailable ? 'bg-blue-50/50' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${day.isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>{day.day}</span>
                  {day.isAvailable && <span className="text-xs text-gray-500">{day.startTime} - {day.endTime}</span>}
                </div>
                <Switch checked={day.isAvailable} onCheckedChange={() => toggleDayAvailability(index)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Verification Status Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="size-5 text-gray-400" />
              Verification Status
            </CardTitle>
            <Badge
              className={`rounded-full px-3 py-1 border ${
                allVerified
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : activeCount > 0
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : lockedCount > 0
                      ? 'bg-gray-100 text-gray-600 border-gray-300'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {allVerified ? 'Fully Verified' : activeCount > 0 ? 'In Progress' : lockedCount > 0 ? 'Verification Locked' : verificationDocs.some(d => d.status === 'approved') ? 'Partially Verified' : 'Not Verified'}
            </Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          {/* Table-like verification list with clear columns */}
          <div className="space-y-2">
            {/* Header row */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              <span>Document</span>
              <span className="text-center">Status</span>
              <span className="text-center">Attempts</span>
              <span className="text-center">Action</span>
            </div>
            {verDisplay.map((item) => {
              const doc = verificationDocs.find((d) => d.type === item.type);
              const status = getStatusDisplay(doc?.status || 'not_started');
              const StatusIcon = status.icon;
              const attemptsUsed = doc?.attempts?.length || 0;
              const isLocked = doc?.status === 'max_attempts_reached';
              const isApproved = doc?.status === 'approved';
              const isActive = doc?.status === 'submitted' || doc?.status === 'under_review';
              const needsUpload = doc?.status === 'not_started' || doc?.status === 'rejected';

              return (
                <div
                  key={item.title}
                  role="button"
                  tabIndex={0}
                  className={`rounded-xl border p-4 flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:items-center gap-3 transition-all ${
                    isApproved
                      ? 'border-emerald-100 bg-emerald-50/30 hover:border-emerald-200 hover:shadow-sm cursor-pointer'
                      : isActive
                        ? 'border-blue-100 bg-blue-50/30 hover:border-blue-200 hover:shadow-sm cursor-pointer'
                        : isLocked
                          ? 'border-red-100 bg-red-50/20 opacity-70'
                          : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm cursor-pointer'
                  }`}
                  onClick={handleOpenVerification}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenVerification(); } }}
                >
                  {/* Column 1: Document name + icon */}
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${status.bg}`}>
                      <item.icon className={`size-5 ${status.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-[11px] text-gray-400 sm:hidden">
                        <StatusIcon className={`size-3 inline mr-0.5 ${status.color}`} />
                        {status.label}
                      </p>
                    </div>
                  </div>

                  {/* Column 2: Status badge */}
                  <Badge
                    variant="outline"
                    className={`hidden sm:inline-flex text-[11px] px-2.5 py-0.5 ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isActive
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : isLocked
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <StatusIcon className="size-3 mr-1" />
                    {status.label}
                  </Badge>

                  {/* Column 3: Attempts dots */}
                  <div className="hidden sm:flex items-center justify-center gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className={`size-2.5 rounded-full border ${
                          i < attemptsUsed
                            ? doc?.attempts[i]?.status === 'rejected'
                              ? 'bg-red-400 border-red-300'
                              : doc?.attempts[i]?.status === 'approved'
                                ? 'bg-emerald-400 border-emerald-300'
                                : 'bg-blue-400 border-blue-300'
                            : 'bg-white border-gray-200'
                        }`}
                      />
                    ))}
                    <span className={`text-[10px] ml-1 font-medium ${
                      isLocked ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      {attemptsUsed}/3
                    </span>
                  </div>

                  {/* Column 4: Action button */}
                  <div className="hidden sm:flex justify-center">
                    {isApproved ? (
                      <span className="text-[11px] text-emerald-600 font-medium">✓ Done</span>
                    ) : isLocked ? (
                      <span className="text-[11px] text-red-500 font-medium">🔒 Locked</span>
                    ) : isActive ? (
                      <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                        <Loader2 className="size-3 animate-spin" />
                        In Review
                      </span>
                    ) : (
                      <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                        Upload
                        <ArrowUpRight className="size-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons — always visible so users can view their verification details */}
          <div className="mt-5 flex flex-col sm:flex-row justify-center gap-2">
            <Button
              onClick={handleOpenVerification}
              className={`gap-2 ${hasUnverified ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              <Shield className="size-4" />
              {allVerified ? 'View Verifications' : hasUnverified ? 'Manage Verifications' : 'Track Submission Status'}
            </Button>
            {(activeCount > 0 || lockedCount > 0) && (
              <Button variant="outline" className="gap-2" onClick={handleOpenVerification}>
                <Clock className="size-4" />
                Track Submission Status
              </Button>
            )}
          </div>

          {/* Tracking info for submitted docs */}
          {activeCount > 0 && (
            <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 p-3.5">
              <div className="flex items-start gap-2.5">
                <Send className="size-4 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-indigo-800">
                    {activeCount} document{activeCount > 1 ? 's' : ''} submitted to Nurturee
                  </p>
                  <p className="text-xs text-indigo-600 mt-0.5">
                    Our verification team will review within 24-48 hours. If rejected, you may re-upload (up to 3 attempts total per verification).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning for locked verifications */}
          {lockedCount > 0 && (
            <div className="mt-3 rounded-xl bg-red-50 border border-red-100 p-3.5">
              <div className="flex items-start gap-2.5">
                <Ban className="size-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-red-800">
                    {lockedCount} verification{lockedCount > 1 ? 's' : ''} permanently locked
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Maximum upload attempts reached. Please contact Nurturee support at{' '}
                    <span className="font-medium">support@nurturee.com</span> for assistance.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 6: About Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Award className="size-5 text-gray-400" />
            About
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          {!isEditing ? (
            <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="edit-bio" className="text-xs font-medium text-gray-500">Bio</Label>
              <Textarea
                id="edit-bio"
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                rows={4}
                placeholder="Tell us about yourself and your care partner experience..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 7: SOS Emergency Button */}
      <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-600/30">
            <Siren className="size-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-red-800 flex items-center gap-2">
              SOS — Emergency Alert
            </h3>
            <p className="text-xs text-red-600 font-medium mt-0.5 leading-relaxed">
              FOR EMERGENCY SITUATIONS ONLY
            </p>
            <p className="text-xs text-red-700/70 mt-1.5 leading-relaxed">
              Press this button to immediately alert the Nurturee emergency response team and notify the patient's emergency contact. Use only when the patient's health or safety is at serious, immediate risk.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 gap-2"
                onClick={() => setSosOpen(true)}
              >
                <Siren className="size-4" />
                Trigger SOS Alert
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-50 gap-2"
                onClick={() => {
                  window.open('tel:112', '_self')
                }}
              >
                <PhoneCall className="size-4" />
                Call Emergency 112
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* SOS Emergency Dialog */}
      <SOSEmergencyDialog
        open={sosOpen}
        onClose={() => setSosOpen(false)}
      />
    </div>
  );
}
