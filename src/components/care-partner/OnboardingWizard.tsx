'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Heart,
  Baby,
  Shield,
  Award,
  BadgeCheck,
  Plus,
  Minus,
  AlertCircle,
} from 'lucide-react';
import {
  SKILLS_CATALOG,
  SERVICES_CATALOG,
  DAYS_OF_WEEK,
  type SkillLevel,
  type OnboardingData,
  storeOnboarding,
} from '@/lib/onboarding-data';

const TOTAL_STEPS = 5;

const LEVEL_CONFIG: Record<SkillLevel, { color: string; bg: string; border: string; label: string }> = {
  expert: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Expert' },
  advanced: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Advanced' },
  intermediate: { color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', label: 'Intermediate' },
  beginner: { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Beginner' },
};

interface OnboardingWizardProps {
  phone: string;
  onComplete: () => void;
}

export default function OnboardingWizard({ phone, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);

  // ─── Step 1: Personal Details ──────────────────────────────────────────
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [languages, setLanguages] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');

  // ─── Step 2: Specialist Type ────────────────────────────────────────────
  const [specialty, setSpecialty] = useState<'elder_care' | 'child_care' | null>(null);

  // ─── Step 3: Skills & Services ─────────────────────────────────────────
  const [selectedSkills, setSelectedSkills] = useState<Array<{ name: string; level: SkillLevel; years: number }>>([]);
  const [selectedServices, setSelectedServices] = useState<Array<{ name: string; description: string }>>([]);
  const [customSkillName, setCustomSkillName] = useState('');
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServiceDescription, setCustomServiceDescription] = useState('');

  // ─── Step 4: Certifications ───────────────────────────────────────────
  const [certifications, setCertifications] = useState<Array<{ name: string; issuer: string; year: number; featured: boolean }>>([]);
  const [newCertName, setNewCertName] = useState('');
  const [newCertIssuer, setNewCertIssuer] = useState('');
  const [newCertYear, setNewCertYear] = useState('');

  // ─── Step 5: Availability ─────────────────────────────────────────────
  const [availability, setAvailability] = useState(
    DAYS_OF_WEEK.map((day) => ({ day, isAvailable: false, startTime: '09:00', endTime: '18:00' }))
  );

  // ─── Helpers ────────────────────────────────────────────────────────────

  const isSkillSelected = (skillName: string) => selectedSkills.some((s) => s.name === skillName);

  const toggleSkill = (skillName: string) => {
    setSelectedSkills((prev) => {
      if (prev.some((s) => s.name === skillName)) {
        return prev.filter((s) => s.name !== skillName);
      }
      return [...prev, { name: skillName, level: 'intermediate' as SkillLevel, years: 1 }];
    });
  };

  const updateSkillLevel = (skillName: string, level: SkillLevel) => {
    setSelectedSkills((prev) =>
      prev.map((s) => (s.name === skillName ? { ...s, level } : s))
    );
  };

  const updateSkillYears = (skillName: string, years: number) => {
    setSelectedSkills((prev) =>
      prev.map((s) => (s.name === skillName ? { ...s, years: Math.max(0, Math.min(50, years)) } : s))
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkillName.trim();
    if (!trimmed || isSkillSelected(trimmed)) return;
    setSelectedSkills((prev) => [...prev, { name: trimmed, level: 'intermediate' as SkillLevel, years: 1 }]);
    setCustomSkillName('');
  };

  const isServiceSelected = (serviceName: string) => selectedServices.some((s) => s.name === serviceName);

  const toggleService = (serviceName: string, description: string) => {
    setSelectedServices((prev) => {
      if (prev.some((s) => s.name === serviceName)) {
        return prev.filter((s) => s.name !== serviceName);
      }
      return [...prev, { name: serviceName, description }];
    });
  };

  const addCustomService = () => {
    const n = customServiceName.trim();
    if (!n || isServiceSelected(n)) return;
    setSelectedServices((prev) => [...prev, { name: n, description: customServiceDescription.trim() || 'Custom service' }]);
    setCustomServiceName('');
    setCustomServiceDescription('');
  };

  const addCertification = () => {
    const n = newCertName.trim();
    const issuer = newCertIssuer.trim();
    const year = parseInt(newCertYear.trim(), 10);
    if (!n || !issuer || !year || year < 1950 || year > new Date().getFullYear() + 1) return;
    if (certifications.some((c) => c.name.toLowerCase() === n.toLowerCase())) return;
    setCertifications((prev) => [...prev, { name: n, issuer, year, featured: false }]);
    setNewCertName('');
    setNewCertIssuer('');
    setNewCertYear('');
  };

  const removeCertification = (certName: string) => {
    setCertifications((prev) => prev.filter((c) => c.name !== certName));
  };

  const toggleDayAvailability = (index: number) => {
    setAvailability((prev) =>
      prev.map((day, i) => (i === index ? { ...day, isAvailable: !day.isAvailable } : day))
    );
  };

  const updateTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setAvailability((prev) =>
      prev.map((day, i) => (i === index ? { ...day, [field]: value } : day))
    );
  };

  const skillsByCategory = useMemo(() => {
    const grouped: Record<string, typeof SKILLS_CATALOG[number][]> = {};
    for (const skill of SKILLS_CATALOG) {
      const cat = skill.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(skill);
    }
    return grouped;
  }, []);

  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, typeof SERVICES_CATALOG[number][]> = {};
    for (const service of SERVICES_CATALOG) {
      const cat = service.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(service);
    }
    return grouped;
  }, []);

  // ─── Validation per step ───────────────────────────────────────────────

  const isStep1Valid = name.trim().length >= 2 && email.trim().includes('@') && qualifications.trim().length > 0 && parseInt(experience, 10) > 0;
  const isStep2Valid = specialty !== null;
  const isStep3Valid = selectedSkills.length > 0;
  const isStep4Valid = true; // certs are optional
  const isStep5Valid = true; // availability can be all off

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid;
      case 4: return isStep4Valid;
      case 5: return isStep5Valid;
      default: return false;
    }
  };

  // ─── Navigation ────────────────────────────────────────────────────────

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Final step — save onboarding data and proceed to verification
      const data: OnboardingData = {
        name: name.trim(),
        email: email.trim(),
        phone,
        qualifications: qualifications.trim(),
        languages: languages.trim(),
        bio: bio.trim(),
        experience: parseInt(experience, 10) || 1,
        specialty: specialty!,
        skills: selectedSkills,
        services: selectedServices,
        certifications,
        availability,
      };
      storeOnboarding(data);
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ─── Step indicator ────────────────────────────────────────────────────

  const stepLabels = ['Personal', 'Specialist', 'Skills', 'Certifications', 'Availability'];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />

      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Nurturee" width={28} height={28} className="rounded-lg" />
              <span className="text-lg font-bold text-gray-900 tracking-tight">Nurturee</span>
            </div>
            <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
              Step {step} of {TOTAL_STEPS}
            </Badge>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i < step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {stepLabels.map((label, i) => (
              <span
                key={label}
                className={`text-[10px] transition-colors ${
                  i === step - 1 ? 'text-blue-600 font-semibold' : i < step - 1 ? 'text-blue-500' : 'text-gray-300'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 pb-32">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Personal Details</h2>
              <p className="text-sm text-gray-500 mt-1">Tell us about yourself to get started</p>
            </div>

            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="onb-name" className="text-sm font-medium">Full Name *</Label>
                  <Input
                    id="onb-name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onb-email" className="text-sm font-medium">Email Address *</Label>
                  <Input
                    id="onb-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onb-phone" className="text-sm font-medium">Phone Number</Label>
                  <Input
                    id="onb-phone"
                    value={phone}
                    disabled
                    className="h-10 bg-gray-50 text-gray-500"
                  />
                  <p className="text-[11px] text-gray-400">Verified via OTP during login</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onb-qualifications" className="text-sm font-medium">Qualifications *</Label>
                  <Input
                    id="onb-qualifications"
                    placeholder="e.g. B.Sc Nursing, GNM Diploma"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onb-experience" className="text-sm font-medium">Years of Experience *</Label>
                  <Input
                    id="onb-experience"
                    type="number"
                    placeholder="e.g. 3"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="h-10"
                    min="0"
                    max="50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onb-languages" className="text-sm font-medium">Languages Known</Label>
                  <Input
                    id="onb-languages"
                    placeholder="e.g. English, Hindi, Tamil"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onb-bio" className="text-sm font-medium">About Yourself</Label>
                  <Textarea
                    id="onb-bio"
                    placeholder="Brief description about your care experience and approach..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="min-h-[80px] text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Specialist Type</h2>
              <p className="text-sm text-gray-500 mt-1">Choose your primary area of care expertise</p>
            </div>

            <div className="space-y-3">
              {/* Elder Care Option */}
              <button
                type="button"
                onClick={() => setSpecialty('elder_care')}
                className={`w-full rounded-xl border-2 p-5 text-left transition-all ${
                  specialty === 'elder_care'
                    ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-100'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`size-14 rounded-xl flex items-center justify-center shrink-0 ${
                    specialty === 'elder_care' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Heart className={`size-7 ${specialty === 'elder_care' ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900">Elder Care</h3>
                      {specialty === 'elder_care' && (
                        <CheckCircle className="size-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Dementia care, geriatric nursing, mobility support, palliative care, and companionship for seniors
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="outline" className="text-[10px] text-gray-500">Geriatric</Badge>
                      <Badge variant="outline" className="text-[10px] text-gray-500">Dementia</Badge>
                      <Badge variant="outline" className="text-[10px] text-gray-500">Palliative</Badge>
                      <Badge variant="outline" className="text-[10px] text-gray-500">Physiotherapy</Badge>
                    </div>
                  </div>
                </div>
              </button>

              {/* Child Care Option */}
              <button
                type="button"
                onClick={() => setSpecialty('child_care')}
                className={`w-full rounded-xl border-2 p-5 text-left transition-all ${
                  specialty === 'child_care'
                    ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-100'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`size-14 rounded-xl flex items-center justify-center shrink-0 ${
                    specialty === 'child_care' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Baby className={`size-7 ${specialty === 'child_care' ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900">Child Care</h3>
                      {specialty === 'child_care' && (
                        <CheckCircle className="size-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Newborn care, child development, special needs support, feeding, and day care services
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="outline" className="text-[10px] text-gray-500">Newborn</Badge>
                      <Badge variant="outline" className="text-[10px] text-gray-500">Infant</Badge>
                      <Badge variant="outline" className="text-[10px] text-gray-500">Special Needs</Badge>
                      <Badge variant="outline" className="text-[10px] text-gray-500">Development</Badge>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Skills & Services</h2>
              <p className="text-sm text-gray-500 mt-1">Select your core skills and services you can offer</p>
            </div>

            {/* Skills Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="size-4 text-gray-400" />
                    Core Skills
                    {selectedSkills.length > 0 && (
                      <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200 bg-gray-50 px-1.5 py-0">
                        {selectedSkills.length} selected
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {selectedSkills.map((skill) => (
                      <div key={skill.name} className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1">
                        <BadgeCheck className="size-3 text-blue-600" />
                        <span className="text-[11px] font-medium text-blue-700">{skill.name}</span>
                        <button type="button" onClick={() => toggleSkill(skill.name)} className="ml-0.5">
                          <Minus className="size-3 text-blue-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {Object.entries(skillsByCategory).map(([category, skills]) => {
                  const unselected = skills.filter((s) => !isSkillSelected(s.name));
                  if (unselected.length === 0) return null;
                  return (
                    <div key={category} className="mb-4 last:mb-0">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{category}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {unselected.map((skill) => (
                          <button
                            key={skill.name}
                            type="button"
                            onClick={() => toggleSkill(skill.name)}
                            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Plus className="size-2.5 inline mr-0.5 -mt-0.5" />
                            {skill.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Custom skill */}
                <div className="mt-3 flex gap-2">
                  <Input
                    placeholder="Add custom skill..."
                    value={customSkillName}
                    onChange={(e) => setCustomSkillName(e.target.value)}
                    className="h-8 text-xs flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                  />
                  <Button size="sm" variant="outline" onClick={addCustomSkill} disabled={!customSkillName.trim()} className="h-8 px-2">
                    <Plus className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Services Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Award className="size-4 text-gray-400" />
                    Services You Offer
                    {selectedServices.length > 0 && (
                      <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200 bg-gray-50 px-1.5 py-0">
                        {selectedServices.length} selected
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {selectedServices.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {selectedServices.map((service) => (
                      <div key={service.name} className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1">
                        <BadgeCheck className="size-3 text-emerald-600" />
                        <span className="text-[11px] font-medium text-emerald-700">{service.name}</span>
                        <button type="button" onClick={() => toggleService(service.name, service.description)} className="ml-0.5">
                          <Minus className="size-3 text-emerald-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {Object.entries(servicesByCategory).map(([category, services]) => {
                  const unselected = services.filter((s) => !isServiceSelected(s.name));
                  if (unselected.length === 0) return null;
                  return (
                    <div key={category} className="mb-4 last:mb-0">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{category}</p>
                      <div className="space-y-1.5">
                        {unselected.map((service) => (
                          <button
                            key={service.name}
                            type="button"
                            onClick={() => toggleService(service.name, service.description)}
                            className="w-full text-left rounded-lg border border-gray-200 bg-white p-3 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-medium text-gray-700">
                                  <Plus className="size-2.5 inline mr-0.5 -mt-0.5" />
                                  {service.name}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{service.description}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Custom service */}
                <div className="mt-3 space-y-1.5">
                  <Input
                    placeholder="Custom service name..."
                    value={customServiceName}
                    onChange={(e) => setCustomServiceName(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Brief description..."
                    value={customServiceDescription}
                    onChange={(e) => setCustomServiceDescription(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button size="sm" variant="outline" onClick={addCustomService} disabled={!customServiceName.trim()} className="h-8 w-full">
                    <Plus className="size-3.5 mr-1" /> Add Custom Service
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Certifications & Training</h2>
              <p className="text-sm text-gray-500 mt-1">Add your certifications — you can feature up to 2 on your profile as trust badges</p>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 p-3">
              <AlertCircle className="size-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Certifications are optional during signup but highly recommended. Verified certifications become trust badges on your profile, helping customers choose you with confidence.
              </p>
            </div>

            {/* Existing */}
            {certifications.length > 0 && (
              <div className="space-y-2">
                {certifications.map((cert) => (
                  <div key={cert.name} className="rounded-lg border border-gray-100 bg-white p-3 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900">{cert.name}</p>
                      <p className="text-[11px] text-gray-500">{cert.issuer} &middot; {cert.year}</p>
                    </div>
                    <button type="button" onClick={() => removeCertification(cert.name)} className="text-gray-400 hover:text-red-500">
                      <Minus className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5 mb-3">
                  <Plus className="size-3" />
                  Add Certification
                </p>
                <div className="space-y-2">
                  <Input placeholder="Certification name" value={newCertName} onChange={(e) => setNewCertName(e.target.value)} className="h-9 text-xs" />
                  <Input placeholder="Issuing organization" value={newCertIssuer} onChange={(e) => setNewCertIssuer(e.target.value)} className="h-9 text-xs" />
                  <Input placeholder="Year (e.g. 2024)" value={newCertYear} onChange={(e) => setNewCertYear(e.target.value)} className="h-9 text-xs" type="number" min="1950" max={new Date().getFullYear() + 1} />
                  <Button size="sm" onClick={addCertification} disabled={!newCertName.trim() || !newCertIssuer.trim() || !newCertYear.trim()} className="gap-1 h-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                    <Plus className="size-3" /> Add Certification
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Skip note */}
            {certifications.length === 0 && (
              <p className="text-xs text-gray-400 text-center italic">You can add certifications later from your profile</p>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Weekly Availability</h2>
              <p className="text-sm text-gray-500 mt-1">Set your weekly schedule — you can change this anytime from your profile</p>
            </div>

            <div className="space-y-2">
              {availability.map((day, index) => (
                <div
                  key={day.day}
                  className={`rounded-lg border p-3 transition-colors ${
                    day.isAvailable ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${day.isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>{day.day}</span>
                    <Switch checked={day.isAvailable} onCheckedChange={() => toggleDayAvailability(index)} />
                  </div>
                  {day.isAvailable && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => updateTime(index, 'startTime', e.target.value)}
                        className="h-8 text-xs w-28"
                      />
                      <span className="text-xs text-gray-400">to</span>
                      <Input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => updateTime(index, 'endTime', e.target.value)}
                        className="h-8 text-xs w-28"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Shield className="size-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-900">Almost there!</p>
                    <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                      After completing this step, you will be taken to the verification page where you can upload your documents (Aadhaar, Police Clearance, Medical Fitness, and Video Verification).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Sticky bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-lg border-t border-gray-200 p-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-1.5 h-11 flex-1 sm:flex-none sm:w-28"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`gap-1.5 h-11 flex-1 text-sm font-medium transition-all ${
              canProceed()
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {step === TOTAL_STEPS ? (
              <>
                <Shield className="size-4" />
                Continue to Verification
              </>
            ) : (
              <>
                Next
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
