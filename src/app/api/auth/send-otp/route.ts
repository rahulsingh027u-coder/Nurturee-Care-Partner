import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEMO_PHONE = '9717137285';
const DEMO_OTP = '123456';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Valid 10-digit phone required' }, { status: 400 });
    }

    // Demo flow: auto-create caregiver if not exists, use OTP 123456
    if (phone === DEMO_PHONE) {
      const existing = await db.caregiver.findFirst({ where: { phone } });
      if (!existing) {
        await db.caregiver.create({
          data: {
            caregiverId: 'CP-DEMO-001',
            phone,
            name: 'Rahul Sharma',
            email: 'rahul.demo@nurturee.com',
            specialty: 'elder_care',
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
        console.log(`Demo caregiver created for ${phone}`);
      }

      const otpStore = (globalThis as any).__otpStore = (globalThis as any).__otpStore || {};
      otpStore[phone] = { otp: DEMO_OTP, expiresAt: Date.now() + 30 * 60 * 1000 };
      console.log(`Demo OTP for ${phone}: ${DEMO_OTP}`);

      return NextResponse.json({ success: true, message: 'OTP sent' });
    }

    // Normal flow
    const partner = await db.caregiver.findFirst({ where: { phone } });

    if (!partner) {
      return NextResponse.json({ error: 'No account found with this phone number' }, { status: 404 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`OTP for ${phone}: ${otp}`);

    const otpStore = (globalThis as any).__otpStore = (globalThis as any).__otpStore || {};
    otpStore[phone] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    return NextResponse.json({ success: true, message: 'OTP sent' });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
