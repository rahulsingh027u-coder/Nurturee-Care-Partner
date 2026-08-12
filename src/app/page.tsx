'use client'

import { useState, useEffect } from 'react'
import CarePartnerLogin from '@/components/care-partner/CarePartnerLogin'
import OnboardingWizard from '@/components/care-partner/OnboardingWizard'
import CarePartnerLayout from '@/components/care-partner/CarePartnerLayout'
import DashboardView from '@/components/care-partner/DashboardView'
import ScheduleView from '@/components/care-partner/ScheduleView'
import PatientsView from '@/components/care-partner/PatientsView'
import CareTasksView from '@/components/care-partner/CareTasksView'
import ShiftsView from '@/components/care-partner/ShiftsView'
import ShiftCheckIn from '@/components/care-partner/ShiftCheckIn'
import EarningsView from '@/components/care-partner/EarningsView'
import ProfileView from '@/components/care-partner/ProfileView'
import NotificationsView from '@/components/care-partner/NotificationsView'
import VerificationPage from '@/components/care-partner/VerificationPage'
import TermsAcceptance from '@/components/care-partner/TermsAcceptance'
import { mockCarePartner, mockNotifications } from '@/lib/care-partner-data'
import type { Notification, Shift } from '@/lib/care-partner-data'
import { isOnboarded, getStoredOnboarding } from '@/lib/onboarding-data'
import {
  CARE_PARTNER_REGISTERED_KEY,
  AADHAAR_PASSED_KEY,
  VERIFICATION_STORAGE_KEY,
  STORAGE_VERSION_KEY,
  CURRENT_STORAGE_VERSION,
  TERMS_ACCEPTED_KEY,
} from '@/lib/constants'

type AuthState = 'login' | 'onboarding' | 'pending_verification' | 'terms_acceptance' | 'authenticated'

function isAadhaarVerified(): boolean {
  if (typeof window === 'undefined') return false
  try {
    // Check storage version — if outdated, treat as unverified
    if (localStorage.getItem(STORAGE_VERSION_KEY) !== String(CURRENT_STORAGE_VERSION)) return false
    const stored = localStorage.getItem(VERIFICATION_STORAGE_KEY)
    if (!stored) return false
    const docs = JSON.parse(stored)
    const aadhaarDoc = Array.isArray(docs) && docs.find((d: { type: string }) => d.type === 'aadhaar')
    return aadhaarDoc?.status === 'approved'
  } catch {
    return false
  }
}

function isRegistered(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(CARE_PARTNER_REGISTERED_KEY) === 'true'
}

