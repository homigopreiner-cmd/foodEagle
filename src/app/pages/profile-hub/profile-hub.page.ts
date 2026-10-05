import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AlertController,
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonIcon,
  IonRippleEffect, IonModal, IonInput
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  createOutline,
  locationOutline,
  notificationsOutline,
  lockClosedOutline,
  helpCircleOutline,
  logOutOutline,
  chevronForwardOutline,
  chevronBackOutline,
  cameraOutline,
  checkmarkOutline,
  closeOutline
} from 'ionicons/icons';
import { CurvedBottomNavComponent } from '../curved-bottom-nav/curved-bottom-nav.component';
import { AuthService, PublicUser } from '../../services/auth.service';
import { UserDataService } from '../../services/user-data.service';

interface MenuItem {
  icon: string;
  title: string;
  hint: string;
  route: string;
}

@Component({
  selector: 'app-profile-hub',
  templateUrl: './profile-hub.page.html',
  styleUrls: ['./profile-hub.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonBackButton, IonButton, IonIcon,
    IonRippleEffect, IonModal, IonInput,
    CurvedBottomNavComponent
  ]
})
export class ProfileHubPage implements OnInit, OnDestroy {

  userProfile = {
    name: 'Maria Santos',
    email: 'maria.santos@student.edu',
    contact: '09123456789',
    avatarUrl: 'https://ionicframework.com/docs/img/demos/avatar.svg'
  };

  editData = {
    name: '',
    email: '',
    contact: '',
    avatarUrl: ''
  };

  isEditModalOpen = false;
  isSaving: boolean = false;
  editError: string = '';

  private authSub?: Subscription;

  // One list drives the whole menu (no duplicated "quick actions")
  menuItems: MenuItem[] = [
    { icon: 'location-outline',      title: 'Saved addresses', hint: 'Your campus delivery spots', route: 'saved-addresses' },
    { icon: 'notifications-outline', title: 'Notifications',   hint: 'Order updates and alerts',   route: 'notification-center' },
    { icon: 'lock-closed-outline',   title: 'Security',        hint: 'Password and sign-in',       route: 'security' },
    { icon: 'help-circle-outline',   title: 'Help center',     hint: 'FAQs and support',           route: 'help-center' }
  ];

  constructor(
    private router: Router,
    private auth: AuthService,
    private userData: UserDataService,
    private alertController: AlertController
  ) {
    addIcons({
      'create-outline': createOutline,
      'location-outline': locationOutline,
      'notifications-outline': notificationsOutline,
      'lock-closed-outline': lockClosedOutline,
      'help-circle-outline': helpCircleOutline,
      'log-out-outline': logOutOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'chevron-back-outline': chevronBackOutline,
      'camera-outline': cameraOutline,
      'checkmark-outline': checkmarkOutline,
      'close-outline': closeOutline
    });
  }

  ngOnInit() {
    // The signed-in account is the single source of truth.
    this.applyUser(this.auth.currentUser);
    this.authSub = this.auth.currentUser$.subscribe(user => this.applyUser(user));
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }

  private applyUser(user: PublicUser | null) {
    if (!user) return;
    this.userProfile = {
      name: user.name,
      email: user.email,
      contact: user.identifier,
      avatarUrl: user.avatarUrl || this.userProfile.avatarUrl
    };
  }

  navigateTo(route: string) {
    this.router.navigate([`/${route}`]);
  }

  openEditModal() {
    this.editData = { ...this.userProfile };
    this.editError = '';
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Log out',
      message: 'Your profile, addresses, favorites and orders stay saved in your account. Log back in anytime to pick up where you left off.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Log out', role: 'destructive' }
      ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'destructive') return;

    await this.auth.logout();
    await this.userData.unload();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  async saveProfile() {
    if (this.isSaving) return;
    this.editError = '';

    // An emptied contact field keeps the current one (it's the login identifier).
    const contact = (this.editData.contact || '').trim() || this.userProfile.contact;
    if (contact !== this.userProfile.contact) {
      const error = AuthService.validateIdentifier(contact);
      if (error) {
        this.editError = error;
        return;
      }
    }

    this.isSaving = true;
    try {
      const result = await this.auth.updateProfile({
        name: this.editData.name,
        contact,
        email: this.editData.email,
        avatarUrl: this.editData.avatarUrl
      });

      if (!result.ok) {
        this.editError = result.error;
        return;
      }
      this.isEditModalOpen = false;
    } finally {
      this.isSaving = false;
    }
  }

  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.editData.avatarUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
}