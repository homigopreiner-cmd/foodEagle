import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  searchOutline,
  addOutline,
  createOutline,
  keyOutline,
  trashOutline,
  eyeOutline,
  eyeOffOutline,
  closeOutline,
} from 'ionicons/icons';
import { AuthService, PublicUser } from '../../../../core/services/auth.service';
import { ROLE_LABEL, USER_ROLES, UserRole } from '../../../../core/models/platform.model';

type PanelMode = 'closed' | 'create' | 'edit' | 'password';

interface FormState {
  name: string;
  identifier: string;
  password: string;
  confirm: string;
  role: UserRole;
}

/**
 * Admin · Users — full CRUD on the account directory.
 *
 * Expert notes baked into this implementation:
 *
 *  1. Passwords are salted hashes (SHA-256) — there is nothing to "show",
 *     and revealing a stored password is not something a well-built system
 *     can or should do. What an admin gets instead is *reset*: type a new
 *     password, toggle "show" while typing, and the user signs in with it.
 *     The table shows whether a password is set, never the secret itself.
 *  2. Every mutation runs through AuthService admin methods, so validation
 *     (identifier format, 6+ chars, duplicate detection) is identical to
 *     the sign-up flow — one set of rules, one place to change them.
 *  3. Guard rails: you cannot delete the account you are signed in with,
 *     and the last remaining admin cannot be deleted.
 */
