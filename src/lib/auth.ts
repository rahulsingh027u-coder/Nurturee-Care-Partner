import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const secretString = process.env.JWT_SECRET || '';
const JWT_SECRET = new TextEncoder().encode(secretString);

export interface CarePartnerPayload {
  id: string;
  caregiverId: string;
  phone: string;
  role: 'care_partner';
}

export async function getAuthenticatedPartner(): Promise<CarePartnerPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('nurturee_partner_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET) as { payload: any };
    return payload as any as CarePartnerPayload;
  } catch {
    return null;
  }
}

export async function createPartnerToken(payload: CarePartnerPayload): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}
