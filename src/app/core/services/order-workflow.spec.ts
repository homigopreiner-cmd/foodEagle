import { describe, expect, it } from 'vitest';
import {
  customerBucket,
  isActiveStatus,
  OrderStatus,
  pesos,
  PLATFORM_COMMISSION_RATE,
} from '../models/platform.model';
import { OrderService } from './order.service';

/**
 * The order state machine is the one piece of logic in the platform that
 * every app depends on: a vendor cannot mark an order delivered, a rider
 * cannot claim an order the kitchen has not finished, and a customer
 * cannot cancel something already on the road.
 *
 * These tests pin those invariants down.
 */
describe('order workflow', () => {
  describe('transition table', () => {
    it('allows the full happy path from placed to delivered', () => {
      const path: OrderStatus[] = ['confirmed', 'preparing', 'ready', 'picked_up', 'delivering', 'delivered'];

      let current: OrderStatus = 'placed';
      for (const next of path) {
        expect(OrderService.canTransition(current, next), `${current} -> ${next}`).toBe(true);
        current = next;
      }
    });

    it('lets a vendor refuse an order that was just placed', () => {
      expect(OrderService.canTransition('placed', 'declined')).toBe(true);
    });

    it('lets a customer cancel before the kitchen starts', () => {
      expect(OrderService.canTransition('placed', 'cancelled')).toBe(true);
      expect(OrderService.canTransition('confirmed', 'cancelled')).toBe(true);
      expect(OrderService.canTransition('preparing', 'cancelled')).toBe(true);
    });

    it('stops a customer cancelling once a rider has the food', () => {
      expect(OrderService.canTransition('picked_up', 'cancelled')).toBe(false);
      expect(OrderService.canTransition('delivering', 'cancelled')).toBe(false);
    });

    it('never lets a skipped step through', () => {
      expect(OrderService.canTransition('placed', 'delivered')).toBe(false);
      expect(OrderService.canTransition('placed', 'picked_up')).toBe(false);
      expect(OrderService.canTransition('confirmed', 'ready')).toBe(false);
      expect(OrderService.canTransition('preparing', 'delivering')).toBe(false);
    });

    it('treats terminal states as final', () => {
      for (const terminal of ['delivered', 'declined', 'cancelled'] as const) {
        for (const next of ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivering'] as const) {
          expect(OrderService.canTransition(terminal, next), `${terminal} -> ${next}`).toBe(false);
        }
      }
    });
  });

  describe('customer buckets', () => {
    it('files unpaid orders under To Pay', () => {
      expect(customerBucket({ status: 'placed', paid: false })).toBe('topay');
    });

    it('moves a paid order into To Receive while it is still being worked', () => {
      expect(customerBucket({ status: 'placed', paid: true })).toBe('toreceive');
      expect(customerBucket({ status: 'preparing', paid: true })).toBe('toreceive');
      expect(customerBucket({ status: 'delivering', paid: true })).toBe('toreceive');
    });

    it('files completed orders under Delivered', () => {
      expect(customerBucket({ status: 'delivered', paid: true })).toBe('delivered');
    });

    it('files refused and cancelled orders under Refunds', () => {
      expect(customerBucket({ status: 'declined', paid: false })).toBe('refunds');
      expect(customerBucket({ status: 'cancelled', paid: true })).toBe('refunds');
    });
  });

  describe('active status helper', () => {
    it('counts everything except settled and refused orders as active', () => {
      const active = ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivering'] as const;
      const finished = ['delivered', 'declined', 'cancelled'] as const;

      active.forEach(s => expect(isActiveStatus(s), s).toBe(true));
      finished.forEach(s => expect(isActiveStatus(s), s).toBe(false));
    });
  });

  describe('reporting', () => {
    const order = (over: Record<string, unknown>) => ({
      id: 'x', code: 'FE-1', customerId: 'c', customerName: 'C', customerContact: 'c',
      vendorId: 'v', vendorName: 'V', items: [], subtotal: 100, deliveryFee: 25, total: 125,
      paymentMethod: 'cod', paid: true, status: 'delivered', riderId: null, riderName: null,
      pickupSpot: 'Spot', dropoffBuilding: 'B', dropoffLandmark: 'L', commission: 10,
      placedAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T01:00:00.000Z', history: [],
      ...over,
    }) as never;

    it('excludes refused orders from revenue', () => {
      const service = Object.create(OrderService.prototype) as OrderService;
      const stats = service.stats([
        order({ status: 'delivered', total: 125 }),
        order({ status: 'declined', total: 999 }),
        order({ status: 'cancelled', total: 999 }),
        order({ status: 'preparing', total: 50 }),
      ]);

      expect(stats.total).toBe(4);
      expect(stats.active).toBe(1);
      expect(stats.delivered).toBe(1);
      expect(stats.cancelled).toBe(2);
      expect(stats.revenue).toBe(175);
    });

    it('computes the platform commission rate used for payouts', () => {
      expect(PLATFORM_COMMISSION_RATE).toBe(0.1);
      expect(Math.round(200 * PLATFORM_COMMISSION_RATE)).toBe(20);
    });
  });

  describe('peso formatting', () => {
    it('renders amounts with the peso sign and two decimals', () => {
      expect(pesos(1234.5)).toContain('1,234.50');
      expect(pesos(0)).toContain('0.00');
    });
  });
});