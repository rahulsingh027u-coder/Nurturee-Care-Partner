'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Upload,
  FileText,
  CalendarIcon,
  Camera,
  UserCircle,
  Heart,
  AlertCircle,
  Loader2,
  Ban,
  Send,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { mockCarePartner } from '@/lib/care-partner-data';
import { VERIFICATION_STORAGE_KEY, STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION } from '@/lib/constants';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 3;
const REJECTION_REASONS = [
  'Document is blurry/unreadable',
  'Information does not match records',
  'Document appears to be expired',
  'Image quality too low for verification',
];

// ─── Types ────────────────────────────────────────────────────────────────────

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
    status: 'submitted' | 'approved' | 'rejected';
    reviewedAt?: string;
    rejectionReason?: string;
  }>;
  currentDraft: { documents: Array<{ id: string; name: string; size: number; type: string }>; formFields: Record<string, string> };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface VerificationPageProps {
  onComplete?: () => void;
  optionalMode?: boolean;
}

// ─── Verification Config ──────────────────────────────────────────────────────

interface VerificationField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'select';
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

const verificationConfig: Record<VerificationType, {
  title: string;
  description: string;
  icon: typeof Shield;
  mandatory: boolean;
  fields: VerificationField[];
  maxFileSize: number;
  allowedTypes: string[];
}> = {
  aadhaar: {
    title: 'Aadhaar Verification',
    description: 'Upload your Aadhaar card (front and back) for identity verification. This is mandatory to start accepting assignments.',
    icon: Shield,
    mandatory: true,
    fields: [
      { key: 'fullName', label: 'Full Name (as on Aadhaar)', type: 'text', placeholder: 'Enter full name', required: true },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
      { key: 'aadhaarNumber', label: 'Aadhaar Number', type: 'text', placeholder: 'XXXX XXXX XXXX', required: true },
    ],
    maxFileSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'],
  },
  police: {
    title: 'Police Verification',
    description: 'Upload your police verification certificate for background check. This helps build trust with families.',
    icon: FileText,
    mandatory: false,
    fields: [
      { key: 'certificateNumber', label: 'Certificate Number', type: 'text', placeholder: 'e.g., PC-2025-XXXX', required: true },
      { key: 'issuingAuthority', label: 'Issuing Authority', type: 'text', placeholder: 'e.g., Powai Police Station', required: true },
      { key: 'issueDate', label: 'Issue Date', type: 'date', required: true },
    ],
    maxFileSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'],
  },
  medical: {
    title: 'Medical Fitness Certificate',
    description: 'Upload your medical fitness certificate from a registered medical practitioner.',
    icon: Heart,
    mandatory: false,
    fields: [
      { key: 'doctorName', label: 'Doctor Name', type: 'text', placeholder: 'Dr. ...', required: true },
      { key: 'clinicName', label: 'Clinic / Hospital Name', type: 'text', placeholder: 'Enter clinic name', required: true },
      { key: 'certificateDate', label: 'Certificate Date', type: 'date', required: true },
    ],
    maxFileSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'],
  },
  video: {
    title: 'Video KYC Verification',
    description: 'Submit your ID proof for video KYC verification. Our team will schedule a video call.',
    icon: UserCircle,
    mandatory: false,
    fields: [
      { key: 'idType', label: 'ID Type', type: 'select', options: ['PAN Card', 'Voter ID', 'Driving License', 'Passport'], required: true },
      { key: 'idNumber', label: 'ID Number', type: 'text', placeholder: 'Enter ID number', required: true },
      { key: 'preferredDate', label: 'Preferred Date for Video Call', type: 'date', required: true },
    ],
    maxFileSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitialDocs(): VerificationDoc[] {
  return [
    {
      id: 'v-aadhaar',
      type: 'aadhaar',
      status: mockCarePartner.aadhaarVerified ? 'approved' : 'not_started',
      attempts: [],
      currentDraft: { documents: [], formFields: {} },
    },
    {
      id: 'v-police',
      type: 'police',
      status: mockCarePartner.policeVerified ? 'approved' : 'not_started',
      attempts: [],
      currentDraft: { documents: [], formFields: {} },
    },
    {
      id: 'v-medical',
      type: 'medical',
      status: mockCarePartner.medicalFitness ? 'approved' : 'not_started',
      attempts: [],
      currentDraft: { documents: [], formFields: {} },
    },
    {
      id: 'v-video',
      type: 'video',
      status: mockCarePartner.videoVerified ? 'approved' : 'not_started',
      attempts: [],
      currentDraft: { documents: [], formFields: {} },
    },
  ];
}

function loadDocsFromStorage(): VerificationDoc[] {
  try {
    // Version check — if storage format is outdated, clear and start fresh
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    if (storedVersion !== String(CURRENT_STORAGE_VERSION)) {
      localStorage.removeItem(VERIFICATION_STORAGE_KEY);
      localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION));
      return getInitialDocs();
    }
    const stored = localStorage.getItem(VERIFICATION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === 4) {
        // Validate structure — reject data from old format
        const isValid = parsed.every((d: VerificationDoc) => d.id && d.type && d.status && Array.isArray(d.attempts));
        if (isValid) return parsed;
      }
    }
  } catch {
    // fall through
  }
  return getInitialDocs();
}

