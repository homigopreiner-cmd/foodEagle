import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent]
})
export class SplashPage {
  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  async continue() {
    await this.auth.whenReady();
    if (this.auth.isAuthenticated) {
      // Return each account to the app it belongs to — a rider goes to the
      // rider app, an admin to the console, a shopper to the storefront.
      this.router.navigate([this.auth.homePath], { replaceUrl: true });
    } else {
      this.router.navigate(['/walkthrough'], { replaceUrl: true });
    }
  }
}