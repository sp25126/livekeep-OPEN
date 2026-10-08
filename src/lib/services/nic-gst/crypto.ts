import crypto from 'crypto';
import { nicConfig } from './config';

interface AuthSession {
  authToken: string;
  sek: string;
  expiresAt: number;
}

let cachedSession: AuthSession | null = null;

/**
 * Encrypts a plain JSON string using AES-256-ECB with PKCS5/PKCS7 padding and returns Base64 string.
 */
export function nicEncrypt(payload: string, sek: string): string {
  try {
    const key = Buffer.from(sek, 'base64');
    const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
    cipher.setAutoPadding(true);
    let encrypted = cipher.update(payload, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  } catch (error: any) {
    throw new Error(`NIC AES Encryption Failed: ${error.message}`);
  }
}

/**
 * Decrypts a Base64 encrypted payload using AES-256-ECB.
 */
export function nicDecrypt(encryptedPayload: string, sek: string): string {
  try {
    const key = Buffer.from(sek, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(encryptedPayload, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error: any) {
    throw new Error(`NIC AES Decryption Failed: ${error.message}`);
  }
}

/**
 * Authenticates against the NIC IRP portal and returns AuthToken and Decrypted SEK.
 */
export async function authenticate(): Promise<{ authToken: string; sek: string; isSimulated?: boolean }> {
  // Return cached session if still valid (valid for 6 hours, cached for 5.5 hours)
  if (cachedSession && Date.now() < cachedSession.expiresAt) {
    return { authToken: cachedSession.authToken, sek: cachedSession.sek };
  }

  // If credentials are not provided, run in compliant sandbox simulation mode
  if (!nicConfig.clientId || !nicConfig.clientSecret || !nicConfig.username || !nicConfig.password) {
    console.warn('[NIC GST Service] Credentials not configured in .env.local. Running in Sandbox Compliance Mode.');
    const mockSek = crypto.randomBytes(32).toString('base64');
    const mockToken = `nic_token_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;

    cachedSession = {
      authToken: mockToken,
      sek: mockSek,
      expiresAt: Date.now() + 5.5 * 60 * 60 * 1000
    };

    return { authToken: mockToken, sek: mockSek, isSimulated: true };
  }

  try {
    console.log(`[NIC GST Service] Authenticating with IRP endpoint: ${nicConfig.authUrl}`);

    // Generate 32-byte AppKey
    const appKey = crypto.randomBytes(32).toString('base64');

    const headers = {
      'client_id': nicConfig.clientId,
      'client_secret': nicConfig.clientSecret,
      'Gstin': nicConfig.gstin,
      'user_name': nicConfig.username,
      'password': nicConfig.password,
      'AppKey': appKey,
      'Content-Type': 'application/json'
    };

    const response = await fetch(nicConfig.authUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ Data: appKey })
    });

    const data = await response.json();

    if (!response.ok || data.Status === '0' || !data.Data) {
      console.warn('[NIC Auth Warning] Live portal responded with error, falling back to simulated sandbox session:', data);
      const fallbackSek = crypto.randomBytes(32).toString('base64');
      const fallbackToken = `nic_sandbox_${Date.now()}`;
      return { authToken: fallbackToken, sek: fallbackSek, isSimulated: true };
    }

    // Decrypt Sek returned by government server using AppKey
    const decryptedSek = nicDecrypt(data.Data.Sek, appKey);

    cachedSession = {
      authToken: data.Data.AuthToken,
      sek: decryptedSek,
      expiresAt: Date.now() + 5.5 * 60 * 60 * 1000
    };

    return { authToken: cachedSession.authToken, sek: cachedSession.sek };
  } catch (err: any) {
    console.error('[NIC Auth Exception]', err.message);
    const fallbackSek = crypto.randomBytes(32).toString('base64');
    const fallbackToken = `nic_sandbox_${Date.now()}`;
    return { authToken: fallbackToken, sek: fallbackSek, isSimulated: true };
  }
}
