import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonItem, 
  IonInput, 
  IonCheckbox, 
  IonButton, 
  IonIcon,
  AlertController 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logoBuffer, logoFacebook, logoTiktok, logoGoogle, arrowBack } from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { UserDataService } from '../../../../core/services/user-data.service';
import { ROLE_LABEL, UserRole } from '../../../../core/models/platform.model';

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.page.html',
  styleUrls: ['./create-account.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink,
    IonContent, 
    IonItem, 
    IonInput, 
    IonCheckbox, 
    IonButton, 
    IonIcon
  ]
})
export class CreateAccountPage implements OnInit {
  fullName: string = '';
  contactInput: string = '';
  password: string = '';
  agreedToTerms: boolean = false;
  
  contactError: string = '';
  passwordError: string = '';
  formError: string = '';
  isSubmitting: boolean = false;

  /**
   * Food Eagle is a marketplace, so signup also decides which of the four
   * apps this account can open: shopper, restaurant or rider. Admin
   * accounts are provisioned by the platform, never self-registered.
   */
  role: UserRole = 'customer';
  readonly roles: Array<{ value: UserRole; label: string }> = [
    { value: 'customer', label: 'Customer' },
    { value: 'vendor', label: 'Restaurant' },
    { value: 'rider', label: 'Rider' },
  ];

  constructor(
    private alertController: AlertController,
    private router: Router,
    private auth: AuthService,
    private userData: UserDataService
  ) {
    addIcons({ logoBuffer, logoFacebook, logoTiktok, logoGoogle, arrowBack });
  }

  ngOnInit() {}

  goBack() {
    this.router.navigate(['/walkthrough']);
  }

  isPureNumber(val: string): boolean {
    return /^\d+$/.test(val);
  }

  onContactInput(event: any) {
    const val = event.target.value || '';
    this.contactInput = val;
    const trimmed = val.trim();
    this.formError = '';

    if (trimmed === '') {
      this.contactError = '';
      return;
    }

    const error = AuthService.validateIdentifier(trimmed);
    this.contactError = error ?? '';
  }

  async validateAndCreate() {
    if (this.isSubmitting) return;

    const trimmedContact = this.contactInput.trim();

    // Trigger check one last time on submit
    this.onContactInput({ target: { value: trimmedContact } });
    this.passwordError = '';
    this.formError = '';

    if (this.contactError) {
      return;
    }
    if (!this.fullName.trim()) {
      this.formError = 'Please enter your full name.';
      return;
    }
    if (!this.agreedToTerms) {
      this.formError = 'Please agree to the Terms and Conditions.';
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
        name: this.fullName,
        identifier: trimmedContact,
        password: this.password,
        role: this.role,
      });

      if (!result.ok) {
        if (result.code === 'exists') {
          this.contactError = result.error;
        } else {
          this.formError = result.error;
        }
        return;
      }

      // Signed in + data document ready. Shoppers pin a delivery spot;
      // partners land straight in their own console.
      await this.userData.loadForUser(result.user.id);
      const next = result.user.role === 'customer' ? '/location-setup' : this.auth.homePath;
      this.router.navigate([next], { replaceUrl: true });
    } finally {
      this.isSubmitting = false;
    }
  }

  isFormValid(): boolean {
    return (
      this.fullName.trim() !== '' &&
      this.contactInput.trim() !== '' &&
      this.password.trim() !== '' &&
      this.agreedToTerms &&
      this.contactError === '' &&
      !this.isSubmitting
    );
  }

  labelFor(role: UserRole): string {
    return ROLE_LABEL[role];
  }

  async showTerms() {
    const alert = await this.alertController.create({
      header: 'Terms and Conditions',
      message: 'Welcome to Food Eagle! By creating an account, you agree to abide by campus food delivery guidelines, respect delivery riders, and provide accurate real-time location details for seamless order processing.',
      buttons: ['OK']
    });

    await alert.present();
  }
}