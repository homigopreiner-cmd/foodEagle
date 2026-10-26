import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cashOutline } from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { RiderService } from '../../../../core/services/rider.service';
import { OrderService } from '../../../../core/services/order.service';
import {
  PlatformOrder,
  RiderProfile,
  DEFAULT_DELIVERY_FEE,
  pesos,
} from '../../../../core/models/platform.model';

/**
 * Rider · Earnings — a courier's pay slip.
 *
 * Delivery fees are credited the moment an order is marked delivered, and
 * the slip shows the same rows the rider delivered, so the number can be
 * reconciled instead of just trusted.
 */
@Component({
  selector: 'app-rider-earnings',
  template: `
    <div class="shell-body">
      <div class="page-head">
        <div>
          <h1>Earnings</h1>
          <p>{{ rider ? rider.name : 'No rider profile' }}</p>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat is-accent">
          <div class="stat-label">Total earned</div>
          <div class="stat-value">{{ peso(rider?.totalEarnings ?? 0) }}</div>
          <div class="stat-hint">all time</div>
        </div>
        <div class="stat">
          <div class="stat-label">Completed drops</div>
          <div class="stat-value">{{ rider?.completedDeliveries ?? 0 }}</div>
          <div class="stat-hint">lifetime</div>
        </div>
        <div class="stat">
          <div class="stat-label">This week</div>
          <div class="stat-value">{{ peso(weekEarnings) }}</div>
          <div class="stat-hint">{{ weekDeliveries }} deliveries</div>
        </div>
        <div class="stat">
          <div class="stat-label">Per delivery</div>
          <div class="stat-value">{{ peso(fee) }}</div>
          <div class="stat-hint">flat campus rate</div>
        </div>
      </div>

      <div class="card">
        <h3>Delivery slip</h3>

        <div class="empty-state" *ngIf="!delivered.length">
          <ion-icon name="cash-outline"></ion-icon>
          <h4>No completed runs yet</h4>
          <p>Every delivery you finish is logged here with its fee.</p>
        </div>

        <div class="list-row" *ngFor="let o of delivered">
          <div class="list-main">
            <div class="list-title">{{ o.code }} · {{ o.vendorName }}</div>
            <div class="list-sub">To {{ o.dropoffBuilding }} · {{ date(o.updatedAt) }}</div>
          </div>
          <div class="list-end" style="color: #0b7a4b">+ {{ peso(fee) }}</div>
        </div>
      </div>

      <div class="card">
        <h3>How you get paid</h3>
        <div class="list-row">
          <div class="list-main"><div class="list-title">Base fee</div><div class="list-sub">Every completed campus delivery</div></div>
          <div class="list-end">{{ peso(fee) }}</div>
        </div>
        <div class="list-row">
          <div class="list-main"><div class="list-title">Cash on delivery</div><div class="list-sub">Collected from the customer, remitted at cut-off</div></div>
          <div class="list-end">Pass-through</div>
        </div>
        <div class="list-row">
          <div class="list-main"><div class="list-title">Payout schedule</div><div class="list-sub">Weekly, every Friday</div></div>
          <div class="list-end">Weekly</div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class RiderEarningsPage implements OnInit {
  private readonly riderState = signal<RiderProfile | null>(null);
  get rider(): RiderProfile | null { return this.riderState(); }
  private readonly deliveredState = signal<PlatformOrder[]>([]);
  get delivered(): PlatformOrder[] { return this.deliveredState(); }

  readonly fee = DEFAULT_DELIVERY_FEE;

  constructor(
    private auth: AuthService,
    private riders: RiderService,
    private ledger: OrderService
  ) {
    addIcons({ cashOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.ledger.ready();
    const user = this.auth.currentUser;
    if (user) this.riderState.set( await this.riders.ownedBy(user.identifier));
    this.ledger.ledger$.subscribe(() => this.reload());
    this.reload();
  }

  private reload(): void {
    if (!this.rider) return;
    this.deliveredState.set( this.ledger
      .forRider(this.rider.id)
      .filter(o => o.status === 'delivered'));
  }

  get weekDeliveries(): number {
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    return this.delivered.filter(o => new Date(o.updatedAt).getTime() >= weekAgo).length;
  }

  get weekEarnings(): number {
    return this.weekDeliveries * this.fee;
  }

  peso = (value: number) => pesos(value);

  date(iso: string): string {
    return new Date(iso).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}