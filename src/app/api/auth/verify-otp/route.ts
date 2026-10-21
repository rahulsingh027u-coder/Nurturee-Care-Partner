import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createPartnerToken } from '@/lib/auth';
import { getOtp, deleteOtp, saveOtp } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 });
    }

    // Brute-force protection: check attempt count
    const attemptsKey = `otp:attempts:${phone}`;
    const attemptsStr = await getOtp(attemptsKey);
    const attempts = attemptsStr ? parseInt(attemptsStr) : 0;
    if (attempts >= 5) {
      return NextResponse.json({ error: "Too many attempts. Please request a new OTP." }, { status: 429 });
    }

    const stored = await getOtp(phone);
    if (!stored || stored !== otp) {
      // Increment attempt count
      await saveOtp(attemptsKey, String(attempts + 1));
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    await deleteOtp(phone);
    await deleteOtp(attemptsKey);

    const partner = await db.caregiver.findFirst({ where: { phone } });
    if (!partner) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (partner.isSuspended) {
      return NextResponse.json({ error: 'Account suspended', reason: partner.suspensionReason }, { status: 403 });
    }

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
    console.error('[auth] verify-otp error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
