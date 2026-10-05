import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from './database.service';

/**
 * AuthService — accounts, sessions and credentials.
 *
 * Accounts live in the local database (`fe_users` table, keyed by a
 * normalized identifier — lowercase email or phone number). Sessions are
 * persisted, so closing and reopening the app keeps the user signed in,
 * exactly like a normal app. Logging out clears the session.
 */

export interface UserRecord {
  id: string;
  name: string;
  identifier: string;          // normalized: lowercase email or phone
  email: string;
  avatarUrl: string;
  provider: 'local' | 'google' | 'facebook' | 'tiktok';
  legacy: boolean;             // migrated account without a password yet
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionRecord {
  userId: string;
  loginAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  identifier: string;
  email: string;
  avatarUrl: string;
  provider: UserRecord['provider'];
  hasPassword: boolean;
}

export type AuthResult =
  | { ok: true; user: PublicUser }
  | { ok: false; error: string; code: 'exists' | 'not-found' | 'wrong-password' | 'legacy' | 'invalid' | 'busy' };

const MIN_PASSWORD_LENGTH = 6;
const EMAIL_SUFFIX = '@gmail.com';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private users: Record<string, UserRecord> = {};
  private session: SessionRecord | null = null;

  private currentUserSubject = new BehaviorSubject<PublicUser | null>(null);
  /** Emits the signed-in user (or null) — always safe to subscribe to. */
  readonly currentUser$ = this.currentUserSubject.asObservable();

  private readyPromise: Promise<void>;

  constructor(private db: DatabaseService) {
    this.readyPromise = this.initialize();
  }

  /** Resolves once the database is loaded and any saved session is restored. */
  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  get currentUser(): PublicUser | null {
    return this.currentUserSubject.getValue();
  }

  get isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // ------------------------------------------------------------------
  // Validation helpers (shared rules across the app)
  // ------------------------------------------------------------------

  static isPureNumber(val: string): boolean {
    return /^\d+$/.test(val);
  }

  /** Phone must be 11 digits starting with 09; email must end with @gmail.com. */
  static validateIdentifier(raw: string): string | null {
    const val = raw.trim();
    if (!val) return 'Enter your email or phone number.';
    if (AuthService.isPureNumber(val)) {
      if (!val.startsWith('09')) return 'The number is invalid (must start with 09).';
      if (val.length !== 11) return 'The number is invalid (must be exactly 11 digits).';
      return null;
    }
    if (!val.toLowerCase().endsWith(EMAIL_SUFFIX)) {
      return 'Email address must end with @gmail.com.';
    }
    return null;
  }

