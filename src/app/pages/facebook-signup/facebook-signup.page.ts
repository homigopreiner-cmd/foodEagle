import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonButtons, 
  IonBackButton, 
  IonTitle, 
  IonInput, 
  IonButton, 
  IonIcon 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logoFacebook, personOutline, lockClosedOutline } from 'ionicons/icons';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-facebook-signup',
  templateUrl: './facebook-signup.page.html',
  styleUrls: ['./facebook-signup.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonHeader, 
    IonToolbar, 
    IonButtons, 
    IonBackButton, 
    IonTitle, 
    IonInput, 
    IonButton, 
    IonIcon,
    RouterLink
  ]
})
export class FacebookSignupPage implements OnInit {
  email: string = '';
  password: string = '';
  emailError: string = '';
  passwordError: string = '';
  formError: string = '';
  isSubmitting: boolean = false;

  constructor(
    private router: Router,
    private auth: AuthService
  ) {
    addIcons({ logoFacebook, personOutline, lockClosedOutline });
  }

  ngOnInit() { }

  onEmailInput() {
    this.emailError = '';
    this.formError = '';
    const val = this.email.trim();
    if (!val) return;
    const error = AuthService.validateIdentifier(val);
    this.emailError = error ?? '';
  }

  async onSignUp() {
    if (this.isSubmitting) return;
    this.emailError = '';
    this.passwordError = '';
    this.formError = '';

    const error = AuthService.validateIdentifier(this.email);
    if (error) {
      this.emailError = error;
      return;
    }
    const pwError = AuthService.validatePassword(this.password);
    if (pwError) {
      this.passwordError = pwError;
      return;
    }

    this.isSubmitting = true;
    try {
      const result = await this.auth.register({
        name: this.email.split('@')[0].replace(/[._-]+/g, ' ') || 'Food Eagle User',
        identifier: this.email,
        password: this.password,
        provider: 'facebook',
      });

      if (!result.ok) {
        this.formError = result.error;
        return;
      }
      this.router.navigate(['/otp'], { replaceUrl: true });
    } finally {
      this.isSubmitting = false;
    }
  }
}