function saveDocsToStorage(docs: VerificationDoc[]) {
  localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION));
  localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(docs));
}

function getStatusDisplay(status: VerificationStatus) {
  switch (status) {
    case 'approved':
      return { label: 'Verified', color: 'text-emerald-700', bg: 'bg-emerald-100', badgeBg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle };
    case 'submitted':
      return { label: 'Submitted', color: 'text-blue-700', bg: 'bg-blue-100', badgeBg: 'bg-blue-50 border-blue-200', icon: Send };
    case 'under_review':
      return { label: 'Under Review', color: 'text-blue-700', bg: 'bg-blue-100', badgeBg: 'bg-blue-50 border-blue-200', icon: RefreshCw };
    case 'rejected':
      return { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100', badgeBg: 'bg-red-50 border-red-200', icon: XCircle };
    case 'max_attempts_reached':
      return { label: 'Locked', color: 'text-gray-600', bg: 'bg-gray-100', badgeBg: 'bg-gray-50 border-gray-200', icon: Ban };
    default:
      return { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100', badgeBg: 'bg-amber-50 border-amber-200', icon: Clock };
  }
}

// ─── Optional Deadline Helpers ─────────────────────────────────────────────────

const OPTIONAL_DEADLINE_DAYS = 15;
const REGISTERED_AT_KEY = 'nurturee_care_partner_registered_at';

function getDaysRemaining(): number | null {
  try {
    const registeredAt = localStorage.getItem(REGISTERED_AT_KEY);
    if (!registeredAt) return null;
    const registered = new Date(registeredAt).getTime();
    const deadline = registered + OPTIONAL_DEADLINE_DAYS * 24 * 60 * 60 * 1000;
    const remaining = Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000));
    return Math.max(0, remaining);
  } catch {
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VerificationPage({ onComplete, optionalMode = false }: VerificationPageProps) {
  const [docs, setDocs] = useState<VerificationDoc[]>(loadDocsFromStorage);
  const [activeType, setActiveType] = useState<VerificationType | null>(null);
  const [formFields, setFormFields] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; name: string; size: number; type: string }>>([]);
  const [uploadedFront, setUploadedFront] = useState<Array<{ id: string; name: string; size: number; type: string }>>([]);
  const [uploadedBack, setUploadedBack] = useState<Array<{ id: string; name: string; size: number; type: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedType, setSubmittedType] = useState<VerificationType | null>(null);
  const [reviewingType, setReviewingType] = useState<VerificationType | null>(null);
  const [calendarOpen, setCalendarOpen] = useState<Record<string, boolean>>({});
  const tempCalendarDateRef = useRef<Record<string, Date | undefined>>({});
  const [approvingType, setApprovingType] = useState<VerificationType | null>(null);
  const reviewTimersRef = useRef<Record<string, NodeJS.Timeout[]>>({});

  const currentYear = new Date().getFullYear();

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(reviewTimersRef.current).forEach((timers) => {
        timers.forEach(clearTimeout);
      });
    };
  }, []);

  // Guard against stale submitted/reviewing state if docs changed (e.g., page refresh, storage cleared)
  useEffect(() => {
    if (submittedType) {
      const doc = docs.find((d) => d.type === submittedType);
      if (!doc || (doc.status !== 'submitted' && doc.status !== 'under_review')) {
        setSubmittedType(null);
        setReviewingType(null);
      }
    }
    if (reviewingType) {
      const doc = docs.find((d) => d.type === reviewingType);
      if (!doc || doc.status !== 'under_review') {
        setReviewingType(null);
      }
    }
  }, [docs, submittedType, reviewingType]);

  // Persist docs to localStorage whenever they change
  const updateDocs = useCallback((updater: (prev: VerificationDoc[]) => VerificationDoc[]) => {
    setDocs((prev) => {
      const updated = updater(prev);
      saveDocsToStorage(updated);
      return updated;
    });
  }, []);

  // ─── Backend Review Simulation ───────────────────────────────────────────

  const startReviewSimulation = useCallback((type: VerificationType, attemptNumber: number) => {
    // Clear any existing timers for this type
    if (reviewTimersRef.current[type]) {
      reviewTimersRef.current[type].forEach(clearTimeout);
    }
    reviewTimersRef.current[type] = [];

    const doc = docs.find((d) => d.type === type);
    if (!doc) return;

    // Timer 1: After 3s → under_review
    const t1 = setTimeout(() => {
      setReviewingType(type);
      updateDocs((prev) =>
        prev.map((d) =>
          d.type === type ? { ...d, status: 'under_review' as VerificationStatus } : d
        )
      );
    }, 3000);

    // Timer 2: After 5-7s total → resolve
    const resolveDelay = 5000 + Math.random() * 2000;
    const t2 = setTimeout(() => {
      const currentDoc = docs.find((d) => d.type === type);
      if (!currentDoc) return;

      let willApprove: boolean;

      if (type === 'aadhaar') {
        // Aadhaar always approve on first attempt (demo-friendly)
        willApprove = true;
      } else {
        // Others: 60% reject on attempt 1, 30% on attempt 2, always approve on attempt 3
        if (attemptNumber === 1) {
          willApprove = Math.random() < 0.4;
        } else if (attemptNumber === 2) {
          willApprove = Math.random() < 0.7;
        } else {
          willApprove = true;
        }
      }

      if (willApprove) {
        // Approve
        setApprovingType(type);
        updateDocs((prev) =>
          prev.map((d) => {
            if (d.type !== type) return d;
            return {
              ...d,
              status: 'approved' as VerificationStatus,
              attempts: d.attempts.map((a) =>
                a.attemptNumber === attemptNumber
                  ? { ...a, status: 'approved' as const, reviewedAt: new Date().toISOString() }
                  : a
              ),
            };
          })
        );
        setReviewingType(null);

        // If Aadhaar approved and onComplete exists, call it after delay
        if (type === 'aadhaar' && onComplete) {
          setTimeout(() => {
            setApprovingType(null);
            setSubmittedType(null);
            onComplete();
          }, 1000);
        } else {
          // For optional: show success briefly, then allow going back
          setTimeout(() => {
            setApprovingType(null);
            setSubmittedType(null);
            setActiveType(null);
          }, 2000);
        }
      } else {
        // Reject
        const reason = REJECTION_REASONS[Math.floor(Math.random() * REJECTION_REASONS.length)];
        updateDocs((prev) =>
          prev.map((d) => {
            if (d.type !== type) return d;
            const updatedAttempts = d.attempts.map((a) =>
              a.attemptNumber === attemptNumber
                ? { ...a, status: 'rejected' as const, reviewedAt: new Date().toISOString(), rejectionReason: reason }
                : a
            );
            // Check if max attempts reached
            const isMaxAttempts = updatedAttempts.length >= MAX_ATTEMPTS && updatedAttempts[updatedAttempts.length - 1].status === 'rejected';
            return {
              ...d,
              status: isMaxAttempts ? ('max_attempts_reached' as VerificationStatus) : ('rejected' as VerificationStatus),
              attempts: updatedAttempts,
              currentDraft: { documents: [], formFields: {} },
            };
          })
        );
        setReviewingType(null);
        // Transition from submitted view to allow re-upload
        setTimeout(() => {
          setSubmittedType(null);
        }, 300);
      }
    }, resolveDelay);

    reviewTimersRef.current[type] = [t1, t2];
  }, [docs, onComplete, updateDocs]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSelectType = (type: VerificationType) => {
    const doc = docs.find((d) => d.type === type);
    if (!doc) return;
    setActiveType(type);
    // Restore draft for editable docs; approved/locked docs show read-only
    const isFrozenDoc = doc.status === 'max_attempts_reached' || doc.status === 'approved';
    if (!isFrozenDoc) {
      setFormFields(doc.currentDraft?.formFields || {});
      if (type === 'aadhaar') {
        const draftDocs = doc.currentDraft?.documents || [];
        setUploadedFront(draftDocs.filter(f => f.id.startsWith('front-')));
        setUploadedBack(draftDocs.filter(f => f.id.startsWith('back-')));
        setUploadedFiles([]);
      } else {
        setUploadedFiles(doc.currentDraft?.documents || []);
        setUploadedFront([]);
        setUploadedBack([]);
      }
    } else {
      setFormFields({});
      setUploadedFiles([]);
      setUploadedFront([]);
      setUploadedBack([]);
    }
    setSubmittedType(null);
  };

  const handleBack = () => {
    // Save draft
    if (activeType) {
      // For Aadhaar, combine front + back into documents array
      const isAadhaar = activeType === 'aadhaar';
      const combinedDocs = isAadhaar
        ? [...uploadedFront.map(f => ({ ...f, id: `front-${f.id}` })), ...uploadedBack.map(f => ({ ...f, id: `back-${f.id}` }))]
        : uploadedFiles;
      updateDocs((prev) =>
        prev.map((d) =>
          d.type === activeType
            ? { ...d, currentDraft: { documents: combinedDocs, formFields } }
            : d
        )
      );
    }
    // Clean up timers for this type if we navigate back
    if (activeType && reviewTimersRef.current[activeType]) {
      // Don't clear if review is in progress (submittedType or reviewingType is set)
      if (!submittedType && !reviewingType) {
        reviewTimersRef.current[activeType].forEach(clearTimeout);
        delete reviewTimersRef.current[activeType];
      }
    }
    setActiveType(null);
    setFormFields({});
    setUploadedFiles([]);
    setUploadedFront([]);
    setUploadedBack([]);
    setSubmittedType(null);
    setReviewingType(null);
  };

  const validateAndCreateFileEntries = (files: FileList, config: typeof verificationConfig[VerificationType] | null) => {
    const result: Array<{ id: string; name: string; size: number; type: string }> = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (config && !config.allowedTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Allowed: JPG, PNG, HEIC, PDF`);
        continue;
      }
      if (config && file.size > config.maxFileSize) {
        alert(`File too large: ${file.name}. Max ${config.maxFileSize / 1024 / 1024}MB`);
        continue;
      }
      result.push({ id: `file-${Date.now()}-${i}`, name: file.name, size: file.size, type: file.type });
    }
    return result;
  };

  // Generic file change (for non-Aadhaar docs)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const config = activeType ? verificationConfig[activeType] : null;
    const newFiles = validateAndCreateFileEntries(files, config);
    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  // Aadhaar-specific: handle front/back file uploads
  const handleAadhaarSideChange = (side: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const config = verificationConfig['aadhaar'];
    const newFiles = validateAndCreateFileEntries(files, config);
    const setter = side === 'front' ? setUploadedFront : setUploadedBack;
    if (newFiles.length > 0) {
      setter(newFiles); // Replace — only one file per side
    }
    e.target.value = '';
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };
  const handleRemoveAadhaarSide = (side: 'front' | 'back') => () => {
    if (side === 'front') setUploadedFront([]);
    else setUploadedBack([]);
  };

  const handleSubmit = async () => {
    if (!activeType) return;
    setSubmitting(true);

    // Simulate submission delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const doc = docs.find((d) => d.type === activeType);
    const nextAttemptNumber = (doc?.attempts?.length || 0) + 1;

    // For Aadhaar, combine front + back into documents array for submission
    const isAadhaarSubmit = activeType === 'aadhaar';
    const submitDocs = isAadhaarSubmit
      ? [...uploadedFront.map(f => ({ ...f, id: `front-${f.id}` })), ...uploadedBack.map(f => ({ ...f, id: `back-${f.id}` }))]
      : [...uploadedFiles];

    const newAttempt = {
      attemptNumber: nextAttemptNumber,
      submittedAt: new Date().toISOString(),
      documents: submitDocs,
      formFields: { ...formFields },
      status: 'submitted' as const,
    };

    updateDocs((prev) =>
      prev.map((d) => {
        if (d.type !== activeType) return d;
        return {
          ...d,
          status: 'submitted' as VerificationStatus,
          attempts: [...d.attempts, newAttempt],
          currentDraft: { documents: [], formFields: {} },
        };
      })
    );

    setSubmitting(false);
    setSubmittedType(activeType);

    // Start the backend review simulation
    startReviewSimulation(activeType, nextAttemptNumber);
  };

  // ─── Derived State ────────────────────────────────────────────────────────

  const aadhaarDoc = docs.find((d) => d.type === 'aadhaar');
  const aadhaarApproved = aadhaarDoc?.status === 'approved';

  // ─── View 1: Overview ────────────────────────────────────────────────────

  if (!activeType) {
    const allTypes = (Object.keys(verificationConfig) as VerificationType[]);
    const mandatoryTypes = allTypes.filter((t) => verificationConfig[t].mandatory);
    const optionalTypes = allTypes.filter((t) => !verificationConfig[t].mandatory);
    const optionalPending = optionalTypes.filter((t) => {
      const doc = docs.find((d) => d.type === t);
      return doc?.status !== 'approved' && doc?.status !== 'max_attempts_reached';
    });

    return (
      <div className={`${optionalMode ? '' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
        <div className="flex-1 flex flex-col items-center p-4 pt-8">
          <div className="w-full max-w-2xl space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white mb-2">
                <Shield className="size-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {aadhaarApproved ? 'Document Verification' : 'Complete Your Verification'}
              </h1>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {aadhaarApproved
                  ? 'Your identity is verified! Submit remaining documents to build trust with families and unlock more assignments.'
                  : 'Welcome to Nurturee! To start accepting assignments, please verify your identity. Aadhaar verification is mandatory.'}
              </p>
            </div>

            {/* Aadhaar Success Banner (shown after approval) */}
            {aadhaarApproved && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
                <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="size-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Identity Verified</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Your Aadhaar has been verified. You can now access the dashboard and submit optional documents at any time.
                  </p>
                </div>
              </div>
            )}

            {/* ─── Aadhaar / Mandatory Section — always visible ─── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={`px-2.5 py-0.5 text-xs font-medium ${
                  aadhaarApproved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                }`}>
                  {aadhaarApproved ? 'Step 1 — Completed' : 'Step 1 — Mandatory'}
                </Badge>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <p className="text-xs text-gray-500">
                {aadhaarApproved
                  ? 'Your identity has been verified. Tap to view your Aadhaar details.'
                  : 'Aadhaar verification is required before you can access the dashboard. Please upload your Aadhaar card.'}
              </p>
              {mandatoryTypes.map((type) => {
                const config = verificationConfig[type];
                const Icon = config.icon;
                const doc = docs.find((d) => d.type === type);
                const statusDisplay = getStatusDisplay(doc?.status || 'not_started');
                const StatusIcon = statusDisplay.icon;
                const isReviewing = reviewingType === type;

                return (
                  <button
                    key={type}
                    onClick={() => handleSelectType(type)}
                    className={`rounded-xl border bg-white p-4 flex items-center gap-3 text-left hover:shadow-sm hover:border-emerald-300 transition-all cursor-pointer w-full group ${
                      doc?.status === 'approved' ? 'border-emerald-200 hover:bg-emerald-50/30' : 'border-blue-200 bg-blue-50/30 ring-1 ring-blue-100'
                    }`}
                  >
                    <div className={`size-10 rounded-lg flex items-center justify-center ${statusDisplay.bg}`}>
                      {isReviewing ? (
                        <Loader2 className={`size-5 ${statusDisplay.color} animate-spin`} />
                      ) : (
                        <Icon className={`size-5 ${statusDisplay.color}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-semibold group-hover:text-blue-700 transition-colors ${
                          doc?.status === 'approved' ? 'text-emerald-900' : 'text-blue-900'
                        }`}>
                          {config.title}
                        </p>
                        {doc?.status === 'approved' && (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50 px-1.5 py-0 leading-none">
                            <CheckCircle className="size-2.5 mr-0.5" />
                            Verified
                          </Badge>
                        )}
                        {!aadhaarApproved && doc?.status !== 'approved' && (
                          <Badge className="bg-red-50 text-red-600 border border-red-200 text-[10px] px-1.5 py-0 leading-none">Required</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <StatusIcon className={`size-3.5 ${statusDisplay.color}`} />
                        <span className={`text-xs font-medium ${statusDisplay.color}`}>
                          {isReviewing ? 'Reviewing...' : doc?.status === 'approved' ? 'Tap to view details' : statusDisplay.label}
                        </span>
                      </div>
                    </div>
                    <ArrowLeft className="size-4 text-gray-300 group-hover:text-blue-400 transition-colors shrink-0 rotate-180" />
                  </button>
                );
              })}
            </div>

            {/* ─── Optional Section ─── */}
            {aadhaarApproved && optionalTypes.length > 0 && (() => {
              const daysLeft = getDaysRemaining();
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-0.5 text-xs font-medium">
                      Step 2 — Optional
                    </Badge>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">{optionalPending.length} remaining</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    These documents help build trust with families and can increase your chances of getting assignments.
                  </p>
                  {daysLeft !== null && (
                    <div className={`rounded-xl p-3 flex items-start gap-2.5 ${
                      daysLeft <= 3
                        ? 'bg-red-50 border border-red-100'
                        : daysLeft <= 7
                          ? 'bg-amber-50 border border-amber-100'
                          : 'bg-blue-50 border border-blue-100'
                    }`}>
                      <Clock className={`size-4 mt-0.5 shrink-0 ${
                        daysLeft <= 3 ? 'text-red-500' : daysLeft <= 7 ? 'text-amber-500' : 'text-blue-500'
                      }`} />
                      <div>
                        <p className={`text-xs font-medium ${
                          daysLeft <= 3 ? 'text-red-800' : daysLeft <= 7 ? 'text-amber-800' : 'text-blue-800'
                        }`}>
                          {daysLeft > 0
                            ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining to submit optional documents`
                            : 'Deadline passed — optional documents can no longer be submitted'}
                        </p>
                        <p className={`text-xs mt-0.5 ${
                          daysLeft <= 3 ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-blue-600'
                        }`}>
                          {daysLeft > 0
                            ? `Submit within ${OPTIONAL_DEADLINE_DAYS} days of registration (${new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})`
                            : 'Please contact support at support@nurturee.com for assistance'}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {optionalTypes.map((type) => {
                    const config = verificationConfig[type];
                    const Icon = config.icon;
                    const doc = docs.find((d) => d.type === type);
                    const statusDisplay = getStatusDisplay(doc?.status || 'not_started');
                    const StatusIcon = statusDisplay.icon;
                    const isReviewing = reviewingType === type;

                    return (
                      <button
                        key={type}
                        onClick={() => handleSelectType(type)}
                        className={`rounded-xl border bg-white p-4 flex items-center gap-3 text-left hover:shadow-sm hover:border-emerald-200 transition-all cursor-pointer w-full group ${
                          doc?.status === 'approved' ? 'border-emerald-100 hover:bg-emerald-50/30' : 'border-gray-100'
                        }`}
                      >
                        <div className={`size-10 rounded-lg flex items-center justify-center ${statusDisplay.bg}`}>
                          {isReviewing ? (
                            <Loader2 className={`size-5 ${statusDisplay.color} animate-spin`} />
                          ) : (
                            <Icon className={`size-5 ${statusDisplay.color}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm font-medium group-hover:text-blue-700 transition-colors ${
                              doc?.status === 'approved' ? 'text-emerald-900' : 'text-gray-900'
                            }`}>
                              {config.title}
                            </p>
                            {doc?.status === 'approved' && (
                              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50 px-1.5 py-0 leading-none">
                                <CheckCircle className="size-2.5 mr-0.5" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <StatusIcon className={`size-3.5 ${statusDisplay.color}`} />
                            <span className={`text-xs font-medium ${statusDisplay.color}`}>
                              {isReviewing ? 'Reviewing...' : doc?.status === 'approved' ? 'Tap to view' : statusDisplay.label}
                            </span>
                          </div>
                        </div>
                        <ArrowLeft className="size-4 text-gray-300 group-hover:text-blue-400 transition-colors shrink-0 rotate-180" />
                      </button>
                    );
                  })}
                </div>
              </div>
              );
            })()}

            {/* Locked verifications warning */}
            {(() => {
              const lockedCount = docs.filter((d) => d.status === 'max_attempts_reached').length;
              if (lockedCount === 0) return null;
              return (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3.5 flex items-start gap-2.5">
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
              );
            })()}

            {/* Active reviews info */}
            {(() => {
              const activeCount = docs.filter((d) => d.status === 'submitted' || d.status === 'under_review').length;
              if (activeCount === 0) return null;
              return (
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3.5 flex items-start gap-2.5">
                  <Send className="size-4 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-indigo-800">
                      {activeCount} document{activeCount > 1 ? 's' : ''} submitted for admin review
                    </p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                      Our admin team will review and verify your documents within 24-48 hours. If rejected, you may re-upload (up to 3 attempts per document).
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Sticky Bottom Bar — only sticky when standalone, not inside layout */}
        {aadhaarApproved && onComplete && (
          <div className={`${optionalMode ? '' : 'sticky bottom-0'} bg-white/80 backdrop-blur-lg border-t border-gray-200 p-4`}>
            <div className="w-full max-w-2xl mx-auto">
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-12 text-sm font-medium rounded-xl shadow-md"
                onClick={onComplete}
              >
                <Sparkles className="size-4 mr-2" />
                {optionalMode ? 'Back to Profile' : 'Go to Dashboard'}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── View 2: Upload Form ────────────────────────────────────────────────

  const config = verificationConfig[activeType];
  const Icon = config.icon;
  const doc = docs.find((d) => d.type === activeType);
  const attemptsUsed = doc?.attempts?.length || 0;
  const nextAttempt = attemptsUsed + 1;
  const isSubmitted = submittedType === activeType;
  const isReviewing = reviewingType === activeType;
  const isApproved = approvingType === activeType;
  const isLocked = doc?.status === 'max_attempts_reached';
  const isRejected = doc?.status === 'rejected';
  const lastRejectionReason = doc?.attempts?.length
    ? doc.attempts[doc.attempts.length - 1]?.rejectionReason
    : null;

  // All documents lock after backend approval or max attempts reached
  // Rejected documents (including Aadhaar) can be re-uploaded within attempt limits
  const isFrozen = isLocked || isApproved || doc?.status === 'approved';

  const allFieldsFilled = config.fields
    .filter((f) => f.required)
    .every((f) => formFields[f.key]?.trim());

  // For Aadhaar: require both front AND back uploads; for others: any files uploaded
  const hasRequiredFiles = activeType === 'aadhaar'
    ? uploadedFront.length > 0 && uploadedBack.length > 0
    : uploadedFiles.length > 0;

  const isSubmitDisabled = !allFieldsFilled || !hasRequiredFiles || submitting || isSubmitted || isReviewing || isLocked || isApproved;

  return (
    <div className={`${optionalMode ? '' : 'min-h-screen'} bg-gray-50`}>
      {/* Sticky Top Bar — only sticky when standalone (not inside Layout) */}
      <div className={`${optionalMode ? '' : 'sticky top-0 z-30'} bg-white border-b border-gray-200`}>
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="size-4" />
            {optionalMode ? 'Back to Profile' : 'Back'}
          </button>
          <div className="flex-1 flex items-center gap-2">
            <Icon className="size-5 text-blue-600" />
            <h1 className="text-sm font-semibold text-gray-900">{config.title}</h1>
          </div>
          {config.mandatory && (
            <Badge className="bg-red-50 text-red-600 border border-red-200 text-[10px]">Required</Badge>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-5 pb-8">
        {/* Approved State — show success + submitted details read-only */}
        {isApproved && (
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center size-12 rounded-full bg-emerald-100 mb-3">
                <CheckCircle className="size-6 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-emerald-900">Verification Approved!</h2>
              <p className="text-sm text-emerald-600 mt-1">
                {activeType === 'aadhaar'
                  ? optionalMode
                    ? 'Your identity has been verified successfully.'
                    : 'Redirecting to your dashboard...'
                  : 'Your document has been verified successfully.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Read-only details for frozen documents (approved / locked / aadhaar-submitted) */}
        {isFrozen && doc && (
          <>
            {/* Submitted Form Data */}
            {doc.attempts.length > 0 && (() => {
              const latestAttempt = doc.attempts[doc.attempts.length - 1];
              if (!latestAttempt || Object.keys(latestAttempt.formFields).length === 0) return null;
              return (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Submitted Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {config.fields.map((field) => {
                      const value = latestAttempt.formFields[field.key];
                      if (!value) return null;
                      return (
                        <div key={field.key} className="flex items-start justify-between gap-3 py-1.5">
                          <span className="text-xs font-medium text-gray-500 shrink-0">{field.label}</span>
                          <span className="text-sm text-gray-900 font-medium text-right">{value}</span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Uploaded Documents */}
            {doc.attempts.length > 0 && (() => {
              const latestAttempt = doc.attempts[doc.attempts.length - 1];
              const files = latestAttempt?.documents || [];
              if (files.length === 0) return null;

              // Aadhaar: show front/back in two columns
              if (activeType === 'aadhaar') {
                const frontFiles = files.filter(f => f.id.startsWith('front-'));
                const backFiles = files.filter(f => f.id.startsWith('back-'));
                return (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold text-gray-900">
                        Uploaded Aadhaar Card
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {(['front', 'back'] as const).map((side) => {
                          const sideFiles = side === 'front' ? frontFiles : backFiles;
                          const file = sideFiles[0];
                          return (
                            <div key={side} className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 text-center">
                              <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide mb-2">
                                {side === 'front' ? 'Front Side' : 'Back Side'}
                              </p>
                              {file ? (
                                <>
                                  <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-1.5">
                                    <FileText className="size-4 text-emerald-600" />
                                  </div>
                                  <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                                  <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                                </>
                              ) : (
                                <p className="text-xs text-gray-400">Not uploaded</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              // Non-Aadhaar: standard list
              return (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Uploaded Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                        <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                          <FileText className="size-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <CheckCircle className="size-4 text-emerald-500 shrink-0" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Approval timestamp */}
            {doc.attempts.length > 0 && (() => {
              const approvedAttempt = [...doc.attempts].reverse().find((a) => a.status === 'approved');
              if (!approvedAttempt?.reviewedAt) return null;
              return (
                <div className="text-center text-xs text-gray-400">
                  Approved on {new Date(approvedAttempt.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              );
            })()}
          </>
        )}

        {/* Submitted State (waiting for review) */}
        {isSubmitted && !isApproved && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center size-12 rounded-full bg-blue-100 mb-3">
                <Send className="size-6 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-blue-900">Document Submitted!</h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Loader2 className="size-4 text-blue-500 animate-spin" />
                <p className="text-sm text-blue-600">Under Review...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Locked State (max attempts reached) */}
        {isLocked && !isSubmitted && (
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center size-12 rounded-full bg-red-100 mb-3">
                <Ban className="size-6 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-red-900">Maximum Attempts Reached</h2>
              <p className="text-sm text-red-600 mt-2">
                You have used all 3 verification attempts for this document. Please contact support for assistance.
              </p>
              <Separator className="my-4" />
              <div className="flex items-center justify-center gap-2 text-xs text-red-500">
                <AlertCircle className="size-3.5" />
                <span>Contact Nurturee support at support@nurturee.com</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejection Alert — for any document that can re-upload (including Aadhaar) */}
        {isRejected && !isSubmitted && !isLocked && (
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <XCircle className="size-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Verification Rejected</p>
                  <p className="text-sm text-red-700 mt-1">{lastRejectionReason}</p>
                  <p className="text-xs text-red-500 mt-2 font-medium">
                    Re-upload (Attempt {nextAttempt} of {MAX_ATTEMPTS})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description Card with Attempt Tracker */}
        {!isFrozen && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">{config.description}</p>
              <div className="flex items-center gap-2 mt-3">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                  <div
                    key={i}
                    className={`size-2.5 rounded-full transition-colors ${
                      i < attemptsUsed
                        ? 'bg-blue-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
                <span className="text-xs text-gray-500 ml-1">
                  {attemptsUsed === 0
                    ? 'No attempts used'
                    : `${attemptsUsed} of ${MAX_ATTEMPTS} attempts used`}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Fields — only when not frozen */}
        {!isFrozen && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">
                Required Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.fields.map((field) => {
                if (field.type === 'date') {
                  const dateValue = formFields[field.key] || '';
                  const parsedDate = dateValue ? (() => {
                    const parts = dateValue.split('/');
                    if (parts.length === 3) {
                      const [day, month, year] = parts.map(Number);
                      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                        return new Date(year, month - 1, day);
                      }
                    }
                    return undefined;
                  })() : undefined;

                  return (
                    <div key={field.key} className="space-y-2">
                      <Label className="text-xs font-medium text-gray-500">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </Label>
                      <Popover
                        open={calendarOpen[field.key] || false}
                        onOpenChange={(open) => {
                          if (open) {
                            tempCalendarDateRef.current[field.key] = parsedDate;
                          }
                          setCalendarOpen((prev) => ({ ...prev, [field.key]: open }));
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal text-sm"
                            disabled={isSubmitted || isReviewing}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateValue || `Select ${field.label}`}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={tempCalendarDateRef.current[field.key] ?? parsedDate}
                            onSelect={(date) => {
                              tempCalendarDateRef.current[field.key] = date ?? undefined;
                            }}
                            captionLayout="dropdown"
                            fromYear={1940}
                            toYear={currentYear}
                            defaultMonth={parsedDate || new Date(currentYear - 30, 0)}
                          />
                          <div className="flex items-center justify-between border-t px-3 py-2">
                            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => {
                              setCalendarOpen((prev) => ({ ...prev, [field.key]: false }));
                            }}>Cancel</Button>
                            <Button size="sm" className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                              const confirmed = tempCalendarDateRef.current[field.key];
                              if (confirmed) {
                                const formatted = format(confirmed, 'dd/MM/yyyy');
                                setFormFields((prev) => ({ ...prev, [field.key]: formatted }));
                              }
                              setCalendarOpen((prev) => ({ ...prev, [field.key]: false }));
                            }}>OK</Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  );
                }

                if (field.type === 'select') {
                  return (
                    <div key={field.key} className="space-y-2">
                      <Label className="text-xs font-medium text-gray-500">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </Label>
                      <select
                        value={formFields[field.key] || ''}
                        onChange={(e) => setFormFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        disabled={isSubmitted || isReviewing}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                // text field
                return (
                  <div key={field.key} className="space-y-2">
                    <Label className="text-xs font-medium text-gray-500">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type="text"
                      placeholder={field.placeholder}
                      value={formFields[field.key] || ''}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      disabled={isSubmitted || isReviewing}
                      className="text-sm"
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Document Upload — only when not frozen */}
        {!isFrozen && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">
                {activeType === 'aadhaar' ? 'Upload Aadhaar Card' : 'Upload Documents'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeType === 'aadhaar' ? (
                /* ─── Aadhaar: Two separate columns for Front & Back ─── */
                <div className="grid grid-cols-2 gap-3">
                  {(['front', 'back'] as const).map((side) => {
                    const files = side === 'front' ? uploadedFront : uploadedBack;
                    const hasFile = files.length > 0;
                    return (
                      <div key={side}>
                        <p className="text-xs font-medium text-gray-500 mb-1.5 text-center">
                          {side === 'front' ? 'Front Side' : 'Back Side'}
                        </p>
                        <div
                          className={`relative border-2 border-dashed rounded-xl transition-colors overflow-hidden ${
                            isSubmitted || isReviewing
                              ? 'border-gray-200 bg-gray-50/50'
                              : hasFile
                                ? 'border-emerald-300 bg-emerald-50/30'
                                : 'border-gray-200 hover:border-blue-400 active:border-blue-500'
                          }`}
                          style={{ minHeight: '120px' }}
                        >
                          {!isSubmitted && !isReviewing && (
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/heic,application/pdf"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              onChange={handleAadhaarSideChange(side)}
                            />
                          )}
                          <div className={`relative z-0 flex flex-col items-center justify-center p-4 ${isSubmitted || isReviewing ? 'opacity-50' : 'pointer-events-none'}`}>
                            {hasFile ? (
                              <>
                                <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                                  <CheckCircle className="size-5 text-emerald-600" />
                                </div>
                                <p className="text-xs font-medium text-emerald-700 truncate max-w-full px-1">{files[0].name}</p>
                                <p className="text-[10px] text-emerald-500 mt-0.5">{(files[0].size / 1024).toFixed(0)} KB</p>
                                {!isSubmitted && !isReviewing && (
                                  <p className="text-[10px] text-blue-500 mt-1.5 font-medium">Tap to replace</p>
                                )}
                              </>
                            ) : (
                              <>
                                <div className={`size-10 rounded-full flex items-center justify-center mb-2 ${isSubmitted || isReviewing ? 'bg-gray-100' : 'bg-blue-50'}`}>
                                  <Camera className={`size-5 ${isSubmitted || isReviewing ? 'text-gray-300' : 'text-blue-500'}`} />
                                </div>
                                <p className="text-xs font-medium text-gray-600">
                                  {isSubmitted || isReviewing ? 'Locked' : 'Tap to upload'}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  JPG, PNG, HEIC, PDF
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        {/* Remove button for uploaded file */}
                        {hasFile && !isSubmitted && !isReviewing && (
                          <button
                            type="button"
                            onClick={handleRemoveAadhaarSide(side)}
                            className="mt-1.5 mx-auto flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <XCircle className="size-3" />
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ─── Generic upload area for non-Aadhaar docs ─── */
                <>
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors overflow-hidden ${
                      isSubmitted || isReviewing
                        ? 'border-gray-200 bg-gray-50/50'
                        : 'border-gray-200 hover:border-blue-400 active:border-blue-500'
                    }`}
                  >
                    {!isSubmitted && !isReviewing && (
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/heic,application/pdf"
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleFileChange}
                      />
                    )}
                    <div className={`relative z-0 ${isSubmitted || isReviewing ? 'opacity-50' : 'pointer-events-none'}`}>
                      <Upload className={`size-8 mx-auto mb-2 ${isSubmitted || isReviewing ? 'text-gray-300' : 'text-blue-500'}`} />
                      <p className="text-sm font-medium text-gray-700">
                        {isSubmitted || isReviewing ? 'Upload locked during review' : 'Tap here to upload document'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        JPG, PNG, HEIC or PDF — Max {config.maxFileSize / 1024 / 1024}MB
                      </p>
                      {uploadedFiles.length > 0 && !isSubmitted && !isReviewing && (
                        <div className="mt-2 inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                          <CheckCircle className="size-3" />
                          {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} selected — tap to add more
                        </div>
                      )}
                    </div>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Uploaded Documents</p>
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                          <div className="size-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                            <FileText className="size-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
                          </div>
                          {!(isSubmitted || isReviewing) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(file.id)}
                              className="flex items-center justify-center size-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <XCircle className="size-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {!isFrozen && (
          <Button
            className={`w-full h-12 text-sm font-medium rounded-xl shadow-md ${
              isSubmitDisabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
            }`}
            disabled={isSubmitDisabled}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : isRejected ? (
              <>
                <RefreshCw className="size-4 mr-2" />
                Re-submit for Verification (Attempt {nextAttempt} of {MAX_ATTEMPTS})
              </>
            ) : (
              <>
                <Send className="size-4 mr-2" />
                Submit for Verification
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
