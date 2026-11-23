import { createVerify } from 'node:crypto';

export interface VerifiedFirebaseToken {
  uid: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
}

const PROJECT_ID = 'geometric-agency-vl37k';
const EXPECTED_ISSUER = `https://securetoken.google.com/${PROJECT_ID}`;
const CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCerts: Record<string, string> = {};
let certsExpireAt = 0;

function decodeBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
  return Buffer.from(padded, 'base64');
}

async function fetchPublicCerts(forceRefresh = false): Promise<Record<string, string>> {
  const now = Date.now();
  if (!forceRefresh && certsExpireAt > now && Object.keys(cachedCerts).length > 0) {
    return cachedCerts;
  }

  const res = await fetch(CERTS_URL);
  if (!res.ok) {
    throw new Error(`Failed to load Firebase public certificates (${res.status})`);
  }

  const data = (await res.json()) as Record<string, string>;
  const cacheControl = res.headers.get('cache-control') || '';
  const match = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = match ? Number(match[1]) : 3600;

  cachedCerts = data;
  certsExpireAt = now + Math.max(60, maxAgeSec) * 1000;
  return cachedCerts;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseToken | null> {
  if (!idToken || typeof idToken !== 'string') return null;
  const parts = idToken.split('.');
  if (parts.length !== 3) return null;

  try {
    const [headerB64, payloadB64, sigB64] = parts;
    const header = JSON.parse(decodeBase64Url(headerB64).toString('utf8')) as {
      alg?: string;
      kid?: string;
    };
    const payload = JSON.parse(decodeBase64Url(payloadB64).toString('utf8')) as {
      aud?: string;
      iss?: string;
      sub?: string;
      exp?: number;
      iat?: number;
      auth_time?: number;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };

    if (header.alg !== 'RS256' || !header.kid) return null;
    if (payload.aud !== PROJECT_ID || payload.iss !== EXPECTED_ISSUER) return null;
    if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.length > 128) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp <= nowSec - 60) return null;
    if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) return null;
    if (typeof payload.auth_time === 'number' && payload.auth_time > nowSec + 300) return null;

    let certs = await fetchPublicCerts(false);
    let certPem = certs[header.kid];
    if (!certPem) {
      certs = await fetchPublicCerts(true);
      certPem = certs[header.kid];
    }
    if (!certPem) return null;

    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();

    const signatureValid = verifier.verify(certPem, decodeBase64Url(sigB64));
    if (!signatureValid) return null;

    return {
      uid: payload.sub,
      email: payload.email,
      emailVerified: Boolean(payload.email_verified),
      name: payload.name,
    };
  } catch {
    return null;
  }
}
