'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Clock,
  MapPin,
  ShieldCheck,
  IndianRupee,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Phone,
} from 'lucide-react';
import { NURTUREE_HELPLINE } from '@/lib/constants';
import { formatTime, getFamilyLabel } from '@/lib/helpers';

// ── Types ────────────────────────────────────────────────────────────
type ServiceCategory = 'child_care' | 'elder_care';

type FlowStep = 'intro' | 'enter_otp' | 'verifying' | 'success';

interface ShiftCompleteOTPProps {
  shiftId: string;
  bookingId: string;
  serviceType: string;
  serviceCategory: ServiceCategory;
  address: string;
  startTime: string;
  endTime: string;
  earnings: number;
  onComplete: (shiftId: string) => void;
  onCancel: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────
const DEMO_OTP = '1234';
const RESEND_COOLDOWN = 30; // seconds

// ── Component ────────────────────────────────────────────────────────
export default function ShiftCompleteOTP({
  shiftId,
  bookingId,
  serviceType,
  serviceCategory,
  address,
  startTime,
  endTime,
  earnings,
  onComplete,
  onCancel,
}: ShiftCompleteOTPProps) {
  // ── State ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<FlowStep>('intro');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [error, setError] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const familyLabel = getFamilyLabel(serviceCategory);

  // ── Cleanup timer on unmount ──────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Resend countdown ───────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'enter_otp' || resendTimer <= 0) return;

    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, resendTimer]);

  // ── Reset OTP inputs when entering enter_otp step ─────────────────
  useEffect(() => {
    if (step === 'enter_otp') {
      setOtp(['', '', '', '']);
      setError('');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // ── Handlers ───────────────────────────────────────────────────────
  const handleStartOTP = useCallback(() => {
    setResendTimer(RESEND_COOLDOWN);
    setStep('enter_otp');
  }, []);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/\D/g, '');

      if (digit.length > 1) {
        const digits = digit.slice(0, 4);
        const newOtp = [...otp];
        for (let i = 0; i < digits.length && index + i < 4; i++) {
          newOtp[index + i] = digits[i];
        }
        setOtp(newOtp);
        setError('');
        const nextEmpty = newOtp.findIndex((v, i) => i > index && v === '');
        if (nextEmpty !== -1) {
          inputRefs.current[nextEmpty]?.focus();
        } else {
          inputRefs.current[3]?.focus();
        }
        return;
      }

      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);
      setError('');

      if (digit && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (!otp[index] && index > 0) {
          const newOtp = [...otp];
          newOtp[index - 1] = '';
          setOtp(newOtp);
          inputRefs.current[index - 1]?.focus();
        } else {
          const newOtp = [...otp];
          newOtp[index] = '';
          setOtp(newOtp);
        }
      }
    },
    [otp],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
      if (!pasted) return;

      const newOtp = [...otp];
      for (let i = 0; i < pasted.length && i < 4; i++) {
        newOtp[i] = pasted[i];
      }
      setOtp(newOtp);
      setError('');

      const focusIdx = Math.min(pasted.length, 3);
      inputRefs.current[focusIdx]?.focus();
    },
    [otp],
  );

  const handleVerify = useCallback(() => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 4) {
      setError('Please enter all 4 digits');
      return;
    }

    setStep('verifying');
    setError('');

    setTimeout(() => {
      if (enteredOtp === DEMO_OTP) {
        setStep('success');
        setTimeout(() => {
          onComplete(shiftId);
        }, 1500);
      } else {
        setError('Invalid OTP. Please try again.');
        setStep('enter_otp');
        setOtp(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    }, 1800);
  }, [otp, shiftId, onComplete]);

  const handleResend = useCallback(() => {
    if (resendTimer > 0) return;
    setResendTimer(RESEND_COOLDOWN);
    setOtp(['', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
  }, [resendTimer]);

  const handleDialogClose = useCallback(
    (open: boolean) => {
      if (!open) {
        onCancel();
      }
    },
    [onCancel],
  );

  // ── Sub-renderers ──────────────────────────────────────────────────
  const renderShiftSummary = () => (
    <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Badge variant="outline" className="text-xs font-medium">
          {serviceType}
        </Badge>
        <span className="font-medium text-foreground">{bookingId}</span>
      </div>
      <div className="grid grid-cols-1 gap-1.5 mt-2">
        <div className="flex items-center gap-2">
          <Clock className="size-3.5 text-muted-foreground shrink-0" />
          <span>
            {formatTime(startTime)} – {formatTime(endTime)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="size-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{address}</span>
        </div>
        <div className="flex items-center gap-2">
          <IndianRupee className="size-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-emerald-600">
            ₹{earnings.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );

  const renderOtpInputs = () => (
    <div className="flex justify-center gap-3">
      {otp.map((digit, i) => (
        <Input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleOtpChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={step === 'verifying'}
          className={
            'h-14 w-14 text-center text-2xl font-bold tracking-widest tabular-nums focus-visible:ring-blue-500 ' +
            (error ? 'border-destructive focus-visible:ring-destructive' : '')
          }
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );

  // ── RENDER: Intro (same layout as ShiftCheckIn intro) ─────────────
  if (step === 'intro') {
    return (
      <Dialog open onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="flex flex-col min-h-full">
            <DialogHeader className="text-center sm:text-center">
              <div className="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-blue-100">
                <ShieldCheck className="size-6 text-blue-600" />
              </div>
              <DialogTitle className="text-lg">Complete Shift Verification</DialogTitle>
              <DialogDescription className="text-xs">
                OTP verification is mandatory before completing any shift.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 space-y-3">
              {/* Step overview card */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border bg-blue-50">
                  <div className="flex size-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">1</div>
                  <div>
                    <p className="text-xs font-medium text-blue-700">OTP Confirmation</p>
                    <p className="text-[11px] text-blue-600">4-digit OTP with {familyLabel.toLowerCase()}</p>
                  </div>
                </div>
              </div>

              {renderShiftSummary()}

              {/* Info box */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-blue-600" />
                  <p className="text-xs font-medium text-blue-700">Verify OTP from registered number</p>
                </div>
                <p className="text-xs text-blue-600">
                  A 4-digit OTP will be sent to the customer&apos;s registered mobile number. Ask the {familyLabel.toLowerCase()} for it.
                </p>
              </div>
            </div>

            <DialogFooter className="mt-auto pt-4 border-t border-gray-100 flex-col gap-2 sm:flex-col sm:space-x-0">
              <Button
                onClick={handleStartOTP}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ShieldCheck className="size-4 mr-2" />
                Request OTP
              </Button>
              <a
                href={NURTUREE_HELPLINE}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 h-9 text-sm font-medium hover:bg-emerald-100 transition-colors w-full"
              >
                <Phone className="size-4" />
                Call Nurturee Helpline
              </a>
              <Button variant="ghost" onClick={onCancel} className="w-full">
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── RENDER: Enter OTP (same layout as ShiftCheckIn OTP step) ──────
  if (step === 'enter_otp') {
    return (
      <Dialog open onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="flex flex-col min-h-full">
            <DialogHeader className="text-center sm:text-center relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 -mt-2 size-8"
                onClick={() => setStep('intro')}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div className="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-blue-100">
                <ShieldCheck className="size-6 text-blue-600" />
              </div>
              <DialogTitle className="text-lg">Enter OTP</DialogTitle>
              <DialogDescription>
                A 4-digit OTP has been sent to the registered mobile number of the {familyLabel.toLowerCase()}. Ask them for the OTP.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex flex-col justify-center gap-4">
              {/* OTP sent info */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-blue-600" />
                  <p className="text-xs font-medium text-blue-700">OTP sent to registered mobile number</p>
                </div>
                <p className="text-xs text-blue-600">
                  Ask the {familyLabel.toLowerCase()} to share the OTP received on their registered mobile number.
                </p>
              </div>

              {renderOtpInputs()}

              {error && (
                <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  {error}
                </div>
              )}

              {/* Resend */}
              <div className="text-center text-sm">
                {resendTimer > 0 ? (
                  <span className="text-muted-foreground">
                    Resend OTP in{' '}
                    <span className="font-semibold text-foreground">{resendTimer}s</span>
                  </span>
                ) : (
                  <button
                    onClick={handleResend}
                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>

            <DialogFooter className="mt-auto pt-4 border-t border-gray-100 flex-col gap-2 sm:flex-col sm:space-x-0">
              <Button
                onClick={handleVerify}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={otp.join('').length < 4}
              >
                <ShieldCheck className="size-4 mr-2" />
                Verify & Complete Shift
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── RENDER: Verifying (same style as ShiftCheckIn) ────────────────
  if (step === 'verifying') {
    return (
      <Dialog open onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
            <div className="relative">
              <div className="size-16 rounded-full border-4 border-blue-200" />
              <Loader2 className="absolute inset-0 size-16 animate-spin text-blue-600" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-semibold">Verifying OTP…</h3>
              <p className="text-xs text-muted-foreground">
                Confirming with {familyLabel.toLowerCase()}.
              </p>
              <p className="text-xs text-muted-foreground">
                This will only take a moment.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── RENDER: Success (same style as ShiftCheckIn success) ───────────
  if (step === 'success') {
    return (
      <Dialog open onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="flex flex-col min-h-full justify-center items-center gap-5 py-4">
            <div className="relative">
              {/* Animated glow ring */}
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20" />
              <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
                <CheckCircle className="size-10 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                Shift Completed!
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Shift verified successfully. Earnings will be credited to your wallet shortly.
              </p>
            </div>

            {/* Completed checks */}
            <div className="w-full space-y-2">
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                <CheckCircle className="size-4 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-medium text-emerald-700">OTP Confirmed</span>
                  <span className="text-emerald-600 ml-1">— Verified by {familyLabel.toLowerCase()}</span>
                </div>
              </div>
            </div>

            {renderShiftSummary()}

            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm w-full">
              <IndianRupee className="size-4 text-emerald-600" />
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                ₹{earnings.toLocaleString('en-IN')}
              </span>
              <span className="text-muted-foreground">earned this shift</span>
            </div>

            <a
              href={NURTUREE_HELPLINE}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 h-10 text-sm font-medium hover:bg-emerald-100 transition-colors w-full"
            >
              <Phone className="size-4" />
              Call Nurturee Helpline
            </a>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Fallback ───────────────────────────────────────────────────────
  return null;
}
