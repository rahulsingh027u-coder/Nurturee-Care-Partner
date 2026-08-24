import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/*
  GET /api/onboarding/load?phone=XXXXXXXXXX
  Returns ALL onboarding data for a care partner:
    - Basic profile from Caregiver table
    - Skills from CarePartnerSkill
    - Services from CarePartnerService
    - Certifications from CarePartnerCertification
    - Availability from CarePartnerAvailability
*/

export async function GET(req: NextRequest) {
  try {
    const phone = req.nextUrl.searchParams.get('phone');
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // 1. Find the care partner
    const partner = await db.caregiver.findFirst({
      where: { phone },
      include: {
        skills: true,
        services: true,
        certifications: true,
        availability: { orderBy: { dayOfWeek: 'asc' } },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Care partner not found' }, { status: 404 });
    }

    // 2. Build the full onboarding response
    const responseData = {
      // Basic profile
      name: partner.name,
      email: partner.email,
      phone: partner.phone,
      specialty: partner.specialty,
      experience: partner.experience,
      qualifications: partner.qualifications,
      gender: partner.gender,
      dateOfBirth: partner.dateOfBirth,
      bio: partner.bio,
      languages: partner.languages,
      city: partner.city,
      state: partner.state,
      address: partner.address,
      pincode: partner.pincode,
      onboardingCompleted: partner.onboardingCompleted,
      isVerified: partner.isVerified,

      // Skills — return as string array for compatibility
      skills: partner.skills.map(s => s.skill),

      // Services — return as string array
      services: partner.services.map(s => s.service),

      // Certifications — return full objects
      certifications: partner.certifications.map(c => ({
        name: c.name,
        issuer: c.issuer,
        year: c.year,
        certificateFile: c.certificateFile,
        isVerified: c.isVerified,
      })),

      // Availability — return full objects
      availability: partner.availability.map(a => ({
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