@Component({
  selector: 'app-admin-users',
  template: `
    <div class="admin-grid">
      <div class="kpi" *ngFor="let r of roleRows">
        <div class="kpi-icon"><ion-icon name="people-outline"></ion-icon></div>
        <div>
          <div class="kpi-label">{{ r.label }}</div>
          <div class="kpi-value">{{ r.count }}</div>
          <div class="kpi-hint">{{ r.hint }}</div>
        </div>
      </div>
    </div>

    <div class="admin-card">
      <div class="users-toolbar">
        <input
          type="search"
          placeholder="Search by name or email..."
          [(ngModel)]="query"
          class="users-search"
        />
        <button class="btn" type="button" (click)="openCreate()">
          <ion-icon name="add-outline"></ion-icon> Add user
        </button>
      </div>

      <!-- Create / edit / password panel -->
      <div class="admin-card users-panel" *ngIf="panel !== 'closed'">
        <h3>{{ panelTitle }}</h3>

        <div class="field-row">
          <label class="field">
            <span>Full name</span>
            <input type="text" [(ngModel)]="form.name" placeholder="e.g. Maria Santos" />
          </label>
          <label class="field">
            <span>Email or phone (login)</span>
            <input
              type="text"
              [(ngModel)]="form.identifier"
              placeholder="name@gmail.com or 09XXXXXXXXXX"
              [disabled]="panel === 'password'"
            />
          </label>
        </div>

        <div class="field-row" *ngIf="panel !== 'password'">
          <label class="field">
            <span>Role</span>
            <select [(ngModel)]="form.role">
              <option *ngFor="let r of roles" [value]="r">{{ label(r) }}</option>
            </select>
          </label>
          <div></div>
        </div>

        <div class="field-row" *ngIf="panel === 'create' || panel === 'password'">
          <label class="field">
            <span>{{ panel === 'password' ? 'New password' : 'Password' }}</span>
            <div class="pw-wrap">
              <input
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="form.password"
                placeholder="At least 6 characters"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="pw-toggle"
                [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
                (click)="showPassword = !showPassword">
                <ion-icon [name]="showPassword ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
              </button>
            </div>
          </label>
          <label class="field" *ngIf="panel === 'password'">
            <span>Confirm new password</span>
            <input
              [type]="showPassword ? 'text' : 'password'"
              [(ngModel)]="form.confirm"
              placeholder="Repeat the password"
              autocomplete="new-password"
            />
          </label>
        </div>

        <p class="pw-hint" *ngIf="panel === 'password'">
          Passwords are stored only as salted hashes, so the current one cannot be
          displayed — resetting it here is how an admin gives a user access again.
        </p>

        <div class="btn-row">
          <button class="btn" type="button" (click)="save()">{{ panelSaveLabel }}</button>
          <button class="btn btn--muted" type="button" (click)="closePanel()">Cancel</button>
        </div>
      </div>

      <p class="panel-msg" [class.is-error]="messageIsError" *ngIf="message">{{ message }}</p>

      <div *ngIf="!visible.length" class="empty-state">
        <h4>No matching accounts</h4>
        <p>Try a different name, email or phone number.</p>
      </div>

      <table class="admin-table" *ngIf="visible.length">
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Role</th>
            <th>Sign-in method</th>
            <th>Password</th>
            <th style="text-align: right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of visible">
            <td>
              <strong>{{ u.name }}</strong>
              <div class="kpi-hint">{{ u.id }}</div>
            </td>
            <td>{{ u.identifier }}</td>
            <td>
              <span class="pill" [ngClass]="pillFor(u.role)">{{ label(u.role) }}</span>
            </td>
            <td style="text-transform: capitalize">{{ u.provider }}</td>
            <td>
              <span class="pill" [ngClass]="u.hasPassword ? 'pill--delivered' : 'pill--placed'">
                {{ u.hasPassword ? 'Set (hashed)' : 'Not set' }}
              </span>
            </td>
            <td class="row-actions">
              <button class="btn btn--sm btn--ghost" type="button" title="Edit details" (click)="openEdit(u)">
                <ion-icon name="create-outline"></ion-icon> Edit
              </button>
              <button class="btn btn--sm btn--ghost" type="button" title="Set a new password" (click)="openPassword(u)">
                <ion-icon name="key-outline"></ion-icon> Password
              </button>
              <button class="btn btn--sm btn--danger" type="button" title="Delete account" (click)="remove(u)">
                <ion-icon name="trash-outline"></ion-icon> Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="kpi-hint" style="margin-top: 12px; text-align: right">
        {{ visible.length }} of {{ users.length }} accounts
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
})
export class AdminUsersPage implements OnInit {
  private readonly usersState = signal<PublicUser[]>([]);
  get users(): PublicUser[] { return this.usersState(); }
  query = '';

  panel: PanelMode = 'closed';
  showPassword = false;
  message = '';
  messageIsError = false;
  private editing: PublicUser | null = null;

  form: FormState = { name: '', identifier: '', password: '', confirm: '', role: 'customer' };

  readonly roles: readonly UserRole[] = USER_ROLES;

  readonly hints: Record<UserRole, string> = {
    customer: 'shops in the customer app',
    vendor: 'runs a store',
    rider: 'delivers orders',
    admin: 'platform oversight',
  };

  constructor(private auth: AuthService) {
    addIcons({
      peopleOutline,
      searchOutline,
      addOutline,
      createOutline,
      keyOutline,
      trashOutline,
      eyeOutline,
      eyeOffOutline,
      closeOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  private async reload(): Promise<void> {
    this.usersState.set(await this.auth.listUsers());
  }

  get roleRows(): Array<{ label: string; count: number; hint: string }> {
    return (['admin', 'vendor', 'rider', 'customer'] as UserRole[]).map(role => ({
      label: ROLE_LABEL[role],
      count: this.users.filter(u => u.role === role).length,
      hint: this.hints[role],
    }));
  }

  get visible(): PublicUser[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(
      u =>
        u.name.toLowerCase().includes(q) ||
        u.identifier.toLowerCase().includes(q)
    );
  }

  label = (role: UserRole) => ROLE_LABEL[role];

  pillFor(role: UserRole): string {
    switch (role) {
      case 'admin': return 'pill--ready';
      case 'vendor': return 'pill--preparing';
      case 'rider': return 'pill--delivering';
      default: return 'pill--confirmed';
    }
  }

  // ------------------------------------------------------------------
  // Panel handling
  // ------------------------------------------------------------------

  get panelTitle(): string {
    if (this.panel === 'create') return 'Add a new user';
    if (this.panel === 'edit') return `Edit ${this.editing?.name ?? 'user'}`;
    if (this.panel === 'password') return `Set password for ${this.editing?.name ?? 'user'}`;
    return '';
  }

  get panelSaveLabel(): string {
    if (this.panel === 'create') return 'Create user';
    if (this.panel === 'edit') return 'Save changes';
    if (this.panel === 'password') return 'Save new password';
    return 'Save';
  }

  openCreate(): void {
    this.editing = null;
    this.form = { name: '', identifier: '', password: '', confirm: '', role: 'customer' };
    this.showPassword = false;
    this.message = '';
    this.panel = 'create';
  }

  openEdit(user: PublicUser): void {
    this.editing = user;
    this.form = { name: user.name, identifier: user.identifier, password: '', confirm: '', role: user.role };
    this.message = '';
    this.panel = 'edit';
  }

  openPassword(user: PublicUser): void {
    this.editing = user;
    this.form = { name: user.name, identifier: user.identifier, password: '', confirm: '', role: user.role };
    this.showPassword = false;
    this.message = '';
    this.panel = 'password';
  }

  closePanel(): void {
    this.panel = 'closed';
    this.editing = null;
    this.message = '';
  }

  private fail(text: string): void {
    this.message = text;
    this.messageIsError = true;
  }

  async save(): Promise<void> {
    this.message = '';
    this.messageIsError = false;

    if (this.panel === 'create') {
      const result = await this.auth.adminCreateUser({
        name: this.form.name,
        identifier: this.form.identifier,
        password: this.form.password,
        role: this.form.role,
      });
      if (!result.ok) return this.fail(result.error);
      await this.reload();
      const created = result.user.identifier;
      this.closePanel();
      this.message = `${created} was created.`;
      this.messageIsError = false;
      return;
    }

    if (this.panel === 'edit' && this.editing) {
      const result = await this.auth.adminUpdateUser(this.editing.identifier, {
        name: this.form.name,
        identifier: this.form.identifier,
        role: this.form.role,
      });
      if (!result.ok) return this.fail(result.error);
      await this.reload();
      this.closePanel();
      return;
    }

    if (this.panel === 'password' && this.editing) {
      const result = await this.auth.adminSetPassword(
        this.editing.identifier,
        this.form.password,
        this.form.confirm
      );
      if (!result.ok) return this.fail(result.error);
      await this.reload();
      this.closePanel();
      return;
    }
  }

  async remove(user: PublicUser): Promise<void> {
    const confirmed = window.confirm(
      `Delete ${user.name} (${user.identifier})?\n\nThis removes the account and all of its data. This cannot be undone.`
    );
    if (!confirmed) return;

    const result = await this.auth.adminDeleteUser(user.identifier);
    if (!result.ok) {
      this.message = result.error;
      this.messageIsError = true;
      return;
    }
    await this.reload();
    if (this.editing?.identifier === user.identifier) this.closePanel();
  }
}
