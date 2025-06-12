import { BankListComponent } from '../../pages/bank-list/bank-list.component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonTitle, IonToolbar, IonContent, IonSegmentButton, IonSegment, IonLabel,IonSegmentView,IonSegmentContent, IonButtons, IonIcon, IonButton } from "@ionic/angular/standalone";
import { CategoryListComponent } from '../../pages/category-list/category-list.component';
import { AuthService } from '../../services/auth.service';
import { logOutOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
@Component({
  selector: 'app-settings-tab',
  imports: [IonButton, IonIcon, IonButtons, IonLabel, IonSegment, IonSegmentButton, IonContent, IonToolbar, IonTitle, IonHeader, CommonModule, IonSegmentView, IonSegmentContent, CategoryListComponent, BankListComponent],
  templateUrl: './settings-tab.component.html',
  styleUrl: './settings-tab.component.scss',
})
export class SettingsTabComponent {
  constructor(private authService :AuthService){
    addIcons({logOutOutline})
  }

  onLogout(){
    this.authService.logout();
  }
}
