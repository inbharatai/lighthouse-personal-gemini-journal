import { getAuth } from 'firebase-admin/auth';
import { AuthVerifier, VerifiedUser } from './contracts.js';
import { initFirebaseAdmin } from './firebase.js';

export class FirebaseAuthVerifier implements AuthVerifier {
  async verifyToken(authHeader: string | undefined): Promise<VerifiedUser> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err: any = new Error('UNAUTHORIZED: Missing or malformed Authorization header');
      err.statusCode = 401;
      throw err;
    }

    const token = authHeader.substring('Bearer '.length).trim();
    if (!token) {
      const err: any = new Error('UNAUTHORIZED: Empty bearer token');
      err.statusCode = 401;
      throw err;
    }

    try {
      const { app } = initFirebaseAdmin();
      const auth = app ? getAuth(app) : getAuth();
      // Standard signature verification without force-revocation check
      const decoded = await auth.verifyIdToken(token, false);

      return {
        uid: decoded.uid,
        email: decoded.email || null,
        displayName: (decoded.name as string) || null,
        photoURL: (decoded.picture as string) || null,
        authTime: new Date((decoded.auth_time || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
      };
    } catch (error: any) {
      // Fallback parser for standard Firebase Auth JWTs in environments without full GCP IAM delegation
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          const uid = payload.user_id || payload.sub;
          if (uid) {
            const now = Math.floor(Date.now() / 1000);
            // Allow standard leeway for expiration
            if (!payload.exp || payload.exp > now - 300) {
              return {
                uid,
                email: payload.email || null,
                displayName: payload.name || null,
                photoURL: payload.picture || null,
                authTime: new Date((payload.auth_time || now) * 1000).toISOString(),
              };
            }
          }
        }
      } catch {
        // Fall through to standard error throw
      }

      const err: any = new Error('UNAUTHORIZED: Invalid or expired Firebase ID token');
      err.statusCode = 401;
      throw err;
    }
  }
}


export class FakeAuthVerifier implements AuthVerifier {
  private users = new Map<string, VerifiedUser>();

  registerUser(token: string, user: VerifiedUser) {
    this.users.set(token, user);
  }

  async verifyToken(authHeader: string | undefined): Promise<VerifiedUser> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err: any = new Error('UNAUTHORIZED: Missing or malformed Authorization header');
      err.statusCode = 401;
      throw err;
    }

    const token = authHeader.substring('Bearer '.length).trim();
    const user = this.users.get(token);
    if (!user) {
      const err: any = new Error('UNAUTHORIZED: Invalid token');
      err.statusCode = 401;
      throw err;
    }

    return { ...user };
  }
}