  static validatePassword(pw: string): string | null {
    if (!pw || pw.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    return null;
  }

  static normalizeIdentifier(raw: string): string {
    return raw.trim().toLowerCase();
  }

  // ------------------------------------------------------------------
  // Bootstrap — load users + restore session
  // ------------------------------------------------------------------

  private async initialize(): Promise<void> {
    await this.db.ready();
    this.users = await this.db.getJson<Record<string, UserRecord>>(this.db.usersKey(), {});

    this.session = await this.db.getJson<SessionRecord | null>(this.db.sessionKey(), null);
    if (this.session) {
      const user = this.users[this.session.userId] ?? null;
      if (user) {
        this.emitUser(user);
      } else {
        // Session points to a deleted account — clear it.
        this.session = null;
        await this.db.remove(this.db.sessionKey());
      }
    }
  }

  // ------------------------------------------------------------------
  // Account operations
  // ------------------------------------------------------------------

  async register(opts: {
    name: string;
    identifier: string;
    password: string;
    provider?: UserRecord['provider'];
  }): Promise<AuthResult> {
    await this.whenReady();

    const idError = AuthService.validateIdentifier(opts.identifier);
    if (idError) return { ok: false, error: idError, code: 'invalid' };

    const pwError = AuthService.validatePassword(opts.password);
    if (pwError) return { ok: false, error: pwError, code: 'invalid' };

    const identifier = AuthService.normalizeIdentifier(opts.identifier);
    if (this.users[identifier]) {
      return { ok: false, error: 'An account already exists with this email or number.', code: 'exists' };
    }

    const salt = this.randomSalt();
    const passwordHash = await this.hashPassword(opts.password, salt);
    const now = new Date().toISOString();

    const record: UserRecord = {
      id: `user_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      name: opts.name.trim() || 'Food Eagle User',
      identifier,
      email: identifier.includes('@') ? identifier : '',
      avatarUrl: '',
      provider: opts.provider ?? 'local',
      legacy: false,
      passwordHash,
      passwordSalt: salt,
      createdAt: now,
      updatedAt: now,
    };

    this.users[identifier] = record;
    await this.db.setJson(this.db.usersKey(), this.users);

    await this.startSession(record);
    return { ok: true, user: this.toPublic(record) };
  }

  async login(identifier: string, password: string): Promise<AuthResult> {
    await this.whenReady();

    const idError = AuthService.validateIdentifier(identifier);
    if (idError) return { ok: false, error: idError, code: 'invalid' };
    if (!password) return { ok: false, error: 'Enter your password.', code: 'invalid' };

    const key = AuthService.normalizeIdentifier(identifier);
    const user = this.users[key];
    if (!user) {
      return { ok: false, error: 'No account found with this email or number.', code: 'not-found' };
    }
    if (user.legacy) {
      return {
        ok: false,
        error: 'This account needs a password update. Use "Forgot Password" to set one.',
        code: 'legacy',
      };
    }

    const hash = await this.hashPassword(password, user.passwordSalt);
    if (hash !== user.passwordHash) {
      return { ok: false, error: 'Incorrect password. Please try again.', code: 'wrong-password' };
    }

    await this.startSession(user);
    return { ok: true, user: this.toPublic(user) };
  }

  async logout(): Promise<void> {
    await this.whenReady();
    this.session = null;
    await this.db.remove(this.db.sessionKey());
    this.currentUserSubject.next(null);
  }

  async updateProfile(patch: { name?: string; contact?: string; email?: string; avatarUrl?: string }): Promise<AuthResult> {
    await this.whenReady();
    const user = this.getRawCurrentUser();
    if (!user) return { ok: false, error: 'You are not signed in.', code: 'invalid' };

    const name = (patch.name ?? user.name).trim();
    if (!name) return { ok: false, error: 'Name cannot be empty.', code: 'invalid' };

    // If the contact changes, it becomes the new login identifier.
    let identifier = user.identifier;
    if (patch.contact !== undefined && AuthService.normalizeIdentifier(patch.contact) !== user.identifier) {
      const idError = AuthService.validateIdentifier(patch.contact);
      if (idError) return { ok: false, error: idError, code: 'invalid' };
      identifier = AuthService.normalizeIdentifier(patch.contact);
      if (identifier !== user.identifier && this.users[identifier]) {
        return { ok: false, error: 'Another account already uses this email or number.', code: 'exists' };
      }
      delete this.users[user.identifier]; // move record to the new key
    }

    const email = patch.email !== undefined ? patch.email.trim() : user.email;

    const updated: UserRecord = {
      ...user,
      name,
      identifier,
      email,
      avatarUrl: patch.avatarUrl !== undefined ? patch.avatarUrl : user.avatarUrl,
      updatedAt: new Date().toISOString(),
    };

    this.users[identifier] = updated;
    await this.db.setJson(this.db.usersKey(), this.users);

    // Keep the persisted session pointing at the (possibly new) identifier.
    if (this.session && this.session.userId !== identifier) {
      this.session = { ...this.session, userId: identifier };
      await this.db.setJson(this.db.sessionKey(), this.session);
    }

    this.emitUser(updated);
    return { ok: true, user: this.toPublic(updated) };
  }

  async changePassword(current: string, next: string, confirm: string): Promise<AuthResult> {
    await this.whenReady();
    const user = this.getRawCurrentUser();
    if (!user) return { ok: false, error: 'You are not signed in.', code: 'invalid' };

    if (next !== confirm) {
      return { ok: false, error: 'New password and confirmation do not match.', code: 'invalid' };
    }
    const pwError = AuthService.validatePassword(next);
    if (pwError) return { ok: false, error: pwError, code: 'invalid' };

    if (!user.legacy) {
      const currentHash = await this.hashPassword(current, user.passwordSalt);
      if (currentHash !== user.passwordHash) {
        return { ok: false, error: 'Your current password is incorrect.', code: 'wrong-password' };
      }
    }

    return this.setPassword(user, next);
  }

  /** Password reset via Forgot Password (no current password required). */
  async resetPassword(identifier: string, next: string, confirm: string): Promise<AuthResult> {
    await this.whenReady();

    const idError = AuthService.validateIdentifier(identifier);
    if (idError) return { ok: false, error: idError, code: 'invalid' };
    if (next !== confirm) {
      return { ok: false, error: 'Passwords do not match.', code: 'invalid' };
    }
    const pwError = AuthService.validatePassword(next);
    if (pwError) return { ok: false, error: pwError, code: 'invalid' };

    const user = this.users[AuthService.normalizeIdentifier(identifier)];
    if (!user) {
      return { ok: false, error: 'No account found with this email or number.', code: 'not-found' };
    }

    return this.setPassword(user, next);
  }

  async findUser(identifier: string): Promise<PublicUser | null> {
    await this.whenReady();
    const user = this.users[AuthService.normalizeIdentifier(identifier)];
    return user ? this.toPublic(user) : null;
  }

  /** Removes the account and ALL of its data (used by account deletion). */
  async deleteAccount(): Promise<void> {
    await this.whenReady();
    const user = this.getRawCurrentUser();
    if (!user) return;
    delete this.users[user.identifier];
    await this.db.setJson(this.db.usersKey(), this.users);
    await this.db.remove(this.db.keyForUserData(user.id));
    await this.db.remove(this.db.keyForCart(user.id));
    await this.logout();
  }

  // ------------------------------------------------------------------
  // Internal helpers
  // ------------------------------------------------------------------

  private async startSession(user: UserRecord): Promise<void> {
    this.session = { userId: user.identifier, loginAt: new Date().toISOString() };
    await this.db.setJson(this.db.sessionKey(), this.session);
    this.emitUser(user);
  }

  private async setPassword(user: UserRecord, password: string): Promise<AuthResult> {
    const salt = this.randomSalt();
    const updated: UserRecord = {
      ...user,
      legacy: false,
      passwordHash: await this.hashPassword(password, salt),
      passwordSalt: salt,
      updatedAt: new Date().toISOString(),
    };
    this.users[user.identifier] = updated;
    await this.db.setJson(this.db.usersKey(), this.users);
    if (this.session?.userId === user.identifier) {
      this.emitUser(updated);
    }
    return { ok: true, user: this.toPublic(updated) };
  }

  private getRawCurrentUser(): UserRecord | null {
    const pub = this.currentUser;
    return pub ? this.users[pub.identifier] ?? null : null;
  }

  private emitUser(user: UserRecord): void {
    this.currentUserSubject.next(this.toPublic(user));
  }

  private toPublic(user: UserRecord): PublicUser {
    return {
      id: user.id,
      name: user.name,
      identifier: user.identifier,
      email: user.email || user.identifier,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      hasPassword: !user.legacy,
    };
  }

  private randomSalt(): string {
    const bytes = new Uint8Array(16);
    if (globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /** SHA-256(salt:password) with a graceful fallback on insecure contexts. */
  private async hashPassword(password: string, salt: string): Promise<string> {
    const data = new TextEncoder().encode(`${salt}:${password}`);
    const subtle = globalThis.crypto?.subtle;
    if (subtle) {
      const digest = await subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback (insecure dev context): two rounds of a 128-bit avalanche mix.
    let h1 = 0xdeadbeef ^ data.length, h2 = 0x41c6ce57 ^ data.length;
    for (const byte of data) {
      h1 = Math.imul(h1 ^ byte, 2654435761);
      h2 = Math.imul(h2 ^ byte, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return `${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
  }
}
