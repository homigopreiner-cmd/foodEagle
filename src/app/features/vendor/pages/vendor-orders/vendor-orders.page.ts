import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  closeCircleOutline,
  flameOutline,
  bagHandleOutline,
  timeOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { VendorService } from '../../../../core/services/vendor.service';
import { OrderService } from '../../../../core/services/order.service';
import {
  OrderStatus,
  PlatformOrder,
  STATUS_LABEL,
  VendorProfile,
  pesos,
} from '../../../../core/models/platform.model';

interface QueueFilter {
  key: string;
  label: string;
  statuses: OrderStatus[];
}

/**
 * Vendor · Orders — the ticket inbox.
 *
 * A restaurant workflow in four buckets, each with its own legal next step
 * (accept / start cooking / call the rider / done). The buttons are derived
 * from the ledger's transition table, so the console can never show an
 * action that would corrupt an order's history.
 */
@Component({
  selector: 'app-vendor-orders',
  template: `
    <div class="shell-body">
      <div class="page-head">
        <div>
          <h1>Order inbox</h1>
          <p>{{ store ? store.name : 'No store selected' }}</p>
        </div>
      </div>

      <div class="seg-bar">
        <button
          *ngFor="let f of filters"
          [class.active]="filterKey === f.key"
          (click)="setFilter(f.key)"
        >
          {{ f.label }}<span class="count">{{ countFor(f) }}</span>
        </button>
      </div>

      <div class="empty-state" *ngIf="!visible.length">
        <ion-icon name="bag-handle-outline"></ion-icon>
        <h4>Nothing in this tray</h4>
        <p>Orders move between trays as you confirm, cook and hand them off.</p>
      </div>

      <div class="card" *ngFor="let o of visible">
        <div class="list-row" style="padding-top: 0">
          <div class="list-main">
            <div class="list-title">{{ o.code }} · {{ o.customerName }}</div>
            <div class="list-sub">{{ o.customerContact }} · {{ time(o.placedAt) }}</div>
          </div>
          <span class="pill" [ngClass]="'pill--' + o.status">{{ label(o.status) }}</span>
        </div>

        <div class="list-row" *ngFor="let line of o.items">
          <div class="list-main">
            <div class="list-title" style="font-weight: 600">{{ line.quantity }}× {{ line.name }}</div>
            <div class="list-sub">{{ peso(line.price) }} each</div>
          </div>
          <div class="list-end">{{ peso(line.price * line.quantity) }}</div>
        </div>

        <div class="list-row">
          <div class="list-main">
            <div class="list-sub">
              {{ o.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid online' }}
              <span *ngIf="!o.paid"> · to collect {{ peso(o.total) }}</span>
            </div>
            <div class="list-sub">Deliver to {{ o.dropoffBuilding }} ({{ o.dropoffLandmark }})</div>
            <div class="list-sub" *ngIf="o.riderName">Rider: {{ o.riderName }}</div>
            <div class="list-sub" *ngIf="o.declineReason">Declined: {{ o.declineReason }}</div>
          </div>
          <div class="list-end">{{ peso(o.total) }}</div>
        </div>

        <div class="btn-row">
          <button
            *ngIf="o.status === 'placed'"
            class="btn btn--sm"
            (click)="advance(o, 'confirmed')"
          >
            <ion-icon name="checkmark-circle-outline"></ion-icon> Accept
          </button>
          <button
            *ngIf="o.status === 'placed'"
            class="btn btn--danger btn--sm"
            (click)="decline(o)"
          >
            <ion-icon name="close-circle-outline"></ion-icon> Decline
          </button>
          <button *ngIf="o.status === 'confirmed'" class="btn btn--sm" (click)="advance(o, 'preparing')">
            <ion-icon name="flame-outline"></ion-icon> Start cooking
          </button>
          <button *ngIf="o.status === 'preparing'" class="btn btn--sm" (click)="advance(o, 'ready')">
            <ion-icon name="bag-handle-outline"></ion-icon> Ready for pickup
          </button>
          <span class="pill pill--ready" *ngIf="o.status === 'ready'">
            <ion-icon name="time-outline"></ion-icon>
            Awaiting a rider
          </span>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class VendorOrdersPage implements OnInit, OnDestroy {
  private readonly storeState = signal<VendorProfile | null>(null);
  get store(): VendorProfile | null { return this.storeState(); }
  private readonly ordersState = signal<PlatformOrder[]>([]);
  get orders(): PlatformOrder[] { return this.ordersState(); }
  filterKey = 'new';

  readonly filters: QueueFilter[] = [
    { key: 'new', label: 'New', statuses: ['placed'] },
    { key: 'cooking', label: 'Cooking', statuses: ['confirmed', 'preparing'] },
    { key: 'ready', label: 'Ready', statuses: ['ready', 'picked_up', 'delivering'] },
    { key: 'done', label: 'Completed', statuses: ['delivered', 'declined', 'cancelled'] },
  ];

  private subs: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private vendors: VendorService,
    private ledger: OrderService,
    private toast: ToastController
  ) {
    addIcons({
      checkmarkCircleOutline,
      closeCircleOutline,
      flameOutline,
      bagHandleOutline,
      timeOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await this.ledger.ready();
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

  setFilter(key: string): void {
    this.filterKey = key;
  }

  countFor(filter: QueueFilter): number {
    return this.orders.filter(o => filter.statuses.includes(o.status)).length;
  }

  get visible(): PlatformOrder[] {
    const filter = this.filters.find(f => f.key === this.filterKey);
    if (!filter) return [];
    return this.orders.filter(o => filter.statuses.includes(o.status));
  }

  async advance(order: PlatformOrder, next: OrderStatus, note?: string): Promise<void> {
    const result = await this.ledger.transition(order.id, next, 'vendor', note);
    const toast = await this.toast.create({
      message: result.ok ? `${order.code} → ${STATUS_LABEL[next]}` : (result.error ?? 'Could not update the order.'),
      duration: 1800,
      color: result.ok ? 'success' : 'danger',
    });
    await toast.present();
  }

  /** Declining is a real workflow step, so we always ask for a reason. */
  decline(order: PlatformOrder): void {
    const reasons = ['Sold out for the day', 'Store is too busy', 'Outside operating hours'];
    const picked = window.prompt(
      `Decline ${order.code}?\n\nPick a reason:\n${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
      '1'
    );
    if (picked === null) return;
    const reason = reasons[Number(picked) - 1] ?? picked;
    void this.advance(order, 'declined', reason);
  }

  label = (status: OrderStatus) => STATUS_LABEL[status];
  peso = (value: number) => pesos(value);

  time(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  }}
