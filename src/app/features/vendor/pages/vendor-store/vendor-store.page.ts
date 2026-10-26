import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { storefrontOutline } from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { VendorService } from '../../../../core/services/vendor.service';
import { MenuService } from '../../../../core/services/menu.service';
import { VendorProfile } from '../../../../core/models/platform.model';

/**
 * Vendor · Store — the shopfront record.
 *
 * Everything a customer sees on the store card (name, tagline, stall spot,
 * hours, prep time) is edited here, so there is no second place where the
 * data can drift out of sync.
 */
@Component({
  selector: 'app-vendor-store',
  template: `
    <div class="shell-body">
      <div class="page-head">
        <div>
          <h1>Store profile</h1>
          <p>What shoppers see on your storefront</p>
        </div>
        <span class="pill" [ngClass]="store?.approved ? 'pill--delivered' : 'pill--declined'">
          {{ store?.approved ? 'Verified' : 'Pending approval' }}
        </span>
      </div>

      <div class="empty-state" *ngIf="!store">
        <ion-icon name="storefront-outline"></ion-icon>
        <h4>No store assigned</h4>
        <p>Your partner account is not linked to a store yet.</p>
      </div>

      <div class="card" *ngIf="store">
        <label class="field">
          <span>Store name</span>
          <input type="text" [(ngModel)]="store.name" maxlength="40" />
        </label>

        <label class="field">
          <span>Tagline</span>
          <input type="text" [(ngModel)]="store.tagline" maxlength="60" />
        </label>

        <div class="field-row">
          <label class="field">
            <span>Campus spot</span>
            <input type="text" [(ngModel)]="store.spot" maxlength="40" />
          </label>
          <label class="field">
            <span>Preparation time</span>
            <input type="text" [(ngModel)]="store.prepTime" maxlength="24" placeholder="5–10 min" />
          </label>
        </div>

        <label class="field">
          <span>Operating hours</span>
          <input type="text" [(ngModel)]="store.hours" maxlength="60" placeholder="Mon–Sat 7:00 AM – 6:00 PM" />
        </label>

        <div class="field-row">
          <label class="field">
            <span>Logo image path</span>
            <input type="text" [(ngModel)]="store.logoUrl" />
          </label>
          <label class="field">
            <span>Cover image path</span>
            <input type="text" [(ngModel)]="store.heroUrl" />
          </label>
        </div>

        <div class="btn-row">
          <button class="btn btn--sm" (click)="save()">Save profile</button>
        </div>
      </div>

      <div class="card" *ngIf="store">
        <h3>Pause trading</h3>
        <p style="margin: 0; font-size: 0.76rem; color: #8a8a8a">
          Pausing hides your store from the customer app immediately. Your menu,
          orders and history are kept exactly as they are.
        </p>
        <div class="btn-row">
          <button
            class="btn btn--sm"
            [class.btn--danger]="store.acceptingOrders"
            [class.btn--ghost]="!store.acceptingOrders"
            (click)="togglePause()"
          >
            {{ store.acceptingOrders ? 'Pause store' : 'Reopen store' }}
          </button>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
})
export class VendorStorePage implements OnInit {
  private readonly storeState = signal<VendorProfile | null>(null);
  get store(): VendorProfile | null { return this.storeState(); }

  constructor(
    private auth: AuthService,
    private vendors: VendorService,
    private menu: MenuService,
    private toast: ToastController
  ) {
    addIcons({ storefrontOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.menu.ready();
    const user = this.auth.currentUser;
    if (!user) return;

    const owned = await this.vendors.ownedBy(user.identifier);
    this.storeState.set( owned.find(s => s.id === this.vendors.activeStoreId) ?? owned[0] ?? null);
    if (this.store) this.vendors.setActiveStore(this.store.id);
  }

  async save(): Promise<void> {
    if (!this.store) return;
    const name = this.store.name.trim();
    if (!name) {
      await this.notify('The store needs a name.');
      return;
    }
    await this.vendors.updateStore(this.store.id, {
      name,
      tagline: this.store.tagline.trim(),
      spot: this.store.spot.trim(),
      hours: this.store.hours.trim(),
      prepTime: this.store.prepTime.trim(),
      logoUrl: this.store.logoUrl.trim(),
      heroUrl: this.store.heroUrl.trim(),
    });
    await this.notify('Store profile saved.');
  }

  async togglePause(): Promise<void> {
    if (!this.store) return;
    await this.vendors.toggleAccepting(this.store.id);
    this.storeState.set( await this.vendors.findById(this.store.id));
    await this.notify(this.store?.acceptingOrders ? 'Store reopened.' : 'Store paused.');
  }

  private async notify(message: string): Promise<void> {
    const toast = await this.toast.create({ message, duration: 1800 });
    await toast.present();
  }
}