import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  closeCircle,
  close,
  add,
  remove,
  arrowBack,
  layersOutline,
  walletOutline,
  bicycleOutline,
  bicycle,
  checkmarkCircle,
  checkmarkCircleOutline,
  returnUpBackOutline,
  storefrontOutline,
  receiptOutline,
  restaurantOutline,
  homeOutline,
  star,
  locationOutline,
  navigateOutline,
  compassOutline,
  timeOutline,
  cardOutline,
  cashOutline,
  fastFoodOutline
} from 'ionicons/icons';
import { OrderService, OrderItem } from '../../services/order.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tracking-and-delivery',
  templateUrl: './tracking-and-delivery.page.html',
  styleUrls: ['./tracking-and-delivery.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, RouterLink]
})
export class TrackingAndDeliveryPage implements OnInit {
  searchQuery: string = '';
  currentActiveTab: string = 'all';

  // Tabs config (icons are Ionicons names)
  readonly tabs = [
    { key: 'all',       label: 'All',        icon: 'layers-outline' },
    { key: 'topay',     label: 'To Pay',     icon: 'wallet-outline' },
    { key: 'toreceive', label: 'To Receive', icon: 'bicycle-outline' },
    { key: 'delivered', label: 'Delivered',  icon: 'checkmark-circle-outline' },
    { key: 'refunds',   label: 'Refunds',    icon: 'return-up-back-outline' }
  ];

  // Modals state
  isMapModalOpen: boolean = false;
  isReviewModalOpen: boolean = false;
  isPaymentModalOpen: boolean = false;
  isRefundModalOpen: boolean = false;

  // Selected Order for Modal Context
  selectedOrder: OrderItem | null = null;

  // Payment Selection state
  selectedPaymentMethod: string = 'gcash';

  // Map Zoom state
  mapScale: number = 1;

  // Rating & Review state
  currentRating: number = 0;
  reviewText: string = '';

  orders: OrderItem[] = [];
  filteredOrders: OrderItem[] = [];

  private ordersSub?: Subscription;

  constructor(private orderService: OrderService) {
    addIcons({
      searchOutline,
      closeCircle,
      close,
      add,
      remove,
      arrowBack,
      layersOutline,
      walletOutline,
      bicycleOutline,
      bicycle,
      checkmarkCircle,
      checkmarkCircleOutline,
      returnUpBackOutline,
      storefrontOutline,
      receiptOutline,
      restaurantOutline,
      homeOutline,
      star,
      locationOutline,
      navigateOutline,
      compassOutline,
      timeOutline,
      cardOutline,
      cashOutline,
      fastFoodOutline
    });
  }

  ngOnInit() {
    // Orders come from the user's persisted order history.
    this.orders = this.orderService.getOrders();
    this.ordersSub = this.orderService.orders$.subscribe(orders => {
      this.orders = orders;
      this.filterOrders();
    });
    this.filterOrders();
  }

  ngOnDestroy() {
    this.ordersSub?.unsubscribe();
  }

  loadOrders() {
    this.orders = this.orderService.getOrders();
    this.filterOrders();
  }

  switchTab(tab: string): void {
    this.currentActiveTab = tab;
    this.filterOrders();
  }

  filterOrders(): void {
    let result = this.orders;

    if (this.currentActiveTab !== 'all') {
      result = result.filter(order => order.status === this.currentActiveTab);
    }

    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(order =>
        order.store.toLowerCase().includes(query) ||
        order.item.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query)
      );
    }

    this.filteredOrders = result;
  }

  getCount(status: string): number {
    if (status === 'all') return this.orders.length;
    return this.orders.filter(o => o.status === status).length;
  }

  // Maps the order's action handler to an Ionicon (replaces the old Font Awesome iconClass)
  getActionIcon(handlerName: string): string {
    switch (handlerName) {
      case 'openMapModal':    return 'navigate-outline';
      case 'openReviewModal': return 'star';
      case 'payNow':          return 'wallet-outline';
      case 'viewRefund':      return 'receipt-outline';
      default:                return 'receipt-outline';
    }
  }

  handleAction(order: OrderItem, handlerName: string): void {
    this.selectedOrder = order;
    switch (handlerName) {
      case 'openMapModal':
        this.openMapModal();
        break;
      case 'openReviewModal':
        this.openReviewModal();
        break;
      case 'payNow':
        this.isPaymentModalOpen = true;
        break;
      case 'viewRefund':
        this.isRefundModalOpen = true;
        break;
      default:
        console.warn(`No handler defined for: ${handlerName}`);
    }
  }

  openMapModal(): void {
    this.mapScale = 1;
    this.isMapModalOpen = true;
  }
  closeMapModal(): void {
    this.mapScale = 1;
    this.isMapModalOpen = false;
  }

  zoomIn(): void {
    if (this.mapScale < 3) {
      this.mapScale += 0.5;
    }
  }

  zoomOut(): void {
    if (this.mapScale > 1) {
      this.mapScale -= 0.5;
    }
  }

  openReviewModal(): void { this.isReviewModalOpen = true; }
  closeReviewModal(): void {
    this.isReviewModalOpen = false;
    this.currentRating = 0;
    this.reviewText = '';
  }
  closePaymentModal(): void { this.isPaymentModalOpen = false; }
  closeRefundModal(): void { this.isRefundModalOpen = false; }

  async confirmPayment(): Promise<void> {
    if (this.selectedOrder) {
      // Persisted immediately — the status survives restarts.
      await this.orderService.updateOrder(this.selectedOrder.id, {
        status: 'toreceive',
        badgeText: 'On Delivery',
        badgeColorClass: 'amber',
        actionText: 'Track Rider',
        actionHandler: 'openMapModal',
        iconClass: 'fa-solid fa-location-dot'
      });
    }
    this.isPaymentModalOpen = false;
    this.filterOrders();
  }

  setRating(rating: number): void { this.currentRating = rating; }
  async submitReview(): Promise<void> {
    if (this.selectedOrder) {
      await this.orderService.updateOrder(this.selectedOrder.id, {
        status: 'delivered',
        badgeText: 'Delivered',
        badgeColorClass: 'emerald',
        actionText: 'Rate & Review',
        actionHandler: 'openReviewModal',
        iconClass: 'fa-solid fa-star'
      });
    }
    this.closeReviewModal();
    this.filterOrders();
  }
}