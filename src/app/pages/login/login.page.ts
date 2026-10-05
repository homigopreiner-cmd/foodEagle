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
import { AuthService } from '../../services/auth.service';
import { UserDataService } from '../../services/user-data.service';

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

      // First sign-in after signup goes through location setup;
      // returning users with a saved location go straight home.
      const hasLocation = !!this.userData.current.location;
      this.router.navigate([hasLocation ? '/dashboard' : '/location-setup'], { replaceUrl: true });
    } finally {
      this.isSubmitting = false;
    }
  }
}