import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nurturee-partner-secret-CHANGE-IN-PRODUCTION'
);

export interface CarePartnerPayload {
  id: string;           // DB primary key (cuid) — used for verification routes
  caregiverId: string;  // Business ID (CP-XXX) — used for display
  phone: string;
  role: 'care_partner';
}

export async function getAuthenticatedPartner(): Promise<CarePartnerPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('nurturee_partner_token')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as CarePartnerPayload;
  } catch {
    return null;
  }
}

export async function createPartnerToken(payload: CarePartnerPayload): Promise<string> {
  return new SignJWT(payload as unknown)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}
