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
  keyOutline, 
  mailOutline, 
  phonePortraitOutline,
  arrowBackOutline,
  arrowForwardOutline 
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
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
export class ForgotPasswordPage implements OnInit {
  inputVal: string = '';
  isInvalid: boolean = false;
  errorMessage: string = '';
  isPhoneInput: boolean = false;

  // Reset flow state
  step: 'identify' | 'reset' = 'identify';
  newPassword: string = '';
  confirmPassword: string = '';
  resetError: string = '';
  isSubmitting: boolean = false;
  resetSuccess: boolean = false;

  constructor(
    private router: Router,
    private auth: AuthService
  ) {
    addIcons({ 
      keyOutline, 
      mailOutline, 
      phonePortraitOutline,
      arrowBackOutline,
      arrowForwardOutline 
    });
  }

  ngOnInit() { }

  validateInput() {
    const val = this.inputVal.trim();
    this.errorMessage = '';
    
    if (!val) {
      this.isInvalid = false;
      this.isPhoneInput = false;
      return;
    }

    const error = AuthService.validateIdentifier(val);
    if (error) {
      this.isInvalid = true;
      this.errorMessage = error.replace('The number is invalid', 'The phone number is not valid').replace('Email address must end with @gmail.com.', 'The email address is not valid');
      return;
    }

    this.isInvalid = false;
    this.errorMessage = '';
    this.isPhoneInput = /^\d+$/.test(val);
  }

  /** Step 1 → Step 2: make sure the identifier belongs to a real account. */
  async sendResetCode() {
    if (this.isSubmitting) return;
    this.validateInput();
    if (this.isInvalid || !this.inputVal.trim()) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    try {
      const user = await this.auth.findUser(this.inputVal);
      if (!user) {
        this.isInvalid = true;
        this.errorMessage = 'No account found with this email or number.';
        return;
      }
      // Local database: no SMS/email is actually sent; the reset
      // happens right here on the next step.
      this.step = 'reset';
    } finally {
      this.isSubmitting = false;
    }
  }

  /** Step 2: set the new password and go back to login. */
  async confirmReset() {
    if (this.isSubmitting) return;
    this.resetError = '';

    if (this.newPassword !== this.confirmPassword) {
      this.resetError = 'Passwords do not match.';
      return;
    }

    this.isSubmitting = true;
    try {
      const result = await this.auth.resetPassword(this.inputVal, this.newPassword, this.confirmPassword);
      if (!result.ok) {
        this.resetError = result.error;
        return;
      }
      this.resetSuccess = true;
      setTimeout(() => {
        this.router.navigate(['/login'], { replaceUrl: true });
      }, 1200);
    } finally {
      this.isSubmitting = false;
    }
  }
}