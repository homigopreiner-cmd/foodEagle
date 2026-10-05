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
import { AuthService } from '../../services/auth.service';
import { UserDataService } from '../../services/user-data.service';

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
      });

      if (!result.ok) {
        if (result.code === 'exists') {
          this.contactError = result.error;
        } else {
          this.formError = result.error;
        }
        return;
      }

      // Signed in + data document ready; next step is pinning a location.
      await this.userData.loadForUser(result.user.id);
      this.router.navigate(['/location-setup'], { replaceUrl: true });
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

  async showTerms() {
    const alert = await this.alertController.create({
      header: 'Terms and Conditions',
      message: 'Welcome to Food Eagle! By creating an account, you agree to abide by campus food delivery guidelines, respect delivery riders, and provide accurate real-time location details for seamless order processing.',
      buttons: ['OK']
    });

    await alert.present();
  }
}