import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personCircleOutline, logOutOutline, cameraOutline } from 'ionicons/icons';
import { AuthService, PublicUser } from '../../../../core/services/auth.service';
import { RiderService } from '../../../../core/services/rider.service';
import { RiderProfile, ROLE_LABEL, pesos } from '../../../../core/models/platform.model';

/**
 * Rider · Profile — identity, vehicle and account.
 *
 * Vehicle details live on the courier record (not the login account)
 * because the app treats "who can sign in" and "who rides" as separate
 * concerns, exactly like the vendor store record.
 */
@Component({
  selector: 'app-rider-profile',
  template: `
    <div class="shell-body">
      <div class="page-head">
        <div>
          <h1>Profile</h1>
          <p>Rider account</p>
        </div>
      </div>

      <div class="card" style="text-align: center">
        <div class="rider-avatar">
          <img *ngIf="photo" class="rider-avatar__img" [src]="photo" alt="" />
          <ion-icon *ngIf="!photo" class="rider-avatar__fallback" name="person-circle-outline"></ion-icon>
          <button
            class="rider-avatar__btn"
            type="button"
            title="Change profile photo"
            (click)="photoPicker.click()"
          >
            <ion-icon name="camera-outline"></ion-icon>
          </button>
        </div>
        <input #photoPicker type="file" accept="image/*" hidden (change)="onPhotoPicked($event)" />
        <button *ngIf="photo" class="btn btn--muted btn--sm" type="button" (click)="removePhoto()">
          Remove photo
        </button>
        <div class="list-title" style="font-size: 1rem; margin-top: 6px">{{ displayName }}</div>
        <div class="list-sub">{{ user?.identifier }}</div>
        <div style="margin-top: 6px">
          <span class="pill pill--confirmed">{{ roleLabel }}</span>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat">
          <div class="stat-label">Rating</div>
          <div class="stat-value">{{ (rider?.rating ?? 5).toFixed(1) }}★</div>
          <div class="stat-hint">from customers</div>
        </div>
        <div class="stat">
          <div class="stat-label">Completed</div>
          <div class="stat-value">{{ rider?.completedDeliveries ?? 0 }}</div>
          <div class="stat-hint">deliveries</div>
        </div>
        <div class="stat">
          <div class="stat-label">Earned</div>
          <div class="stat-value">{{ peso(rider?.totalEarnings ?? 0) }}</div>
          <div class="stat-hint">lifetime</div>
        </div>
      </div>

      <div class="card">
        <h3>Profile &amp; vehicle</h3>

        <label class="field">
          <span>Display name</span>
          <input type="text" [(ngModel)]="name" placeholder="Your name" maxlength="60" />
        </label>

        <label class="field">
          <span>Vehicle type</span>
          <select [(ngModel)]="vehicle">
            <option>Motorcycle</option>
            <option>Bicycle</option>
            <option>Tricycle</option>
            <option>On foot</option>
          </select>
        </label>

        <div class="field-row">
          <label class="field">
            <span>Plate / ID number</span>
            <input type="text" [(ngModel)]="plateNo" placeholder="e.g. DTO-1187" />
          </label>
          <label class="field">
            <span>Contact number</span>
            <input type="text" [(ngModel)]="contact" placeholder="09XXXXXXXXX" />
          </label>
        </div>

        <div class="btn-row">
          <button class="btn btn--sm" (click)="save()">Save details</button>
          <button class="btn btn--danger btn--sm" (click)="signOut()">
            <ion-icon name="log-out-outline"></ion-icon> Sign out
          </button>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
})
export class RiderProfilePage implements OnInit {
  private readonly userState = signal<PublicUser | null>(null);
  get user(): PublicUser | null { return this.userState(); }
  private readonly riderState = signal<RiderProfile | null>(null);
  get rider(): RiderProfile | null { return this.riderState(); }

  private readonly nameState = signal<string>('');
  get name(): string { return this.nameState(); }
  set name(value: string) { this.nameState.set(value); }

  private readonly photoState = signal<string>('');
  get photo(): string { return this.photoState(); }

  get displayName(): string {
    return this.name.trim() || this.user?.name || 'Rider';
  }

  private readonly vehicleState = signal<string>('Motorcycle');
  get vehicle(): string { return this.vehicleState(); }
  private readonly plateNoState = signal<string>('');
  get plateNo(): string { return this.plateNoState(); }
  private readonly contactState = signal<string>('');
  get contact(): string { return this.contactState(); }

  constructor(
    private auth: AuthService,
    private riders: RiderService,
    private router: Router,
    private toast: ToastController
  ) {
    addIcons({ personCircleOutline, logOutOutline, cameraOutline });
  }

  get roleLabel(): string {
    return ROLE_LABEL[this.user?.role ?? 'rider'];
  }

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser;
    this.userState.set(user);
    if (!user) return;

    const rider = (await this.riders.ownedBy(user.identifier)) ??
      (await this.riders.ensureFor(user.identifier, user.name));
    this.riderState.set(rider);

    this.nameState.set(rider.name || user.name);
    this.photoState.set(rider.photo ?? '');
    this.vehicleState.set(rider.vehicle);
    this.plateNoState.set(rider.plateNo);
    this.contactState.set(rider.contact);
  }

  async save(): Promise<void> {
    if (!this.rider) return;
    const name = this.name.trim() || this.rider.name;
    await this.riders.update(this.rider.id, {
      name,
      vehicle: this.vehicle,
      plateNo: this.plateNo.trim(),
      contact: this.contact.trim(),
    });
    this.riderState.set({ ...this.rider, name });
    this.nameState.set(name);
    // Keep the login account's display name in step with the courier record.
    if (this.user && this.user.name !== name) {
      await this.auth.updateProfile({ name });
      this.userState.set(this.auth.currentUser);
    }
    const toast = await this.toast.create({ message: 'Rider details saved.', duration: 1600 });
    await toast.present();
  }

  // ---------- Profile photo ----------

  /** Opens the gallery / camera via the hidden file input's change event. */
  onPhotoPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // same file may be re-picked later
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      void this.toastMessage('Please choose an image file.', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => void this.persistPhoto(String(reader.result));
    reader.onerror = () => void this.toastMessage('Could not read that image.', 'danger');
    reader.readAsDataURL(file);
  }

  async removePhoto(): Promise<void> {
    if (!this.rider || !this.photo) return;
    await this.riders.update(this.rider.id, { photo: '' });
    this.riderState.set({ ...this.rider, photo: '' });
    this.photoState.set('');
    await this.auth.updateProfile({ avatarUrl: '' });
    await this.toastMessage('Profile photo removed.');
  }

  private async persistPhoto(dataUrl: string): Promise<void> {
    if (!this.rider) return;
    try {
      // Shrink before saving: the rider record lives in Preferences storage,
      // so a phone camera's 4 MB originals would bloat every app's read.
      const photo = await RiderProfilePage.shrink(dataUrl, 320, 0.82);
      await this.riders.update(this.rider.id, { photo });
      this.riderState.set({ ...this.rider, photo });
      this.photoState.set(photo);
      await this.auth.updateProfile({ avatarUrl: photo });
      await this.toastMessage('Profile photo updated.');
    } catch {
      await this.toastMessage('That image could not be processed.', 'danger');
    }
  }

  private static shrink(dataUrl: string, max: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas unsupported'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('image decode failed'));
      img.src = dataUrl;
    });
  }

  private async toastMessage(message: string, color?: string): Promise<void> {
    const toast = await this.toast.create({ message, duration: 1600, color });
    await toast.present();
  }

  async signOut(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login'], { replaceUrl: true });
  }

  peso = (value: number) => pesos(value);
}