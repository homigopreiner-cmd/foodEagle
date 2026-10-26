import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonIcon, IonToggle, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bagHandleOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { VendorService } from '../../../../core/services/vendor.service';
import { OrderService } from '../../../../core/services/order.service';
import {
  OrderStatus,
  PlatformOrder,
  STATUS_LABEL,
  VendorProfile,
  isActiveStatus,
  pesos,
} from '../../../../core/models/platform.model';

/**
 * Vendor · Home — the kitchen's control panel.
 *
 * Everything here is derived from the shared ledger, so an order placed on
 * the customer phone lands on this screen practically immediately.
 */
@Component({
  selector: 'app-vendor-home',
  template: `
    <div class="shell-body">
      <div class="page-head">
        <div>
          <h1>{{ greeting }}, {{ firstName }}</h1>
          <p>{{ today }}</p>
        </div>
        <button
          class="btn btn--sm"
          [class.btn--muted]="!store?.acceptingOrders"
          (click)="toggleAccepting()"
        >
          {{ store?.acceptingOrders ? 'Pause store' : 'Open store' }}
        </button>
      </div>

      <div class="stat-grid">
        <div class="stat is-accent">
          <div class="stat-label">New orders</div>
          <div class="stat-value">{{ stats.new }}</div>
          <div class="stat-hint">need a reply</div>
        </div>
        <div class="stat">
          <div class="stat-label">In the kitchen</div>
          <div class="stat-value">{{ stats.cooking }}</div>
          <div class="stat-hint">being prepared</div>
        </div>
        <div class="stat">
          <div class="stat-label">Waiting on rider</div>
          <div class="stat-value">{{ stats.ready }}</div>
          <div class="stat-hint">bags ready</div>
        </div>
        <div class="stat">
          <div class="stat-label">Delivered</div>
          <div class="stat-value">{{ stats.delivered }}</div>
          <div class="stat-hint">{{ peso(stats.revenue) }} sales</div>
        </div>
      </div>

      <div class="card">
        <h3>Live order queue</h3>

        <div class="empty-state" *ngIf="!queue.length">
          <ion-icon name="bag-handle-outline"></ion-icon>
          <h4>No orders right now</h4>
          <p>Orders placed by customers appear here the moment they land.</p>
        </div>

        <div class="list-row" *ngFor="let o of queue">
          <div class="list-main">
            <div class="list-title">{{ o.code }} · {{ o.customerName }}</div>
            <div class="list-sub">
              {{ summary(o) }}<span *ngIf="o.riderName"> · rider {{ o.riderName }}</span>
            </div>
          </div>
          <div class="list-end">
            <span class="pill" [ngClass]="'pill--' + o.status">{{ label(o.status) }}</span>
            <div class="list-sub" style="margin-top: 4px">{{ peso(o.total) }}</div>
          </div>
        </div>

        <div class="btn-row" *ngIf="queue.length">
          <button class="btn btn--ghost btn--sm" routerLink="/vendor/orders">Open inbox</button>
        </div>
      </div>

      <div class="card">
        <h3>Store</h3>
        <div class="list-row" *ngIf="store">
          <div class="list-main">
            <div class="list-title">{{ store.name }}</div>
            <div class="list-sub">{{ store.tagline }} · {{ store.spot }}</div>
          </div>
          <span class="pill pill--delivered" *ngIf="store.approved">Verified</span>
          <span class="pill pill--declined" *ngIf="!store.approved">Pending</span>
        </div>

        <div class="toggle-row" *ngIf="store">
          <div>
            <div class="toggle-label">Accepting orders</div>
            <div class="toggle-hint">Turning this off hides the store from shoppers</div>
          </div>
          <ion-toggle [ngModel]="store.acceptingOrders" (ngModelChange)="toggleAccepting()"></ion-toggle>
        </div>

        <div class="btn-row">
          <button class="btn btn--ghost btn--sm" routerLink="/vendor/menu">Manage menu</button>
          <button class="btn btn--muted btn--sm" routerLink="/vendor/store">Store profile</button>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonIcon, IonToggle],
})
export class VendorHomePage implements OnInit, OnDestroy {
  private readonly storeState = signal<VendorProfile | null>(null);
  get store(): VendorProfile | null { return this.storeState(); }
  private readonly ordersState = signal<PlatformOrder[]>([]);
  get orders(): PlatformOrder[] { return this.ordersState(); }
  private readonly firstNameState = signal<string>('Partner');
  get firstName(): string { return this.firstNameState(); }
  private readonly greetingState = signal<string>('Good day');
  get greeting(): string { return this.greetingState(); }

  readonly statusLabel = STATUS_LABEL;

  private subs: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private vendors: VendorService,
    private ledger: OrderService,
    private toast: ToastController
  ) {
    addIcons({ bagHandleOutline });
  }

  get today(): string {
    return new Date().toLocaleDateString('en-PH', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  async ngOnInit(): Promise<void> {
    await this.ledger.ready();
    const user = this.auth.currentUser;
    this.firstNameState.set( (user?.name ?? 'Partner').split(' ')[0]);

    const hour = new Date().getHours();
    this.greetingState.set( hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');

    this.subs.push(
      this.vendors.stores$.subscribe(() => void this.resolveStore()),
      this.ledger.ledger$.subscribe(() => this.reload())
    );
    await this.resolveStore();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private async resolveStore(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    const owned = await this.vendors.ownedBy(user.identifier);
    this.storeState.set( owned.find(s => s.id === this.vendors.activeStoreId) ?? owned[0] ?? null);
    if (this.store) this.vendors.setActiveStore(this.store.id);
    this.reload();
  }

  private reload(): void {
    this.ordersState.set( this.store ? this.ledger.forVendor(this.store.id) : []);
  }

  get queue(): PlatformOrder[] {
    return this.orders.filter(o => isActiveStatus(o.status)).slice(0, 6);
  }

  get stats() {
    const all = this.orders;
    return {
      new: all.filter(o => o.status === 'placed').length,
      cooking: all.filter(o => o.status === 'confirmed' || o.status === 'preparing').length,
      ready: all.filter(o => o.status === 'ready').length,
      delivered: all.filter(o => o.status === 'delivered').length,
      revenue: round(
        all.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0)
      ),
    };
  }

  summary(o: PlatformOrder): string {
    return o.items.map(i => `${i.quantity}× ${i.name}`).join(', ');
  }

  label = (status: OrderStatus) => STATUS_LABEL[status];
  peso = (value: number) => pesos(value);

  async toggleAccepting(): Promise<void> {
    if (!this.store) return;
    await this.vendors.toggleAccepting(this.store.id);
    this.storeState.set( await this.vendors.findById(this.store.id));
    const toast = await this.toast.create({
      message: this.store?.acceptingOrders
        ? 'Store is open again.'
        : 'Store paused — it is hidden from shoppers.',
      duration: 1800,
    });
    await toast.present();
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}