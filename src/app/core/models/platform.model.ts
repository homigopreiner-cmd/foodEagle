/**
 * Platform domain model.
 *
 * One set of types shared by all four apps in the product:
 *   customer  -> Place orders, track them, save favorites.
 *   vendor    -> Accept orders, cook them, manage the menu.
 *   rider     -> Pick up "ready" orders and deliver them.
 *   admin     -> Read-only oversight of everything + moderation.
 *
 * Every app talks to the SAME records (see core/services), which is what
 * makes a real multi-sided marketplace work: an order placed by a customer
 * is the very same row the vendor accepts, the rider delivers and the
 * admin reports on.
 */

// ---------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------

export type UserRole = 'customer' | 'vendor' | 'rider' | 'admin';

export const USER_ROLES: readonly UserRole[] = ['customer', 'vendor', 'rider', 'admin'] as const;

export const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Customer',
  vendor: 'Restaurant / Vendor',
  rider: 'Delivery Rider',
  admin: 'Administrator',
};

/** Where each role lands right after signing in. */
export const ROLE_HOME: Record<UserRole, string> = {
  customer: '/dashboard',
  vendor: '/vendor',
  rider: '/rider',
  admin: '/admin',
};

// ---------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------

export type FoodCategory = 'snacks' | 'drinks' | 'meals' | 'desserts' | 'popular';

export interface VendorProfile {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  /** Physical stall / spot on campus. */
  spot: string;
  logoUrl: string;
  heroUrl: string;
  /** Opening hours shown to customers. */
  hours: string;
  prepTime: string;
  rating: number;
  reviews: number;
  /** Vendor staff accounts allowed to manage this store. */
  ownerIdentifier: string | null;
  /** Admin approval — unapproved stores are hidden from customers. */
  approved: boolean;
  /** Vendor-controlled pause button: hides the store without losing data. */
  acceptingOrders: boolean;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  vendorId: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  rating: number;
  reviews: number;
  distance?: string;
  category: FoodCategory[];
  imageUrl: string;
  /** Per-item 86 button — sold out without unpublishing the store. */
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------

/**
 * Order state machine.
 *
 *   placed ──┬─> confirmed ──> preparing ──> ready ──> picked_up ──> delivering ──> delivered
 *            └─> declined (terminal, vendor refusal)
 *
 * The customer may cancel while the order is still `placed`.
 */
export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivering'
  | 'delivered'
  | 'declined'
  | 'cancelled';

/** Owner of the status transition — drives which app shows the button. */
export type OrderActor = 'customer' | 'vendor' | 'rider' | 'system';

export type PaymentMethod = 'cod' | 'wallet' | 'card';

export interface OrderLine {
  itemId: string;
  /** Owning store — a mixed cart gets split into one order per vendor. */
  vendorId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface StatusEvent {
  status: OrderStatus;
  at: string;
  by: OrderActor;
  note?: string;
}

export interface PlatformOrder {
  id: string;
  /** Short human-readable reference shown in every UI, e.g. FE-4821. */
  code: string;
  customerId: string;
  customerName: string;
  customerContact: string;
  vendorId: string;
  vendorName: string;
  items: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  /** False while the bill is still outstanding (cash-on-delivery orders settle on hand-off). */
  paid: boolean;
  status: OrderStatus;
  /** Assigned once a rider accepts the delivery. */
  riderId: string | null;
  riderName: string | null;
  pickupSpot: string;
  dropoffBuilding: string;
  dropoffLandmark: string;
  /** Flat commission taken by the platform from the vendor payout. */
  commission: number;
  placedAt: string;
  updatedAt: string;
  history: StatusEvent[];
  declineReason?: string;
  /** Set once the customer leaves a rating. */
  review?: { rating: number; text: string };
}

/** Order count rollups used by every dashboard. */
export interface OrderStats {
  total: number;
  active: number;
  delivered: number;
  cancelled: number;
  /** Net sales as `total` of every non-cancelled / non-refunded order. */
  revenue: number;
}

// ---------------------------------------------------------------------
// Riders
// ---------------------------------------------------------------------

export interface RiderProfile {
  id: string;
  name: string;
  contact: string;
  vehicle: string;
  plateNo: string;
  accountIdentifier: string | null;
  /** Compressed data-URL portrait the rider picks on their profile page. */
  photo?: string;
  /** False = parked; the rider stops appearing in the dispatch pool. */
  online: boolean;
  rating: number;
  completedDeliveries: number;
  totalEarnings: number;
  createdAt: string;
}

// ---------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------

export interface AppNotification {
  id: string;
  audience: UserRole | 'all';
  /** Optional narrowing — omit to broadcast to the whole role. */
  userId: string | null;
  title: string;
  body: string;
  icon: string;
  read: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

export const DEFAULT_DELIVERY_FEE = 25;
export const PLATFORM_COMMISSION_RATE = 0.1;

export function pesos(value: number): string {
  return `\u20b1${(Number(value) || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function isActiveStatus(status: OrderStatus): boolean {
  return status === 'placed' || status === 'confirmed' || status === 'preparing'
    || status === 'ready' || status === 'picked_up' || status === 'delivering';
}

/** Maps an order onto the customer-facing tracking tabs (To Pay / To Receive / ...). */
export function customerBucket(order: Pick<PlatformOrder, 'status' | 'paid'>): 'topay' | 'toreceive' | 'delivered' | 'refunds' {
  if (order.status === 'declined' || order.status === 'cancelled') return 'refunds';
  if (order.status === 'delivered') return 'delivered';
  // Anything still owed (cash orders before hand-off) sits in To Pay.
  if (!order.paid) return 'topay';
  return 'toreceive';
}

/** Human label for a status, used across all four apps. */
export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: 'Order placed',
  confirmed: 'Confirmed by vendor',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  picked_up: 'Picked up',
  delivering: 'Out for delivery',
  delivered: 'Delivered',
  declined: 'Declined by vendor',
  cancelled: 'Cancelled',
};