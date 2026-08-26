import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createPartnerToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 });
    }

    const otpStore = (globalThis as any).__otpStore || {};
    const stored = otpStore[phone];

    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    delete otpStore[phone];

    const partner = await db.caregiver.findFirst({ where: { phone } });

    if (!partner) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (partner.isSuspended) {
      return NextResponse.json({ error: 'Account suspended', reason: partner.suspensionReason }, { status: 403 });
    }

    // ─── CREATE JWT AND SET HTTPONLY COOKIE ───
    const token = await createPartnerToken({
      id: partner.id,
      caregiverId: partner.caregiverId,
      phone: partner.phone,
      role: 'care_partner',
    });

    const response = NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        caregiverId: partner.caregiverId,
        name: partner.name,
        phone: partner.phone,
        email: partner.email,
        specialty: partner.specialty,
        experience: partner.experience,
        qualifications: partner.qualifications,
        isVerified: partner.isVerified,
        aadhaarVerified: partner.aadhaarVerified,
        policeVerified: partner.policeVerified,
        medicalFitness: partner.medicalFitness,
        videoVerified: partner.videoVerified,
        isSuspended: partner.isSuspended,
      },
    });

    response.cookies.set('nurturee_partner_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
