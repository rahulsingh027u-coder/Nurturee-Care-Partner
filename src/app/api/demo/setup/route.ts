import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface OtpEntry {
  phone: string;
  otp: string;
  expiresAt: number;
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    const demoPhone = phone || '9717137285';

    const existing = await db.caregiver.findUnique({ where: { phone: demoPhone } });

    let caregiver;
    if (existing) {
      caregiver = existing;
    } else {
      caregiver = await db.caregiver.create({
        data: {
          phone: demoPhone,
          name: 'Rahul Sharma',
          email: 'rahul.demo@nurturee.com',
          specialty: 'elder_care',
            caregiverId: 'CP-DEMO-001',
          experience: 3,
          qualifications: 'B.Sc Nursing, GNM Diploma',
          isVerified: false,
          aadhaarVerified: false,
          policeVerified: false,
          medicalFitness: false,
          videoVerified: false,
          isSuspended: false,
        },
      });
    }

    if (!globalThis.__otpStore) {
      (globalThis as any).__otpStore = new Map<string, OtpEntry>();
    }
    const store = (globalThis as any).__otpStore as Map<string, OtpEntry>;
    store.set(demoPhone, {
      phone: demoPhone,
      otp: '123456',
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return NextResponse.json({
      success: true,
      message: `Demo care partner ready. Use phone ${demoPhone} with OTP 1234 to login.`,
      partner: {
        id: caregiver.id,
        name: caregiver.name,
        phone: caregiver.phone,
        specialty: caregiver.specialty,
        isVerified: caregiver.isVerified,
      },
    });
  } catch (error) {
    console.error('Demo setup error:', error);
    return NextResponse.json({ success: false, error: 'Failed to setup demo' }, { status: 500 });
  }
}
