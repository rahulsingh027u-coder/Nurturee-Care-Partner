import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { saveOtp, isOtpRateLimited } from '@/lib/redis';

const DEMO_PHONE = '9717137285';
const DEMO_OTP = '123456';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Valid 10-digit phone required' }, { status: 400 });
    }

    if (await isOtpRateLimited(phone)) {
      return NextResponse.json({ error: 'Please wait 30 seconds before requesting another OTP' }, { status: 429 });
    }

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
          },
        });
      }
      await saveOtp(phone, DEMO_OTP, true);
      if (process.env.NODE_ENV !== "production") console.log(`[otp] demo ${phone}: ${DEMO_OTP}`);
      return NextResponse.json({ success: true, message: 'OTP sent' });
    }

    const partner = await db.caregiver.findFirst({ where: { phone } });
    if (!partner) {
      return NextResponse.json({ error: 'No account found with this phone number' }, { status: 404 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await saveOtp(phone, otp);
    if (process.env.NODE_ENV !== "production") console.log(`[otp] ${phone}: ${otp}`);

    return NextResponse.json({ success: true, message: 'OTP sent' });
  } catch (error) {
    console.error('[auth] send-otp error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
