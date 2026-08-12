'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from 'lucide-react';

interface TermsAcceptanceProps {
  onAccept: () => void;
}

export default function TermsAcceptance({ onAccept }: TermsAcceptanceProps) {
  const [tosAccepted, setTosAccepted] = useState(false);
  const [ppAccepted, setPpAccepted] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'tos' | 'pp' | null>(null);

  const canProceed = tosAccepted && ppAccepted;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-blue-100">
            <ShieldCheck className="size-7 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Terms &amp; Policies</h1>
          <p className="text-sm text-gray-500 mt-1">
            Please review and accept before continuing
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Terms of Service */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => setExpandedSection(expandedSection === 'tos' ? null : 'tos')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Terms of Service</p>
                  <p className="text-xs text-gray-400 mt-0.5">Care Partner Agreement</p>
                </div>
              </div>
              {expandedSection === 'tos' ? (
                <ChevronUp className="size-4 text-gray-400" />
              ) : (
                <ChevronDown className="size-4 text-gray-400" />
              )}
            </button>
            {expandedSection === 'tos' && (
              <div className="px-4 pb-4 max-h-60 overflow-y-auto">
                <div className="text-xs text-gray-600 leading-relaxed space-y-3 pr-2">
                  <p>
                    <strong>1. Service Agreement</strong><br />
                    By joining Nurturee as a Care Partner, you agree to provide care services
                    professionally and in accordance with the standards set by Nurturee. You
                    understand that you are an independent service provider and not an employee
                    of Nurturee Technologies Private Limited.
                  </p>
                  <p>
                    <strong>2. Eligibility</strong><br />
                    You must be at least 18 years old, possess valid identification (Aadhaar),
                    and have the required qualifications and certifications for the care
                    services you offer. All documents submitted must be genuine and verifiable.
                  </p>
                  <p>
                    <strong>3. Service Standards</strong><br />
                    You agree to maintain professional conduct during all shifts, arrive on time,
                    follow the care plan provided for each patient, and report any emergencies
                    or incidents immediately through the Nurturee app.
                  </p>
                  <p>
                    <strong>4. Earnings &amp; Payments</strong><br />
                    Earnings are calculated based on completed shift hours and service type.
                    Payments are processed weekly and transferred to your registered bank
                    account. Nurturee reserves the right to adjust earnings in case of
                    verified complaints or service cancellations.
                  </p>
                  <p>
                    <strong>5. Shift Policies</strong><br />
                    Confirmed shifts must be attended. Cancellations within 2 hours of a
                    scheduled shift may result in a rating penalty. Three or more no-shows
                    may result in account suspension.
                  </p>
                  <p>
                    <strong>6. Termination</strong><br />
                    Either party may terminate this agreement with 7 days&apos; written notice.
                    Nurturee reserves the right to suspend or terminate your account
                    immediately for misconduct, fake documents, or safety violations.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Policy */}
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === 'pp' ? null : 'pp')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock className="size-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Privacy Policy</p>
                  <p className="text-xs text-gray-400 mt-0.5">Data Protection &amp; Usage</p>
                </div>
              </div>
              {expandedSection === 'pp' ? (
                <ChevronUp className="size-4 text-gray-400" />
              ) : (
                <ChevronDown className="size-4 text-gray-400" />
              )}
            </button>
            {expandedSection === 'pp' && (
              <div className="px-4 pb-4 max-h-60 overflow-y-auto">
                <div className="text-xs text-gray-600 leading-relaxed space-y-3 pr-2">
                  <p>
                    <strong>1. Data Collection</strong><br />
                    We collect your name, phone number, email, Aadhaar number (for
                    verification only), bank account details for payments, and service
                    preferences. Location data is collected during shift check-in/check-out
                    for verification purposes only.
                  </p>
                  <p>
                    <strong>2. Data Usage</strong><br />
                    Your data is used to: verify your identity and qualifications, match
                    you with appropriate care assignments, process payments, communicate
                    shift details, and improve our services. We do not sell your personal
                    information to third parties.
                  </p>
                  <p>
                    <strong>3. Data Security</strong><br />
                    All personal data is encrypted in transit and at rest. Aadhaar details
                    are verified through UIDAI and are not stored in our servers beyond the
                    verification period. Access to sensitive data is restricted to
                    authorized personnel only.
                  </p>
                  <p>
                    <strong>4. Photos &amp; Selfie Verification</strong><br />
                    Selfie photos taken during shift check-in are used solely for identity
                    verification and attendance confirmation. These are processed in
                    real-time and are not permanently stored unless required for dispute
                    resolution.
                  </p>
                  <p>
                    <strong>5. Your Rights</strong><br />
                    You may request access to, correction of, or deletion of your personal
                    data at any time by contacting support@nurturee.com. You can also
                    request a complete data export.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Checkboxes */}
        <div className="mt-4 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => setTosAccepted(e.target.checked)}
                className="peer sr-only"
              />
              <div className="size-5 rounded-md border-2 border-gray-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 transition-colors flex items-center justify-center">
                {tosAccepted && <CheckCircle className="size-3.5 text-white" />}
              </div>
            </div>
            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
              I have read and agree to the{' '}
              <button
                onClick={() => setExpandedSection('tos')}
                className="text-blue-600 font-medium hover:underline"
              >
                Terms of Service
              </button>
              <span className="text-red-500 ml-0.5">*</span>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={ppAccepted}
                onChange={(e) => setPpAccepted(e.target.checked)}
                className="peer sr-only"
              />
              <div className="size-5 rounded-md border-2 border-gray-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 transition-colors flex items-center justify-center">
                {ppAccepted && <CheckCircle className="size-3.5 text-white" />}
              </div>
            </div>
            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
              I have read and agree to the{' '}
              <button
                onClick={() => setExpandedSection('pp')}
                className="text-blue-600 font-medium hover:underline"
              >
                Privacy Policy
              </button>
              <span className="text-red-500 ml-0.5">*</span>
            </span>
          </label>
        </div>

        {/* Action */}
        <Button
          onClick={onAccept}
          disabled={!canProceed}
          className={`w-full mt-6 h-12 text-sm font-semibold rounded-xl transition-all ${
            canProceed
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ShieldCheck className="size-4 mr-2" />
          {canProceed ? 'Continue to Dashboard' : 'Accept Both to Continue'}
        </Button>

        <p className="text-center text-[11px] text-gray-400 mt-3">
          Both agreements are required to access the Care Partner dashboard.
        </p>
      </div>
    </div>
  );
}
