import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonTabs, IonRouterOutlet, IonTabBar } from '@ionic/angular';
import { NavItem } from '../curved-bottom-nav/curved-bottom-nav.component';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [CommonModule, IonTabs, IonRouterOutlet, IonTabBar]
})
export class TabsPage {
  activeTab: number = 0;

  constructor(private router: Router) {}

  onTabChange(event: { index: number; item: NavItem }) {
    this.activeTab = event.index;
    const id = event.item?.id;

    if (id === 'dashboard' || id === 'home') {
      this.router.navigate(['/dashboard']);
    } else if (id === 'profile') {
      this.router.navigate(['/profile-hub']);
    } else if (id === 'search' || id === 'add') {
      this.router.navigate(['/search']);
    } else if (id === 'orders') {
      this.router.navigate(['/orders']);
    } else if (id === 'favorites') {
      this.router.navigate(['/favorites']);
    }
  }
}