import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuthenticatedPartner } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    // ─── AUTH GATE ───
    const auth = await requireAuthenticatedPartner(req);
    if (!auth.authorized) return auth.response;
    const { partner } = auth;

    const dbPartner = await db.caregiver.findUnique({
      where: { id: partner!.id },
      include: {
        skills: true,
        services: true,
        certifications: true,
        availability: { orderBy: { dayOfWeek: 'asc' } },
      },
    });

    if (!dbPartner) {
      return NextResponse.json({ error: 'Care partner not found' }, { status: 404 });
    }

    const responseData = {
      name: dbPartner.name,
      email: dbPartner.email,
      phone: dbPartner.phone,
      specialty: dbPartner.specialty,
      experience: dbPartner.experience,
      qualifications: dbPartner.qualifications,
      gender: dbPartner.gender,
      dateOfBirth: dbPartner.dateOfBirth,
      bio: dbPartner.bio,
      languages: dbPartner.languages,
      city: dbPartner.city,
      state: dbPartner.state,
      address: dbPartner.address,
      pincode: dbPartner.pincode,
      onboardingCompleted: dbPartner.onboardingCompleted,
      isVerified: dbPartner.isVerified,
      skills: dbPartner.skills.map(s => s.skill),
      services: dbPartner.services.map(s => s.service),
      certifications: dbPartner.certifications.map(c => ({
        name: c.name,
        issuer: c.issuer,
        year: c.year,
        certificateFile: c.certificateFile,
        isVerified: c.isVerified,
      })),
      availability: dbPartner.availability.map(a => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        isAvailable: a.isAvailable,
      })),
    };

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Load onboarding error:', error);
    return NextResponse.json({ error: 'Failed to load onboarding data' }, { status: 500 });
  }
}
