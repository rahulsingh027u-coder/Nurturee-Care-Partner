import crypto from 'crypto';
import { RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { saveOtp, isOtpRateLimited } from '@/lib/redis';

// Demo OTP backdoor removed for security
// Demo OTP backdoor removed for security

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Valid 10-digit phone required' }, { status: 400 });
    }

    // Rate limit: 3 OTP requests per 60 seconds per phone
    const ip = getClientIP(req);
    const ipLimit = await RATE_LIMITS.auth(ip);
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    if (await isOtpRateLimited(phone)) {
      return NextResponse.json({ error: 'Please wait 30 seconds before requesting another OTP' }, { status: 429 });
    }

    // Demo backdoor removed for security

    const partner = await db.caregiver.findFirst({ where: { phone } });
    if (!partner) {
      return NextResponse.json({ error: 'No account found with this phone number' }, { status: 404 });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    await saveOtp(phone, otp);
    // OTP logging removed for security

    return NextResponse.json({ success: true, message: 'OTP sent' });
  } catch (error) {
    console.error('[auth] send-otp error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
