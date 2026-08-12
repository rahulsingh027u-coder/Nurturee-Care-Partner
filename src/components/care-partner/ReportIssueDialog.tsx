'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Phone,
  X,
} from 'lucide-react';
import { NURTUREE_HELPLINE } from '@/lib/constants';

interface ReportIssueDialogProps {
  open: boolean;
  onClose: () => void;
  patientName?: string;
  bookingId?: string;
  shiftDate?: string;
}

const ISSUE_REASONS = [
  { value: 'client_not_available', label: 'Client not available', icon: '🚪' },
  { value: 'safety_concern', label: 'Safety concern', icon: '⚠️' },
  { value: 'address_mismatch', label: 'Address mismatch', icon: '📍' },
  { value: 'service_dispute', label: 'Service dispute', icon: '💬' },
  { value: 'equipment_issue', label: 'Equipment issue', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '📌' },
];

function reasonLabel(value: string): string {
  const found = ISSUE_REASONS.find((r) => r.value === value);
  return found ? found.label : value;
}

export default function ReportIssueDialog({
  open,
  onClose,
  patientName,
  bookingId,
  shiftDate,
}: ReportIssueDialogProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleReset = () => {
    setSelectedReason('');
    setDescription('');
    setIsUrgent(false);
    setSubmitted(false);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Report Issue Form */}
      {!submitted && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={handleReset}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full mx-0 sm:mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="size-4.5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Report Issue</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {patientName
                      ? <>Shift with <span className="font-medium text-gray-700">{patientName}</span>{shiftDate && <>&middot; {shiftDate}</>}</>
                      : 'Report a shift-related issue'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="size-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Reason Selection */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Issue Type</p>
                <div className="space-y-1.5">
                  {ISSUE_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => setSelectedReason(reason.value)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-sm flex items-center gap-2.5 transition-all cursor-pointer ${
                        selectedReason === reason.value
                          ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-gray-100 text-gray-700 hover:bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-base">{reason.icon}</span>
                      <span className="font-medium">{reason.label}</span>
                      {selectedReason === reason.value && (
                        <CheckCircle className="size-4 text-blue-600 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgent Toggle */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Priority</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsUrgent(false)}
                    className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !isUrgent
                        ? 'border-gray-200 bg-gray-50 text-gray-700'
                        : 'border-gray-100 text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <Clock className="size-3.5" />
                    Normal
                  </button>
                  <button
                    onClick={() => setIsUrgent(true)}
                    className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isUrgent
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : 'border-gray-100 text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <AlertTriangle className="size-3.5" />
                    Urgent
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Details <span className="text-gray-300 normal-case">(optional)</span>
                </p>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  className="min-h-[80px] rounded-xl border-gray-200 text-sm resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 pt-2 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-10"
                onClick={handleReset}
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 rounded-xl h-10 gap-2 ${
                  selectedReason
                    ? (isUrgent ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white')
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!selectedReason}
                onClick={() => {
                  // TODO: Send report to backend
                  setSubmitted(true);
                }}
              >
                <Send className="size-3.5" />
                Submit Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Submitted Confirmation */}
      {submitted && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={handleReset}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full mx-0 sm:mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-8 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20" />
                <div className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
                  <CheckCircle className="size-8 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Issue Reported</h3>
              <p className="text-sm text-gray-500 mt-1.5 max-w-xs leading-relaxed">
                {isUrgent
                  ? 'Your urgent report has been submitted. Our support team will contact you shortly.'
                  : 'Your report has been submitted. We\'ll review it and get back to you within 24 hours.'}
              </p>

              {/* Report Summary */}
              <div className="w-full mt-4 rounded-xl border border-gray-100 bg-gray-50/50 p-3 space-y-2 text-left">
                {patientName && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Care Member</span>
                    <span className="font-medium text-gray-700">{patientName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Issue Type</span>
                  <span className="font-medium text-gray-700">{reasonLabel(selectedReason)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Priority</span>
                  <Badge
                    variant={isUrgent ? 'destructive' : 'secondary'}
                    className={`text-[10px] px-2 py-0 h-5 ${isUrgent ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {isUrgent ? 'Urgent' : 'Normal'}
                  </Badge>
                </div>
                {bookingId && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Shift</span>
                    <span className="font-medium text-gray-700">{bookingId}</span>
                  </div>
                )}
              </div>

              <a
                href={NURTUREE_HELPLINE}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 h-10 text-sm font-medium hover:bg-emerald-100 transition-colors w-full mt-3"
              >
                <Phone className="size-4" />
                Call Nurturee Helpline
              </a>

              <Button className="w-full mt-2 rounded-xl h-10" onClick={handleReset}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
