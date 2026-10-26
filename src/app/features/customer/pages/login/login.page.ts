import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonInput, 
  IonButton, 
  IonIcon 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  logoBuffer, 
  logoFacebook, 
  logoTiktok, 
  logoGoogle, 
  mailOutline, 
  lockClosedOutline,
  arrowForwardOutline,
  arrowBack 
} from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { UserDataService } from '../../../../core/services/user-data.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink,
    IonContent, 
    IonInput, 
    IonButton, 
    IonIcon
  ]
})
export class LoginPage implements OnInit {
  identifier: string = '';
  password: string = '';
  identifierError: string = '';
  passwordError: string = '';
  loginError: string = '';
  isSubmitting: boolean = false;

  /**
   * One account per role, seeded on the very first run.
   *
   * Food Eagle is four apps sharing one login, so the sign-in screen is the
   * natural place to show how to reach each one during a demo.
   */
  readonly demoAccounts = [
    { role: 'Customer', identifier: 'customer.foodeagle@gmail.com', password: 'customer1234' },
    { role: 'Restaurant', identifier: 'vendor.foodeagle@gmail.com', password: 'vendor1234' },
    { role: 'Rider', identifier: 'rider.foodeagle@gmail.com', password: 'rider1234' },
    { role: 'Admin', identifier: 'admin.foodeagle@gmail.com', password: 'admin1234' },
  ];

  constructor(
    private router: Router,
    private auth: AuthService,
    private userData: UserDataService
  ) {
    addIcons({ 
      logoBuffer, 
      logoFacebook, 
      logoTiktok, 
      logoGoogle, 
      mailOutline, 
      lockClosedOutline,
      arrowForwardOutline,
      arrowBack 
    });
  }

  ngOnInit() { }

  goBack() {
    this.router.navigate(['/walkthrough']);
  }

  /** Tapping a demo row fills the form so the demo keeps flowing. */
  useDemo(account: { identifier: string; password: string }): void {
    this.identifier = account.identifier;
    this.password = account.password;
    this.identifierError = '';
    this.passwordError = '';
    this.loginError = '';
  }

  validateIdentifier() {
    const val = this.identifier.trim();
    this.loginError = '';

    if (!val) {
      this.identifierError = '';
      return;
    }

    const error = AuthService.validateIdentifier(val);
    // Live feedback covers format problems; "account not found" is
    // checked on submit against the user database.
    this.identifierError = error ?? '';
  }

  async onLogin() {
    if (this.isSubmitting) return;
    this.identifierError = '';
    this.passwordError = '';
    this.loginError = '';

    if (!this.identifier.trim()) {
      this.identifierError = 'Enter your email or phone number.';
      return;
    }
    if (!this.password) {
      this.passwordError = 'Enter your password.';
      return;
    }

    this.isSubmitting = true;
    try {
      const result = await this.auth.login(this.identifier, this.password);
      if (!result.ok) {
        if (result.code === 'wrong-password') {
          this.passwordError = result.error;
        } else {
          this.identifierError = result.code === 'not-found' || result.code === 'legacy' ? '' : this.identifierError;
          this.loginError = result.error;
        }
        return;
      }

      // Load this user's data (location, favorites, orders...).
      await this.userData.loadForUser(result.user.id);

      // Every account belongs to an app. Shoppers who have never pinned a
      // delivery spot still pass through location setup first; vendors,
      // riders and admins go straight to their own console.
      const hasLocation = !!this.userData.current.location;
      const home =
        result.user.role === 'customer' && !hasLocation
          ? '/location-setup'
          : this.auth.homePath;
      this.router.navigate([home], { replaceUrl: true });
    } finally {
      this.isSubmitting = false;
    }
  }
}