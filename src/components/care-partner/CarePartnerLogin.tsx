'use client'

import { useState, useRef, useEffect } from "react"
import { Phone, Lock, Loader2, AlertCircle, Shield } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"

interface CarePartnerLoginProps {
  onLogin: (phone: string) => void
}

export default function CarePartnerLogin({ onLogin }: CarePartnerLoginProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const phoneInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (resendTimer <= 0) return
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [resendTimer])

  useEffect(() => {
    phoneInputRef.current?.focus()
  }, [])

  const handlePhoneSubmit = async () => {
    const digits = phone.replace(/\D/g, "")
    if (digits.length !== 10) {
      setError("Please enter a valid 10-digit phone number")
      return
    }
    setError("")
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLoading(false)
    setStep(2)
    setResendTimer(30)
  }

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit OTP")
      return
    }
    if (otp !== "123456") {
      setError("Invalid OTP. Please try again.")
      return
    }
    setError("")
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLoading(false)
    const fullPhone = `+91${phone.replace(/\D/g, "")}`
    onLogin(fullPhone)
  }

  const handleResendOtp = () => {
    if (resendTimer > 0) return
    setOtp("")
    setError("")
    setResendTimer(30)
  }

  const handleBackToPhone = () => {
    setStep(1)
    setOtp("")
    setError("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (step === 1) {
        handlePhoneSubmit()
      } else {
        handleOtpSubmit()
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 lg:w-[45%] bg-gradient-to-br from-blue-600 to-indigo-600 flex-col items-center justify-center p-8 lg:p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white" />
          <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Image src="/nurturee-icon.png" alt="Nurturee" width={40} height={40} className="mr-3 rounded-xl" />
            <span className="text-4xl font-bold tracking-tight">Nurturee</span>
          </div>
          <h1 className="text-2xl font-semibold mb-3 text-white/95">Welcome, Care Partner</h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Your Compassion, Our Platform
          </p>
          <div className="mt-10 flex items-center justify-center gap-2 text-white/60 text-sm">
            <Shield className="w-4 h-4" />
            <span>Secure & HIPAA Compliant</span>
          </div>
        </div>
      </div>

      {/* Mobile Accent Bar */}
      <div className="md:hidden h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile-only branding */}
          <div className="md:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-2">
              <Image src="/nurturee-icon.png" alt="Nurturee" width={28} height={28} className="mr-2 rounded-lg" />
              <span className="text-3xl font-bold text-gray-900 tracking-tight">Nurturee</span>
            </div>
            <p className="text-sm text-gray-500">Care Partner</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {step === 1 ? "Welcome Back" : "Verify OTP"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {step === 1
                  ? "Sign in to manage your care schedule"
                  : `Enter the OTP sent to +91 ${phone.replace(/\D/g, "")}`}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Phone Input */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <div className="flex gap-0">
                    <div className="flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted/50 text-sm text-gray-600 font-medium">
                      +91
                    </div>
                    <Input
                      ref={phoneInputRef}
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10)
                        setPhone(val)
                        if (error) setError("")
                      }}
                      onKeyDown={handleKeyDown}
                      className="rounded-l-none rounded-md border-input"
                      disabled={loading}
                      maxLength={10}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handlePhoneSubmit}
                  disabled={loading || phone.replace(/\D/g, "").length !== 10}
                  className={
                    'w-full rounded-xl shadow-md h-11 text-sm font-medium transition-all ' +
                    (phone.replace(/\D/g, "").length === 10 && !loading
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed')
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-2" />
                      Send OTP
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Step 2: OTP Input */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    One-Time Password
                  </label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => {
                        setOtp(value)
                        if (error) setError("")
                      }}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <Button
                  onClick={handleOtpSubmit}
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 h-11 text-sm font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Verify & Login
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleBackToPhone}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ← Change number
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0}
                    className={`transition-colors ${
                      resendTimer > 0
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600 hover:text-blue-700 font-medium"
                    }`}
                  >
                    {resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : "Resend OTP"}
                  </button>
                </div>
              </div>
            )}

            {/* Footer note */}
            <p className="text-xs text-gray-400 text-center mt-6">
              By continuing, you agree to Nurturee&apos;s{' '}
              <a href="/terms" className="text-blue-500 hover:text-blue-600 underline underline-offset-2">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-blue-500 hover:text-blue-600 underline underline-offset-2">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
