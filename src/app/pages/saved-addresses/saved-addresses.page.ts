import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, 
  IonButton, IonIcon, IonContent, IonCard, IonCardContent, 
  IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, 
  IonFooter, IonRow, IonCol 
} from '@ionic/angular';
import { UserDataService } from '../../services/user-data.service';

interface SavedLocation {
  id: string;
  building: string;
  landmark: string;
}

@Component({
  selector: 'app-saved-addresses',
  templateUrl: './saved-addresses.page.html',
  styleUrls: ['./saved-addresses.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, 
    IonButton, IonIcon, IonContent, IonCard, IonCardContent, 
    IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, 
    IonFooter, IonRow, IonCol
  ]
})
export class SavedAddressesPage implements OnInit, OnDestroy {
  selectedBuilding: string = 'CICS';
  
  roomDetails = {
    landmark: 'Near main entrance'
  };

  saveSuccess: boolean = false;
  savedAddressesList: SavedLocation[] = [];

  etaMinutes: number = 4;
  riderStatus: string = 'En route to building...';

  buildingCoordinates: { [key: string]: { top: string, left: string, eta: number } } = {
    'MAIN GATE': { top: '88%', left: '48%', eta: 1 },
    'CICS': { top: '38%', left: '88%', eta: 4 },
    'CIT': { top: '22%', left: '80%', eta: 5 },
    'COEA': { top: '30%', left: '82%', eta: 4 },
    'CHK': { top: '32%', left: '25%', eta: 3 },
    'CPAD': { top: '55%', left: '55%', eta: 2 },
    'CHASS/CNSM': { top: '84%', left: '70%', eta: 3 },
    'RED EAGLE GYM': { top: '38%', left: '40%', eta: 3 },
    'ROTUNDA': { top: '27%', left: '60%', eta: 3 },
    'OVAL': { top: '72%', left: '82%', eta: 4 },
    'SUNKEN COURT': { top: '62%', left: '52%', eta: 2 },
    'BVBALL COURT': { top: '65%', left: '62%', eta: 2 },
    'VBALL COURT': { top: '73%', left: '61%', eta: 3 },
    'SEPAK COURT': { top: '44%', left: '75%', eta: 3 },
    'TENNIS COURT': { top: '48%', left: '85%', eta: 3 },
    'BBALL COURT': { top: '82%', left: '38%', eta: 2 }
  };

  riderPosition = { top: '88%', left: '48%' };

  private docSub?: Subscription;

  constructor(
    private router: Router,
    private userData: UserDataService
  ) {}

  ngOnInit() {
    // Load the user's saved location + address history from the database.
    const doc = this.userData.current;
    if (doc.location) {
      this.selectedBuilding = doc.location.building;
      this.roomDetails = { landmark: doc.location.landmark };
    }
    this.savedAddressesList = doc.addresses.map(a => ({ id: a.id, building: a.building, landmark: a.landmark }));

    // Stay in sync if the document changes anywhere else in the app.
    this.docSub = this.userData.doc$.subscribe(updated => {
      this.savedAddressesList = updated.addresses.map(a => ({ id: a.id, building: a.building, landmark: a.landmark }));
    });

    this.updateDestination();
  }

  ngOnDestroy() {
    this.docSub?.unsubscribe();
  }

  onBuildingChange() {
    this.updateDestination();
  }

  updateDestination() {
    const dest = this.buildingCoordinates[this.selectedBuilding] || { top: '38%', left: '88%', eta: 4 };
    this.etaMinutes = dest.eta;
    this.riderStatus = `Rider heading to ${this.selectedBuilding}`;
    this.riderPosition = { top: dest.top, left: dest.left };
  }

  setLandmark(text: string) {
    this.roomDetails.landmark = text;
  }

  resetToDefaultPin() {
    this.updateDestination();
  }

  async saveDeliverySpot() {
    // Persist both the active delivery spot and the address list entry.
    await this.userData.setLocation(this.selectedBuilding, this.roomDetails.landmark);
    await this.userData.upsertAddress(this.selectedBuilding, this.roomDetails.landmark);

    const doc = this.userData.current;
    if (doc.location) {
      this.selectedBuilding = doc.location.building;
    }
    this.savedAddressesList = doc.addresses.map(a => ({ id: a.id, building: a.building, landmark: a.landmark }));

    this.saveSuccess = true;
    setTimeout(() => {
      this.saveSuccess = false;
    }, 3000);
  }

  async deleteAddress(address: SavedLocation, event: Event) {
    event.stopPropagation();
    await this.userData.removeAddress(address.id);
    this.savedAddressesList = this.userData.current.addresses.map(a => ({ id: a.id, building: a.building, landmark: a.landmark }));
  }

  selectSavedAddress(address: SavedLocation) {
    this.selectedBuilding = address.building;
    this.roomDetails.landmark = address.landmark;
    this.updateDestination();
  }

  isCurrentSelected(address: SavedLocation): boolean {
    return this.selectedBuilding === address.building && this.roomDetails.landmark === address.landmark;
  }

  navigateTo(route: string) {
    this.router.navigate([`/${route}`]);
  }
}