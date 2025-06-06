import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonTitle, IonToolbar, IonContent } from "@ionic/angular/standalone";

@Component({
  selector: 'app-settings-tab',
  imports: [IonContent, IonToolbar, IonTitle, IonHeader, CommonModule],
  templateUrl: './settings-tab.component.html',
  styleUrl: './settings-tab.component.scss',
})
export class SettingsTabComponent {}
