import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { logoTiktok, personOutline, lockClosedOutline } from 'ionicons/icons';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tiktok-signup',
  templateUrl: './tiktok-signup.page.html',
  styleUrls: ['./tiktok-signup.page.scss'],
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
export class TiktokSignupPage implements OnInit {
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
    addIcons({ logoTiktok, personOutline, lockClosedOutline });
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
        provider: 'tiktok',
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