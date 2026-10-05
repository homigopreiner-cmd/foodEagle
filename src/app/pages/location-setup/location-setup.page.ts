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
  IonSearchbar, 
  IonTextarea, 
  IonButton, 
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonItem
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { searchOutline, locationOutline, businessOutline, checkmarkDoneCircle } from 'ionicons/icons';
import { UserDataService } from '../../services/user-data.service';

@Component({
  selector: 'app-location-setup',
  templateUrl: './location-setup.page.html',
  styleUrls: ['./location-setup.page.scss'],
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
    IonSearchbar, 
    IonTextarea, 
    IonButton, 
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonItem
  ]
})
export class LocationSetupPage implements OnInit {
  searchQuery: string = '';
  selectedDropdownLocation: string = 'CICS';
  refineSpotText: string = '';
  isSavedSuccess: boolean = false;
  
  campusLandmarks: { [key: string]: { top: number, left: number, fullName: string } } = {
    'CICS': { top: 38, left: 88, fullName: 'CICS - College of Information and Computing Sciences' },
    'CIT': { top: 22, left: 80, fullName: 'CIT - College of Industrial Technology' },
    'COEA': { top: 30, left: 82, fullName: 'COEA - College of Engineering and Architecture' },
    'CHK': { top: 32, left: 25, fullName: 'CHK - College of Human Kinetics' },
    'CPAD': { top: 55, left: 55, fullName: 'CPAD - College of Public Administration and Development Studies' },
    'RED EAGLE GYM': { top: 38, left: 40, fullName: 'Red Eagle Gym' },
    'ROTUNDA': { top: 27, left: 60, fullName: 'Rotunda Area' },
    'OVAL': { top: 72, left: 82, fullName: 'University Oval' },
    'MAIN GATE': { top: 88, left: 48, fullName: 'Main Gate Drop-off Station' }
  };

  allSuggestions: string[] = Object.values(this.campusLandmarks).map(l => l.fullName);
  filteredSuggestions: string[] = [];

  // Map Transformation State
  mapScale: number = 1;
  panX: number = 0;
  panY: number = 0;
  transformOriginX: string = '50%';
  transformOriginY: string = '50%';
  pinPlaced: boolean = true;
  pinRelativeX: number = 0;
  pinRelativeY: number = 0;

  private pointers = new Map<number, { x: number, y: number }>();
  private initialPinchDistance: number = 0;
  private isPanning: boolean = false;
  private startPanX: number = 0;
  private startPanY: number = 0;

  constructor(
    private router: Router,
    private userData: UserDataService
  ) {
    addIcons({ searchOutline, locationOutline, businessOutline, checkmarkDoneCircle });
  }

  ngOnInit() {
    // Pre-fill with the user's saved spot if they already have one.
    const saved = this.userData.current.location;
    this.selectBuilding(saved?.building ?? 'CICS');
    if (saved?.landmark) {
      this.refineSpotText = saved.landmark;
    }
  }

  onSearchInput(event: any) {
    const query = (event.target.value || '').toLowerCase();
    if (!query.trim()) {
      this.filteredSuggestions = [];
      return;
    }
    this.filteredSuggestions = this.allSuggestions.filter(item => 
      item.toLowerCase().includes(query)
    );
  }

  onSearchClear() {
    this.filteredSuggestions = [];
    this.searchQuery = '';
  }

  selectSuggestion(item: string) {
    this.searchQuery = item;
    this.filteredSuggestions = [];
    const foundKey = Object.keys(this.campusLandmarks).find(
      key => this.campusLandmarks[key].fullName === item
    );
    if (foundKey) {
      this.selectedDropdownLocation = foundKey;
      this.updatePinCoordinates(foundKey);
    }
  }

  onDropdownChange(event: any) {
    const code = event.detail.value;
    if (this.campusLandmarks[code]) {
      this.selectedDropdownLocation = code;
      this.searchQuery = this.campusLandmarks[code].fullName;
      this.updatePinCoordinates(code);
    }
  }

  updatePinCoordinates(code: string) {
    const landmark = this.campusLandmarks[code];
    if (landmark) {
      this.pinRelativeX = landmark.left;
      this.pinRelativeY = landmark.top;
      this.pinPlaced = true;
    }
  }

  async onSaveAndContinue() {
    const buildingKey = this.selectedDropdownLocation || 'CICS';
    const landmarkDetails = this.refineSpotText.trim() || 'Near main entrance';

    // Persist to the signed-in user's record in the database.
    await this.userData.setLocation(buildingKey, landmarkDetails);
    await this.userData.upsertAddress(buildingKey, landmarkDetails);

    this.isSavedSuccess = true;
    setTimeout(() => {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }, 600);
  }

  // --- Map Zoom & Pan Handlers ---
  onMapWheel(event: WheelEvent) {
    event.preventDefault();
    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.transformOriginX = `${x}%`;
    this.transformOriginY = `${y}%`;

    const zoomFactor = event.deltaY < 0 ? 1.15 : 0.85;
    const newScale = Math.min(Math.max(this.mapScale * zoomFactor, 1), 4);
    
    if (newScale === 1) {
      this.panX = 0;
      this.panY = 0;
    }
    this.mapScale = newScale;
  }

  onPointerDown(event: PointerEvent) {
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 1) {
      this.isPanning = true;
      this.startPanX = event.clientX - this.panX;
      this.startPanY = event.clientY - this.panY;
    } else if (this.pointers.size === 2) {
      this.isPanning = false;
      const pts = Array.from(this.pointers.values());
      this.initialPinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      
      const container = event.currentTarget as HTMLElement;
      const rect = container.getBoundingClientRect();
      const midX = (( (pts[0].x + pts[1].x) / 2) - rect.left) / rect.width * 100;
      const midY = (( (pts[0].y + pts[1].y) / 2) - rect.top) / rect.height * 100;
      this.transformOriginX = `${midX}%`;
      this.transformOriginY = `${midY}%`;
    }
  }

  onPointerMove(event: PointerEvent) {
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.pointers.size === 2) {
      const pts = Array.from(this.pointers.values());
      const currentDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (this.initialPinchDistance > 0) {
        const factor = currentDistance / this.initialPinchDistance;
        this.mapScale = Math.min(Math.max(this.mapScale * factor, 1), 4);
        this.initialPinchDistance = currentDistance;
      }
    } else if (this.isPanning && this.pointers.size === 1 && this.mapScale > 1) {
      this.panX = event.clientX - this.startPanX;
      this.panY = event.clientY - this.startPanY;
    }
  }

  onPointerUp(event: PointerEvent) {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.initialPinchDistance = 0;
    if (this.pointers.size === 0) this.isPanning = false;
  }

  onMapClick(event: MouseEvent) {
    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const pctX = (clickX / rect.width) * 100;
    const pctY = (clickY / rect.height) * 100;

    this.pinRelativeX = pctX;
    this.pinRelativeY = pctY;
    this.pinPlaced = true;

    let closestKey = 'CICS';
    let minDistance = Infinity;

    for (const key of Object.keys(this.campusLandmarks)) {
      const loc = this.campusLandmarks[key];
      const dist = Math.hypot(loc.left - pctX, loc.top - pctY);
      if (dist < minDistance) {
        minDistance = dist;
        closestKey = key;
      }
    }

    this.selectedDropdownLocation = closestKey;
    this.searchQuery = this.campusLandmarks[closestKey].fullName;
  }

  private selectBuilding(code: string) {
    if (this.campusLandmarks[code]) {
      this.selectedDropdownLocation = code;
      this.searchQuery = this.campusLandmarks[code].fullName;
      this.updatePinCoordinates(code);
    }
  }
}