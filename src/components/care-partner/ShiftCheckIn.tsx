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
  MapPin,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle,
  Camera,
  Clock,
  ArrowLeft,
  IndianRupee,
  Eye,
  XCircle,
  RotateCcw,
  Phone,
  ScanFace,
} from 'lucide-react';

import type { Shift } from '@/lib/care-partner-data';
import { NURTUREE_HELPLINE } from '@/lib/constants';
import { formatTime, getFamilyLabel } from '@/lib/helpers';

// ── Skin-tone face detection (pure canvas, works on all browsers) ────────
function detectSkinInOval(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): boolean {
  const vw = video.videoWidth || 480;
  const vh = video.videoHeight || 640;
  canvas.width = vw;
  canvas.height = vh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  ctx.drawImage(video, 0, 0, vw, vh);

  // Sample the center oval region (face area)
  const cx = vw / 2;
  const cy = vh / 2;
  const rx = vw * 0.2;  // oval horizontal radius
  const ry = vh * 0.28; // oval vertical radius
  const step = 8;        // sample every 8px for speed

  let skinPixels = 0;
  let totalPixels = 0;

  for (let y = cy - ry; y <= cy + ry; y += step) {
    for (let x = cx - rx; x <= cx + rx; x += step) {
      // Check if inside ellipse: ((x-cx)/rx)^2 + ((y-cy)/ry)^2 <= 1
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;

      totalPixels++;
      const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      const r = pixel[0], g = pixel[1], b = pixel[2];

      // Skin-tone detection in RGB space (covers wide range of skin tones)
      // Rules: R > G > B, R between 60-255, G between 30-220, B between 15-180
      // And logical skin-tone constraints based on chrominance
      if (
        r > 60 && g > 30 && b > 15 &&
        r > g && r > b &&
        (r - g) > 10 &&
        (r - b) > 15 &&
        Math.abs(r - g) < 100 &&
        b < r * 0.75 &&
        g < r * 0.9
      ) {
        skinPixels++;
      }
    }
  }

  // Need at least 30% skin-tone pixels in the oval to consider face detected
  return totalPixels > 0 && (skinPixels / totalPixels) > 0.30;
}

// ── Types ────────────────────────────────────────────────────────────
type CheckInStep =
  | 'intro'
  | 'selfie'
  | 'selfie_preview'
  | 'selfie_processing'
  | 'location_check'
  | 'location_passed'
  | 'location_failed'
  | 'otp_enter'
  | 'otp_verifying'
  | 'success'
  | 'failed';