export default function CarePartnerPortal() {
  const [authState, setAuthState] = useState<AuthState>('login')
  const [activeView, setActiveView] = useState('dashboard')
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [scheduleStartShift, setScheduleStartShift] = useState<Shift | null>(null)
  const [shiftStarted, setShiftStarted] = useState(false)
  const [preselectPatientId, setPreselectPatientId] = useState<string | null>(null)
  const [loginPhone, setLoginPhone] = useState('')

  // Hydration: restore auth state from localStorage
  useEffect(() => {
    const passed = localStorage.getItem(AADHAAR_PASSED_KEY) === 'true'
    // If registered AND (Aadhaar verified OR aadhaar passed key set), go straight to dashboard
    // Also allow pre-onboarding verified users to bypass
    if (isRegistered() && (passed || isAadhaarVerified()) && localStorage.getItem(TERMS_ACCEPTED_KEY) === 'true') {
      setAuthState('authenticated')
    } else if (isRegistered() && (passed || isAadhaarVerified())) {
      setAuthState('terms_acceptance')
    }
  }, [])

  const handleLogin = (phone: string) => {
    const wasAlreadyRegistered = isRegistered()
    const alreadyVerified = isAadhaarVerified()
    const alreadyOnboarded = isOnboarded()
    const passed = localStorage.getItem(AADHAAR_PASSED_KEY) === 'true'
    setLoginPhone(phone)

    if ((wasAlreadyRegistered && alreadyVerified && alreadyOnboarded && localStorage.getItem(TERMS_ACCEPTED_KEY) === 'true') ||
        (wasAlreadyRegistered && passed && alreadyOnboarded && localStorage.getItem(TERMS_ACCEPTED_KEY) === 'true')) {
      // Returning user — verified, onboarded & terms accepted, go to dashboard
      setAuthState('authenticated')
    } else if (wasAlreadyRegistered && alreadyVerified && !alreadyOnboarded) {
      // Verified user from before onboarding feature — go straight to dashboard
      setAuthState('authenticated')
    } else if (wasAlreadyRegistered && alreadyOnboarded && !alreadyVerified) {
      // Onboarded but not verified — go to verification
      setAuthState('pending_verification')
    } else if (wasAlreadyRegistered && !alreadyOnboarded) {
      // Started registration but didn't finish onboarding — resume onboarding
      setAuthState('onboarding')
    } else {
      // BRAND NEW USER — first time ever
      localStorage.setItem(CARE_PARTNER_REGISTERED_KEY, 'true')
      setAuthState('onboarding')
    }
  }

  const handleOnboardingComplete = () => {
    // Onboarding data saved — now go to verification
    setAuthState('pending_verification')
  }

  const handleVerificationComplete = () => {
    localStorage.setItem(AADHAAR_PASSED_KEY, 'true')
    setAuthState('terms_acceptance')
  }

  const handleTermsAccepted = () => {
    localStorage.setItem(TERMS_ACCEPTED_KEY, 'true')
    setAuthState('authenticated')
    setActiveView('dashboard')
  }

  const handleSignOut = () => {
    // Don't clear registration or verification data — just log out
    setAuthState('login')
    setActiveView('dashboard')
  }

  const handleNavigate = (view: string, patientId?: string) => {
    setPreselectPatientId(patientId || null)
    setActiveView(view)
  }

  // Read onboarding data for display (falls back to mock)
  const onboarded = getStoredOnboarding()
  const displayName = onboarded?.name || mockCarePartner.name
  const displaySpecialty = onboarded?.specialty === 'elder_care'
    ? 'Elder Care Specialist'
    : onboarded?.specialty === 'child_care'
      ? 'Child Care Specialist'
      : mockCarePartner.specialty === 'elder_care' ? 'Elder Care Specialist' : 'Child Care Specialist'

  // Login screen
  if (authState === 'login') {
    return (
      <div className="min-h-screen bg-gray-50">
        <CarePartnerLogin onLogin={handleLogin} />
      </div>
    )
  }

  // Onboarding wizard (first-time users)
  if (authState === 'onboarding') {
    return (
      <OnboardingWizard
        phone={loginPhone}
        onComplete={handleOnboardingComplete}
      />
    )
  }

  // Mandatory verification screen (after onboarding / Aadhaar not yet done)
  if (authState === 'pending_verification') {
    return (
      <VerificationPage
        onComplete={handleVerificationComplete}
      />
    )
  }

  // Terms & Privacy acceptance (after verification, before dashboard)
  if (authState === 'terms_acceptance') {
    return (
      <TermsAcceptance onAccept={handleTermsAccepted} />
    )
  }

  // Authenticated — full portal
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            carePartnerName={displayName}
            specialty={displaySpecialty}
            onNavigate={handleNavigate}
          />
        )
      case 'schedule':
        return (
          <ScheduleView
            onNavigate={setActiveView}
            onStartShift={(shift) => setScheduleStartShift(shift)}
          />
        )
      case 'patients':
        return <PatientsView onNavigate={setActiveView} preselectPatientId={preselectPatientId || undefined} />
      case 'care-tasks':
        return <CareTasksView />
      case 'shifts':
        return <ShiftsView onNavigate={handleNavigate} />
      case 'earnings':
        return <EarningsView />
      case 'profile':
        return <ProfileView onNavigate={handleNavigate} />
      case 'notifications':
        return <NotificationsView />
      case 'verification':
        return (
          <VerificationPage
            optionalMode
            onComplete={() => setActiveView('profile')}
          />
        )
      default:
        return (
          <DashboardView
            carePartnerName={displayName}
            specialty={displaySpecialty}
            onNavigate={handleNavigate}
          />
        )
    }
  }

  const pageTitleMap: Record<string, string> = {
    dashboard: 'Dashboard',
    schedule: 'My Schedule',
    patients: 'Care Members',
    'care-tasks': 'Care Tasks',
    shifts: 'My Shifts',
    earnings: 'Earnings',
    profile: 'My Profile',
    notifications: 'Notifications',
    verification: 'Verification Status',
  }

  return (
    <CarePartnerLayout
      carePartnerName={displayName}
      carePartnerId={onboarded?.name ? onboarded.name.toLowerCase().replace(/\s+/g, '-') + '-cp' : mockCarePartner.carePartnerId}
      activeView={activeView}
      onViewChange={setActiveView}
      notifications={notifications}
      onSignOut={handleSignOut}
    >
      <div className="space-y-6">
        <div className="md:hidden">
          <h1 className="text-lg font-semibold text-gray-900">
            {pageTitleMap[activeView] || 'Dashboard'}
          </h1>
        </div>
        {renderView()}
      </div>

      {/* Schedule Start Shift Check-In (Location + Selfie + OTP) */}
      {scheduleStartShift && (
        <ShiftCheckIn
          shift={scheduleStartShift}
          onStart={() => {
            setScheduleStartShift(null)
            setShiftStarted(true)
            setTimeout(() => setShiftStarted(false), 3000)
          }}
          onCancel={() => setScheduleStartShift(null)}
        />
      )}
      {shiftStarted && (
        <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom-5">
          ✓ Shift started successfully!
        </div>
      )}
    </CarePartnerLayout>
  )
}
