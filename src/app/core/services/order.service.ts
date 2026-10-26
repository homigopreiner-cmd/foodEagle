import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DatabaseService } from './database.service';
import { AuthService } from './auth.service';
import { VendorService } from './vendor.service';
import {
  DEFAULT_DELIVERY_FEE,
  OrderLine,
  OrderStats,
  OrderStatus,
  PaymentMethod,
  PlatformOrder,
  PLATFORM_COMMISSION_RATE,
  STATUS_LABEL,
  StatusEvent,
  customerBucket,
  isActiveStatus,
} from '../models/platform.model';

/**
 * OrderService — the shared order ledger.
 *
 * This is the heart of the platform and the reason the app is no longer
 * "customer only": ONE list of orders that all four apps read and write.
 *
 *   customer -> places an order, watches it move, pays and reviews it
 *   vendor    -> sees new orders arrive, accepts / declines, marks them ready
 *   rider     -> claims ready orders and drives them to delivery
 *   admin     -> reads the same rows for reporting and dispute handling
 *
 * Status transitions are validated by a transition table, so no UI can push
 * an order into an impossible state — the classic way to keep a workflow's
 * invariants intact.
 *
 * Storage: fe_orders = PlatformOrder[]
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private orders: PlatformOrder[] = [];

  private readonly allSubject = new BehaviorSubject<PlatformOrder[]>([]);
  /** Live ledger — every dashboard subscribes to this. */
  readonly ledger$: Observable<PlatformOrder[]> = this.allSubject.asObservable();

  /** Customer-facing projection (the tracking tabs read this shape). */
  private readonly viewSubject = new BehaviorSubject<OrderItem[]>([]);
  readonly orders$ = this.viewSubject.asObservable();

  private readyPromise: Promise<void> | null = null;

  constructor(
    private db: DatabaseService,
    private auth: AuthService,
    private vendors: VendorService
  ) {}

  ready(): Promise<void> {
    if (!this.readyPromise) this.readyPromise = this.load();
    return this.readyPromise;
  }

  private async load(): Promise<void> {
    await this.db.ready();
    const stored = await this.db.getJson<PlatformOrder[] | null>(this.db.ordersKey(), null);

    if (stored && Array.isArray(stored) && stored.length) {
      this.orders = stored;
    } else {
      this.orders = OrderService.seedOrders();
      await this.db.setJson(this.db.ordersKey(), this.orders);
      console.info('[Orders] Seeded the shared order ledger.');
    }
    await this.linkSeededCustomers();
    this.emit();
  }

  /**
   * The seed writes placeholder customer ids (`user_seed_N`) because it has
   * no access to the account table. `getOrders()` filters on the real
   * `user.id`, so without this pass the shopper's own ledger would always
   * look empty even though their demo orders are sitting right there.
   *
   * Resolves the demo contact into the real account id and rewrites the
   * placeholder — same first-run heal VendorService uses to claim its stores.
   * Only placeholder ids are touched, so orders a shopper placed themselves
   * (which already carry a real id) are never rewritten.
   */
  private async linkSeededCustomers(): Promise<void> {
    const placeholders = this.orders.filter(
      o => o.customerId.startsWith('user_seed_') || !!o.riderId?.startsWith('rider_seed_')
    );
    if (!placeholders.length) return;

    await this.auth.whenReady();
    const users = await this.auth.listUsers();
    // First run creates one account per role. Seeded rows carry fictional
    // demo contacts, so any contact without a dedicated account belongs to
    // the demo shopper — that keeps the tracking page rich on a fresh install.
    const shopper = users.find(u => u.role === 'customer')?.id ?? '';
    const rider = users.find(u => u.role === 'rider')?.id ?? '';
    const cache = new Map<string, string>();
    let changed = false;

    for (const order of placeholders) {
      if (order.customerId.startsWith('user_seed_')) {
        const contact = order.customerContact?.trim().toLowerCase();
        let id = contact ? cache.get(contact) : undefined;
        if (id === undefined) {
          const user = contact ? await this.auth.findUser(contact) : null;
          id = user?.id ?? shopper;
          if (contact) cache.set(contact, id);
        }
        if (id) {
          order.customerId = id;
          changed = true;
        }
      }
      // The rider app matches on the account id too — bind seeded runs to
      // the real rider so their history and earnings are populated.
      if (order.riderId?.startsWith('rider_seed_') && rider) {
        order.riderId = rider;
        changed = true;
      }
    }

    if (changed) await this.persist();
  }

  private persist(): Promise<void> {
    return this.db.setJson(this.db.ordersKey(), this.orders);
  }

  private emit(): void {
    this.allSubject.next(this.orders.map(o => ({ ...o })));
    this.viewSubject.next(
      this.getOrders()
    );
  }

  // ------------------------------------------------------------------
  // Reads
  // ------------------------------------------------------------------

  async all(): Promise<PlatformOrder[]> {
    await this.ready();
    return this.orders.map(o => ({ ...o }));
  }

  async findById(id: string): Promise<PlatformOrder | null> {
    await this.ready();
    const hit = this.orders.find(o => o.id === id);
    return hit ? { ...hit } : null;
  }

  /** Orders placed by the signed-in shopper. */
  forCustomer(customerId: string): PlatformOrder[] {
    return this.orders
      .filter(o => o.customerId === customerId)
      .map(o => ({ ...o }))
      .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  }

  /** Orders flowing into a store (vendor inbox). */
  forVendor(vendorId: string): PlatformOrder[] {
    return this.orders
      .filter(o => o.vendorId === vendorId)
      .map(o => ({ ...o }))
      .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  }

  /** Unclaimed deliveries a rider can accept — ready and not yet assigned. */
  availableOffers(): PlatformOrder[] {
    return this.orders
      .filter(o => o.status === 'ready' && !o.riderId)
      .map(o => ({ ...o }))
      .sort((a, b) => a.placedAt.localeCompare(b.placedAt));
  }

  /** Everything assigned to a rider (active job first). */
  forRider(riderId: string): PlatformOrder[] {
    return this.orders
      .filter(o => o.riderId === riderId)
      .map(o => ({ ...o }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  // ------------------------------------------------------------------
  // Customer projection (tracking tabs)
  // ------------------------------------------------------------------

  getOrders(): OrderItem[] {
    const user = this.auth.currentUser;
    if (!user) return [];
    return this.orders
      .filter(o => o.customerId === user.id)
      .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
      .map(o => OrderService.toView(o));
  }

  private static toView(o: PlatformOrder): OrderItem {
    const bucket = customerBucket(o);
    const summary = o.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

    const present =
      bucket === 'delivered'
        ? { badgeText: 'Delivered', badgeColorClass: 'emerald', actionText: 'Rate & Review', actionHandler: 'openReviewModal' }
        : bucket === 'topay'
          ? { badgeText: 'Awaiting Payment', badgeColorClass: 'amber', actionText: 'Pay Now', actionHandler: 'payNow' }
          : bucket === 'refunds'
            ? { badgeText: o.status === 'declined' ? 'Declined' : 'Cancelled', badgeColorClass: 'rose', actionText: 'View Refund', actionHandler: 'viewRefund' }
            : { badgeText: STATUS_LABEL[o.status], badgeColorClass: 'amber', actionText: 'Track Rider', actionHandler: 'openMapModal' };

    return {
      id: o.id,
      store: o.vendorName,
      item: summary,
      price: `\u20b1${o.total.toFixed(2)}`,
      image: o.items[0]?.image || 'assets/images/corndog.jpg',
      status: bucket,
      badgeText: present.badgeText,
      badgeColorClass: present.badgeColorClass,
      actionText: present.actionText,
      actionHandler: present.actionHandler,
      iconClass: 'fa-solid fa-location-dot',
      createdAt: o.placedAt,
      orderId: o.id,
      orderCode: o.code,
    };
  }

  // ------------------------------------------------------------------
  // Customer: place an order (split by store, like a marketplace)
  // ------------------------------------------------------------------

  async placeOrder(input: {
    items: OrderLine[];
    paymentMethod: PaymentMethod;
    dropoffBuilding: string;
    dropoffLandmark: string;
  }): Promise<PlatformOrder[]> {
    await this.ready();
    const user = this.auth.currentUser;
    if (!user || !input.items.length) return [];

    const storeIds = [...new Set(input.items.map(i => i.vendorId).filter(Boolean))] as string[];
    const groups: Array<{ vendorId: string; lines: OrderLine[] }> = (
      storeIds.length ? storeIds : ['red-eagle-nook']
    ).map(vendorId => ({ vendorId, lines: input.items.filter(i => i.vendorId === vendorId) }));
    // Anything carted before vendors existed belongs to the default store.
    if (!storeIds.length) groups[0].lines = input.items;

    // Split the delivery fee evenly across the stores being ordered from.
    const fee = Math.round((DEFAULT_DELIVERY_FEE / groups.length) * 100) / 100;
    const created: PlatformOrder[] = [];

    for (const group of groups) {
      const store = await this.vendors.findById(group.vendorId);
      const subtotal = group.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
      const deliveryFee = fee;
      const id = `ord_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

      created.push({
        id,
        code: OrderService.makeCode(id),
        customerId: user.id,
        customerName: user.name,
        customerContact: user.identifier,
        vendorId: group.vendorId,
        vendorName: store?.name ?? 'Food Eagle Partner',
        items: group.lines.map(l => ({ ...l, vendorId: undefined })),
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        paymentMethod: input.paymentMethod,
        paid: input.paymentMethod === 'wallet' || input.paymentMethod === 'card',
        status: 'placed',
        riderId: null,
        riderName: null,
        pickupSpot: store?.spot ?? 'Main Canteen',
        dropoffBuilding: input.dropoffBuilding,
        dropoffLandmark: input.dropoffLandmark,
        commission: Math.round(subtotal * PLATFORM_COMMISSION_RATE * 100) / 100,
        placedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [],
      });
      const latest = created[created.length - 1];
      latest.history = [{ status: 'placed', at: latest.placedAt, by: 'customer' }];
    }

    this.orders = [...created.reverse(), ...this.orders];
    await this.persist();
    this.emit();
    return created;
  }

  // ------------------------------------------------------------------
  // Status transitions
  // ------------------------------------------------------------------

  /** Legal moves. Anything not listed here is rejected. */
  private static readonly TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    placed: ['confirmed', 'declined', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['picked_up', 'cancelled'],
    picked_up: ['delivering'],
    delivering: ['delivered'],
    delivered: [],
    declined: [],
    cancelled: [],
  };

  static canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return (OrderService.TRANSITIONS[from] ?? []).includes(to);
  }

  async transition(
    id: string,
    next: OrderStatus,
    by: 'customer' | 'vendor' | 'rider' | 'system',
    note?: string
  ): Promise<{ ok: boolean; error?: string; order?: PlatformOrder }> {
    await this.ready();
    const order = this.orders.find(o => o.id === id);
    if (!order) return { ok: false, error: 'Order not found.' };

    if (!OrderService.canTransition(order.status, next)) {
      return { ok: false, error: `Cannot go from ${order.status} to ${next}.` };
    }

    const at = new Date().toISOString();
    const event: StatusEvent = { status: next, at, by };
    if (note) event.note = note;

    order.status = next;
    order.updatedAt = at;
    order.history = [...order.history, event];

    if (next === 'declined') order.declineReason = note ?? 'Vendor unavailable';
    // Cash orders settle the moment the food is handed to the rider.
    if (next === 'delivering' && order.paymentMethod === 'cod') order.paid = true;

    await this.persist();
    this.emit();
    return { ok: true, order: { ...order } };
  }

  /** Rider claims a ready delivery (assigns the rider and moves it to picked_up). */
  async acceptDelivery(orderId: string, riderId: string, riderName: string): Promise<{ ok: boolean; error?: string }> {
    await this.ready();
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return { ok: false, error: 'Order not found.' };
    if (order.riderId) return { ok: false, error: 'Another rider already claimed this delivery.' };
    if (order.status !== 'ready') return { ok: false, error: 'This delivery is no longer available.' };

    const at = new Date().toISOString();
    order.riderId = riderId;
    order.riderName = riderName;
    order.status = 'picked_up';
    order.updatedAt = at;
    order.history = [
      ...order.history,
      { status: 'picked_up', at, by: 'rider', note: `Picked up by ${riderName}` },
    ];

    await this.persist();
    this.emit();
    return { ok: true };
  }

  async markPaid(id: string): Promise<void> {
    const order = this.orders.find(o => o.id === id);
    if (!order) return;
    order.paid = true;
    order.updatedAt = new Date().toISOString();
    await this.persist();
    this.emit();
  }

  async setReview(id: string, rating: number, text: string): Promise<void> {
    const order = this.orders.find(o => o.id === id);
    if (!order) return;
    order.review = { rating, text };
    order.updatedAt = new Date().toISOString();
    await this.persist();
    this.emit();
  }

  // ------------------------------------------------------------------
  // Reporting helpers (vendor + admin dashboards)
  // ------------------------------------------------------------------

  stats(orders: PlatformOrder[]): OrderStats {
    const settled = orders.filter(o => o.status !== 'cancelled' && o.status !== 'declined');
    return {
      total: orders.length,
      active: orders.filter(o => isActiveStatus(o.status)).length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled' || o.status === 'declined').length,
      revenue: Math.round(settled.reduce((sum, o) => sum + o.total, 0) * 100) / 100,
    };
  }

  /** Vendor payout on delivered orders, after the platform commission. */
  vendorPayout(orders: PlatformOrder[], vendorId: string): number {
    return Math.round(
      orders
        .filter(o => o.vendorId === vendorId && o.status === 'delivered')
        .reduce((sum, o) => sum + (o.subtotal - o.commission), 0) * 100
    ) / 100;
  }

  private static makeCode(id: string): string {
    const digits = id.replace(/\D/g, '');
    const n = Number(digits.slice(-4)) || Math.floor(Math.random() * 9000) + 1000;
    return `FE-${String(n).padStart(4, '0')}`;
  }

  // ------------------------------------------------------------------
  // First-run seed
  // ------------------------------------------------------------------

  static seedOrders(): PlatformOrder[] {
    const iso = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3600_000).toISOString();

    const store = {
      red: { vendorId: 'red-eagle-nook', vendorName: 'The Red Eagle Nook', pickupSpot: 'Main Canteen' },
      yan: { vendorId: 'yanfayes', vendorName: 'yanfayes', pickupSpot: 'Food Court' },
      ddk: { vendorId: 'ddk-corner', vendorName: 'DDK Corner', pickupSpot: 'Student Center Food Hub' },
    };

    const line = (itemId: string, name: string, price: number, quantity: number, image: string): OrderLine =>
      ({ itemId, name, price, quantity, image });

    const specs: Array<Partial<PlatformOrder>> = [
      {
        ...store.red,
        customerName: 'Campus Student', customerContact: 'student.demo@gmail.com',
        items: [line('1', 'Spanish Latte', 100, 2, 'assets/images/spanish-latte.jpe')],
        status: 'placed', paid: false, paymentMethod: 'cod',
        placedAt: iso(0.2), updatedAt: iso(0.2),
        subtotal: 200, deliveryFee: 25, total: 225, commission: 20,
      },
      {
        ...store.yan,
        customerName: 'Miguel Torres', customerContact: 'miguel.demo@gmail.com',
        items: [line('10', 'Sizzling Pork Sisig', 60, 3, 'assets/images/sisig.jpg')],
        status: 'confirmed', paid: true, paymentMethod: 'wallet',
        placedAt: iso(0.6), updatedAt: iso(0.3),
        subtotal: 180, deliveryFee: 25, total: 205, commission: 18,
      },
      {
        ...store.ddk,
        customerName: 'Angela Lim', customerContact: 'angela.demo@gmail.com',
        items: [
          line('12', 'Turon', 7, 4, 'assets/images/turon.jpg'),
          line('13', 'Yakult', 10, 4, 'assets/images/yakult.jpg'),
        ],
        status: 'preparing', paid: true, paymentMethod: 'cod',
        placedAt: iso(1.1), updatedAt: iso(0.8),
        subtotal: 68, deliveryFee: 25, total: 93, commission: 6.8,
      },
      {
        ...store.red,
        customerName: 'Kenneth Uy', customerContact: 'kenneth.demo@gmail.com',
        items: [line('6', 'Chicken Thigh Plate', 70, 2, 'assets/images/chicken_thigh.jpg')],
        status: 'ready', paid: false, paymentMethod: 'cod',
        placedAt: iso(1.5), updatedAt: iso(0.4),
        subtotal: 140, deliveryFee: 25, total: 165, commission: 14,
      },
      {
        ...store.yan,
        customerName: 'Bea Ramos', customerContact: 'bea.demo@gmail.com',
        items: [line('10', 'Sizzling Pork Sisig', 60, 1, 'assets/images/sisig.jpg')],
        status: 'delivering', paid: true, paymentMethod: 'wallet',
        placedAt: iso(2.4), updatedAt: iso(0.5),
        riderId: 'rider_seed_juan', riderName: 'Juan Dela Cruz',
        subtotal: 60, deliveryFee: 25, total: 85, commission: 6,
      },
      {
        ...store.red,
        customerName: 'Rico Diaz', customerContact: 'rico.demo@gmail.com',
        items: [line('1', 'Spanish Latte', 100, 2, 'assets/images/spanish-latte.jpe')],
        status: 'delivered', paid: true, paymentMethod: 'wallet',
        placedAt: iso(6), updatedAt: iso(5),
        riderId: 'rider_seed_juan', riderName: 'Juan Dela Cruz',
        subtotal: 200, deliveryFee: 25, total: 225, commission: 20,
      },
      {
        ...store.ddk,
        customerName: 'Lara Cruz', customerContact: 'lara.demo@gmail.com',
        items: [line('12', 'Turon', 7, 5, 'assets/images/turon.jpg')],
        status: 'delivered', paid: true, paymentMethod: 'cod',
        placedAt: iso(26), updatedAt: iso(25),
        riderId: 'rider_seed_maria', riderName: 'Maria Santos',
        subtotal: 35, deliveryFee: 25, total: 60, commission: 3.5,
      },
      {
        ...store.red,
        customerName: 'Paolo Mendoza', customerContact: 'paolo.demo@gmail.com',
        items: [line('9', 'Coffee Jelly', 10, 3, 'assets/images/coffee_jelly.jpg')],
        status: 'declined', paid: false, paymentMethod: 'cod',
        placedAt: iso(30), updatedAt: iso(29.8),
        declineReason: 'Sold out for the day',
        subtotal: 30, deliveryFee: 25, total: 55, commission: 3,
      },
    ];

    return specs.map((over, i) => {
      const history: StatusEvent[] = [];
      const order: PlatformOrder = {
        id: `ord_seed_${i + 1}`,
        code: `FE-${1000 + i * 137}`,
        customerId: `user_seed_${i + 1}`,
        customerContact: 'student.demo@gmail.com',
        dropoffBuilding: 'CICS',
        dropoffLandmark: 'Near main entrance',
        review: undefined,
        ...over,
      } as PlatformOrder;
      order.history = [
        { status: 'placed', at: order.placedAt, by: 'customer' },
        ...(history as StatusEvent[]),
      ];
      return order;
    });
  }
}

// ---------------------------------------------------------------------------
// Customer-facing view model (keeps the tracking tabs working unchanged)
// ---------------------------------------------------------------------------

export interface OrderItem {
  id: string;
  store: string;
  item: string;
  price: string;
  image: string;
  status: 'topay' | 'toreceive' | 'delivered' | 'refunds';
  badgeText: string;
  badgeColorClass: string;
  actionText: string;
  actionHandler: string;
  iconClass: string;
  createdAt?: string;
  /** Ledger id — also what `id` points at. */
  orderId: string;
  orderCode: string;
}