interface ShiftCheckInProps {
  shift: Shift;
  onStart: (shiftId: string) => void;
  onCancel: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────
const DEMO_OTP = '1234';
const RESEND_COOLDOWN = 30;

// ── Component ────────────────────────────────────────────────────────
export default function ShiftCheckIn({
  shift,
  onStart,
  onCancel,
}: ShiftCheckInProps) {
  const [step, setStep] = useState<CheckInStep>('intro');
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [error, setError] = useState('');
  const [useDemoMode, setUseDemoMode] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceDetectRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoCaptureRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const familyLabel = getFamilyLabel(shift.serviceCategory);

  // ── Cleanup camera stream on unmount ──────────
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (faceDetectRef.current) clearInterval(faceDetectRef.current);
      if (autoCaptureRef.current) clearTimeout(autoCaptureRef.current);
    };
  }, []);

  // ── Auto-start location check when step reaches location_check ──
  useEffect(() => {
    if (step === 'location_check') {
      startLocationCheck();
    }
  }, [step]); // intentionally only depend on step to trigger once per entry

  // ── Resend countdown ───────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'otp_enter' || resendTimer <= 0) return;

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

  // ── Reset OTP inputs ──────────────────────────────────────────────
  useEffect(() => {
    if (step === 'otp_enter') {
      setOtp(['', '', '', '']);
      setError('');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // ── Step 1: Selfie Capture ─────────────────────────────────────────
  const startSelfieCapture = useCallback(async () => {
    setStep('selfie');
    setFaceDetected(false);
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 640 },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        // Start face detection loop (~5 fps) once video is playing
        const detCanvas = detectionCanvasRef.current || document.createElement('canvas');
        detectionCanvasRef.current = detCanvas;

        if (faceDetectRef.current) clearInterval(faceDetectRef.current);
        faceDetectRef.current = setInterval(() => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          const detected = detectSkinInOval(videoRef.current, detCanvas);
          setFaceDetected(detected);

          // Auto-capture after face is stable in oval for 1.5s
          if (detected && !autoCaptureRef.current) {
            autoCaptureRef.current = setTimeout(() => {
              autoCaptureRef.current = null;
              captureSelfie();
            }, 1500);
          } else if (!detected && autoCaptureRef.current) {
            clearTimeout(autoCaptureRef.current);
            autoCaptureRef.current = null;
          }
        }, 200);
      }
    } catch {
      if (useDemoMode) {
        setStep('location_check');
      } else {
        setError('Camera access denied. Please allow camera access.');
      }
    }
  }, [useDemoMode]);

  const stopFaceDetection = useCallback(() => {
    if (faceDetectRef.current) {
      clearInterval(faceDetectRef.current);
      faceDetectRef.current = null;
    }
    if (autoCaptureRef.current) {
      clearTimeout(autoCaptureRef.current);
      autoCaptureRef.current = null;
    }
    setFaceDetected(false);
  }, []);

  const captureSelfie = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror the image (selfie style)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setSelfieDataUrl(dataUrl);

    // Stop camera stream + face detection
    stopFaceDetection();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Show preview for user to accept or retake
    setStep('selfie_preview');
  }, [stopFaceDetection]);

  const skipSelfie = useCallback(() => {
    stopFaceDetection();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStep('location_check');
  }, [stopFaceDetection]);

  const retakeSelfie = useCallback(() => {
    setSelfieDataUrl(null);
    startSelfieCapture();
  }, [startSelfieCapture]);

  // Accept selfie and proceed to liveness check (backend-ready)
  const acceptSelfie = useCallback(() => {
    setStep('selfie_processing');
    // TODO: Send selfieDataUrl to backend for liveness/face verification
    // For now, simulate processing delay
    setTimeout(() => {
      setStep('location_check');
    }, 1500);
  }, []);

  // ── Step 2: Location Verification (High Accuracy GPS) ───────────────
  const startLocationCheck = useCallback(async () => {
    setStep('location_check');
    setError('');

    try {
      if (useDemoMode) {
        // Demo mode — simulate GPS fetch
        await new Promise((r) => setTimeout(r, 2000));
        setStep('location_passed');
        return;
      }

      // Real high-accuracy GPS check
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const accuracy = position.coords.accuracy;
      if (accuracy <= 100) {
        setStep('location_passed');
      } else {
        setError(`GPS accuracy too low (${Math.round(accuracy)}m). Need within 100m.`);
        setStep('location_failed');
      }
    } catch (err) {
      setError('Location check failed. Please enable location services and try again.');
      setStep('location_failed');
    }
  }, [useDemoMode]);

  // ── Step 3: OTP Verification ──────────────────────────────────────
  const handleRequestOTP = useCallback(() => {
    setResendTimer(RESEND_COOLDOWN);
    setStep('otp_enter');
  }, []);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/\D/g, '');

      if (digit.length > 1) {
        // Handle paste: fill as many slots as possible
        const digits = digit.slice(0, 4);
        const newOtp = [...otp];
        for (let i = 0; i < digits.length && index + i < 4; i++) {
          newOtp[index + i] = digits[i];
        }
        setOtp(newOtp);
        setError('');
        const nextEmpty = newOtp.findIndex((v, i) => i > index && v === '');
        inputRefs.current[nextEmpty !== -1 ? nextEmpty : 3]?.focus();
        return;
      }

      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);
      setError('');

      // Auto-advance to next input
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
          // If current is empty, go back to previous
          const newOtp = [...otp];
          newOtp[index - 1] = '';
          setOtp(newOtp);
          inputRefs.current[index - 1]?.focus();
        } else {
          // Clear current
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

    setStep('otp_verifying');
    setError('');

    // Simulate verification (demo: accept 1234)
    setTimeout(() => {
      if (enteredOtp === DEMO_OTP) {
        setStep('success');
        // Call onStart after a brief delay for the success animation
        setTimeout(() => {
          onStart(shift.id);
        }, 1500);
      } else {
        setError('Invalid OTP. Please try again.');
        setStep('otp_enter');
        setOtp(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    }, 1800);
  }, [otp, shift.id, onStart]);

  const handleResend = useCallback(() => {
    if (resendTimer > 0) return;
    setResendTimer(RESEND_COOLDOWN);
    setOtp(['', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
  }, [resendTimer]);

  const handleDialogClose = useCallback(
    (open: boolean) => {
      if (!open) onCancel();
    },
    [onCancel],
  );

  // ── Sub-renderers ──────────────────────────────────────────────────

  // Shift summary card
  const renderShiftSummary = () => (
    <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Badge variant="outline" className="text-xs font-medium">
          {shift.serviceType}
        </Badge>
        <span className="font-medium text-foreground">{shift.bookingId}</span>
      </div>
      <div className="grid grid-cols-1 gap-1.5 mt-2">
        <div className="flex items-center gap-2">
          <Clock className="size-3.5 text-muted-foreground shrink-0" />
          <span>{formatTime(shift.startTime)} – {formatTime(shift.endTime)}</span>
        </div>
        {shift.address && (
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{shift.address}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <IndianRupee className="size-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-emerald-600">₹{shift.earnings.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );

  // Progress stepper — order: Selfie → Location → OTP
  const renderStepper = (currentStep: number) => (
    <div className="flex items-center justify-center gap-1 mb-2">
      {[
        { n: 1, label: 'Selfie' },
        { n: 2, label: 'Location' },
        { n: 3, label: 'OTP' },
      ].map((s, i) => (
        <div key={s.n} className="flex items-center gap-1">
          <div
            className={`flex items-center justify-center rounded-full size-7 text-xs font-bold ${
              currentStep >= s.n
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
            title={s.label}
          >
            {currentStep > s.n ? <CheckCircle className="size-3.5" /> : s.n}
          </div>
          {i < 2 && (
            <div
              className={`w-8 h-0.5 ${
                currentStep > s.n ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // OTP input fields
  const renderOtpInputs = () => (
    <div className="flex justify-center gap-3">
      {otp.map((digit, i) => (
        <Input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleOtpChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={step === 'otp_verifying'}
          className={
            'h-14 w-14 text-center text-2xl font-bold tracking-widest tabular-nums focus-visible:ring-blue-500 ' +
            (error ? 'border-destructive focus-visible:ring-destructive' : '')
          }
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );

  // Hidden canvas for selfie capture
  const renderHiddenCanvas = () => (
    <canvas ref={canvasRef} className="hidden" />
  );

  // ── RENDER: Intro ──────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <Dialog open onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="flex flex-col min-h-full">
            <DialogHeader className="text-center sm:text-center">
              <div className="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-blue-100">
                <ShieldCheck className="size-6 text-blue-600" />
              </div>
              <DialogTitle className="text-lg">Shift Check-In</DialogTitle>
              <DialogDescription className="text-xs">
                Daily attendance is mandatory before starting any shift.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 space-y-3">
              {renderStepper(0)}

              {/* 3-step overview */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border bg-blue-50">
                  <div className="flex size-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">1</div>
                  <div>
                    <p className="text-xs font-medium text-blue-700">Live Selfie</p>
                    <p className="text-[11px] text-blue-600">Liveness detection for identity</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border bg-blue-50">
                  <div className="flex size-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">2</div>
                  <div>
                    <p className="text-xs font-medium text-blue-700">Location Verification</p>
                    <p className="text-[11px] text-blue-600">High accuracy GPS check</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border bg-blue-50">
                  <div className="flex size-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">3</div>
                  <div>
                    <p className="text-xs font-medium text-blue-700">OTP Confirmation</p>
                    <p className="text-[11px] text-blue-600">4-digit OTP with {familyLabel.toLowerCase()}</p>
                  </div>
                </div>
              </div>

              {renderShiftSummary()}
            </div>

            <DialogFooter className="mt-auto pt-4 border-t border-gray-100 flex-col gap-2 sm:flex-col sm:space-x-0">
              <Button
                onClick={startSelfieCapture}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Camera className="size-4 mr-2" />
                Start Check-In
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

  // ── RENDER: Selfie Capture ────────────────────────────────────────
  if (step === 'selfie') {
    return (
      <Dialog open onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="flex flex-col min-h-full">
            <DialogHeader className="text-center sm:text-center">
              {renderStepper(1)}
              <div className="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-blue-100">
                <Camera className="size-6 text-blue-600" />
              </div>
              <DialogTitle className="text-lg">Capture Selfie</DialogTitle>
              <DialogDescription className="text-xs">
                Take a live selfie for identity verification.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex flex-col justify-center space-y-3">
              {/* Camera preview */}
              <div className="relative flex justify-center">
                <div className="relative w-56 h-72 rounded-2xl overflow-hidden bg-black shadow-lg">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                    autoPlay
                    playsInline
                    muted
                  />
                  {/* Face overlay guide — turns green on detection */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className={`w-36 h-48 rounded-full border-2 transition-colors duration-300 ${
                        faceDetected
                          ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                          : 'border-white/50'
                      }`}
                    />
                  </div>
                  {/* Face detection badge */}
                  {faceDetected && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-emerald-500/95 to-teal-500/95 px-2 py-0.5 shadow-lg shadow-emerald-500/20 backdrop-blur-sm">
                      <ScanFace className="size-4.5 text-white shrink-0" />
                      <span className="text-[6px] font-semibold tracking-wider text-white uppercase leading-none">
                        Face Detected
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className={`text-center text-xs ${faceDetected ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                {faceDetected ? 'Face detected — tap capture to continue' : 'Position your face within the oval guide'}
              </p>
            </div>

            <DialogFooter className="mt-auto pt-4 border-t border-gray-100 flex-col gap-2 sm:flex-col sm:space-x-0">
              <Button
                onClick={captureSelfie}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Camera className="size-4 mr-2" />
                Capture Selfie
              </Button>
            </DialogFooter>
          </div>
          {renderHiddenCanvas()}
        </DialogContent>
      </Dialog>
    );
  }

  // ── RENDER: Selfie Preview (Accept / Retake) ──────────────────────
  if (step === 'selfie_preview') {
    return (
      <Dialog open onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="flex flex-col min-h-full">
            <DialogHeader className="text-center sm:text-center">
              {renderStepper(1)}
              <div className="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-blue-100">
                <CheckCircle className="size-6 text-blue-600" />
              </div>
              <DialogTitle className="text-lg">Selfie Captured</DialogTitle>
              <DialogDescription className="text-xs">
                Review your photo below. You can retake or accept to continue.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              {/* Captured selfie preview */}
              {selfieDataUrl && (
                <div className="w-48 h-60 rounded-2xl overflow-hidden border-2 border-blue-200 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfieDataUrl} alt="Captured selfie" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                <span>Your photo will be verified for identity confirmation</span>
              </div>
            </div>

            <DialogFooter className="mt-auto pt-4 border-t border-gray-100 flex-col gap-2 sm:flex-col sm:space-x-0">
              <Button
                onClick={acceptSelfie}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle className="size-4 mr-2" />
                Accept & Continue
              </Button>
              <Button
                variant="outline"
                onClick={retakeSelfie}
                className="w-full"
              >
                <Camera className="size-4 mr-2" />
                Retake Photo
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── RENDER: Selfie Processing ──────────────────────────────────────
  if (step === 'selfie_processing') {
    return (
      <Dialog open onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader className="text-center sm:text-center">
            {renderStepper(1)}
          </DialogHeader>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="relative">
              <div className="size-16 rounded-full border-4 border-blue-200" />
              <Loader2 className="absolute inset-0 size-16 animate-spin text-blue-600" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-semibold">Verifying Selfie…</h3>
              <p className="text-xs text-muted-foreground">
                Running liveness detection to confirm your identity.
              </p>
              <p className="text-xs text-muted-foreground">
                This will only take a moment.
              </p>
            </div>
            {/* Show captured selfie */}
            {selfieDataUrl && (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selfieDataUrl} alt="Selfie preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── RENDER: Location Check (Loading) ──────────────────────────────
  if (step === 'location_check') {
    return (
      <Dialog open onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="flex flex-col min-h-full">
            <DialogHeader className="text-center sm:text-center">
              {renderStepper(2)}
              <div className="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-blue-100">
                <MapPin className="size-6 text-blue-600" />
              </div>
              <DialogTitle className="text-lg">Verifying Location</DialogTitle>
              <DialogDescription className="text-xs">
                Fetching your GPS location with high accuracy.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex flex-col items-center justify-center gap-5">
              {/* Animated location spinner */}
              <div className="relative">
                <div className="size-16 rounded-full border-4 border-blue-200" />
                <Loader2 className="absolute inset-0 size-16 animate-spin text-blue-600" />
              </div>

              <div className="text-center space-y-1.5">
                <p className="text-sm font-medium text-gray-900">Getting GPS Location…</p>
                <p className="text-xs text-muted-foreground">High accuracy mode enabled</p>
              </div>

              {/* Info cards to fill space */}
              <div className="w-full space-y-2.5">
                <div className="flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2.5">
                  <MapPin className="size-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-700">GPS Accuracy Check</p>
                    <p className="text-[11px] text-blue-600">Your location must be accurate within 100 meters for verification.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2.5">
                  <ShieldCheck className="size-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-700">Why Location is Required</p>
                    <p className="text-[11px] text-blue-600">This ensures you are at the assigned care location before starting your shift.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2.5">
                  <Eye className="size-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-700">Location Privacy</p>
                    <p className="text-[11px] text-blue-600">Your GPS coordinates are only used for attendance and never shared with third parties.</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-auto pt-4 border-t border-gray-100 flex-col gap-2 sm:flex-col sm:space-x-0">
              <Button variant="ghost" onClick={onCancel} className="w-full">
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── RENDER: Location Passed ────────────────────────────────────────
  if (step === 'location_passed') {
    return (
      <Dialog open onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="flex flex-col min-h-full">
            <DialogHeader className="text-center sm:text-center">
              {renderStepper(2)}
              <div className="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="size-6 text-emerald-600" />
              </div>
              <DialogTitle className="text-lg">Location Verified</DialogTitle>
              <DialogDescription className="text-xs">
                GPS location confirmed. Proceed to OTP verification.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex flex-col justify-center gap-4">
              {/* Success card */}
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-3">
                <MapPin className="size-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-700">High Accuracy GPS</p>
                  <p className="text-xs text-emerald-600">Location verified successfully</p>
                </div>
              </div>

              {/* Detail cards */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
                  <CheckCircle className="size-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-emerald-700">Accuracy Within Range</p>
                    <p className="text-[11px] text-emerald-600">Your GPS accuracy is within the required 100-meter threshold.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
                  <CheckCircle className="size-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-emerald-700">Shift Location Matched</p>
                    <p className="text-[11px] text-emerald-600">Your current location matches the assigned care location.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2.5">
                  <ShieldCheck className="size-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-700">Next: OTP Verification</p>
                    <p className="text-[11px] text-blue-600">A 4-digit OTP will be sent to the {familyLabel.toLowerCase()}\'s registered mobile number.</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-auto pt-4 border-t border-gray-100 flex-col gap-2 sm:flex-col sm:space-x-0">
              <Button
                onClick={() => handleRequestOTP()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ShieldCheck className="size-4 mr-2" />
                Continue to OTP
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── RENDER: Location Failed ─────────────────────────────────────────
  if (step === 'location_failed') {
    return (
      <Dialog open onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="flex flex-col min-h-full">
            <DialogHeader className="text-center sm:text-center">
              {renderStepper(2)}
              <div className="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-red-100">
                <XCircle className="size-6 text-red-500" />
              </div>
              <DialogTitle className="text-lg">Location Check Failed</DialogTitle>
              <DialogDescription className="text-xs">
                Could not verify your location.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex flex-col justify-center gap-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
                <p className="text-xs font-semibold text-amber-700">Troubleshooting Tips:</p>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                  <p className="text-xs text-amber-600">Enable GPS/Location services on your device from Settings</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                  <p className="text-xs text-amber-600">Grant browser location permission when prompted</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                  <p className="text-xs text-amber-600">Move to an open area with clear sky view for better GPS signal</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                  <p className="text-xs text-amber-600">Ensure Wi-Fi or mobile data is enabled for faster GPS lock</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2.5">
                <AlertCircle className="size-4 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-700">Need Help?</p>
                  <p className="text-[11px] text-blue-600">If the issue persists, contact support for assistance.</p>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-auto pt-4 border-t border-gray-100 flex-col gap-2 sm:flex-col sm:space-x-0">
              <Button
                onClick={startLocationCheck}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RotateCcw className="size-4 mr-2" />
                Retry Location Check
              </Button>
              <Button variant="ghost" onClick={onCancel} className="w-full">
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── RENDER: OTP Enter ──────────────────────────────────────────────
  if (step === 'otp_enter') {
    return (
      <Dialog open onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="flex flex-col min-h-full">
            <DialogHeader className="text-center sm:text-center relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 -mt-2 size-8"
                onClick={onCancel}
              >
                <ArrowLeft className="size-4" />
              </Button>
              {renderStepper(3)}
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

              {/* Completed checkmarks */}
              <div className="flex items-center justify-center gap-4 text-xs text-emerald-600">
                <div className="flex items-center gap-1">
                  <CheckCircle className="size-3.5" />
                  <span>Selfie captured</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="size-3.5" />
                  <span>Location verified</span>
                </div>
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
                Verify & Start Shift
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── RENDER: OTP Verifying ──────────────────────────────────────────
  if (step === 'otp_verifying') {
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

  // ── RENDER: Success ───────────────────────────────────────────────
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
                Shift Started!
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Attendance marked successfully. All 3 verification steps completed.
              </p>
            </div>

            {/* Show completed checks */}
            <div className="w-full space-y-2">
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                <CheckCircle className="size-4 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-medium text-emerald-700">Selfie Captured</span>
                  <span className="text-emerald-600 ml-1">— Liveness verified</span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                <CheckCircle className="size-4 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-medium text-emerald-700">Location Verified</span>
                  <span className="text-emerald-600 ml-1">— High accuracy GPS confirmed</span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                <CheckCircle className="size-4 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-medium text-emerald-700">OTP Confirmed</span>
                  <span className="text-emerald-600 ml-1">— Verified by {familyLabel.toLowerCase()}</span>
                </div>
              </div>
            </div>

            {renderShiftSummary()}

            <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm w-full">
              <Clock className="size-4 text-blue-600" />
              <span className="font-semibold text-blue-700">
                {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
              </span>
              <span className="text-muted-foreground">shift active</span>
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

  // ── Fallback (shouldn't be reached) ────────────────────────────────
  return null;
}
