import { BankComponent } from './../../pages/bank/bank.component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonTitle, IonToolbar, IonContent, IonSegmentButton, IonSegment, IonLabel,IonSegmentView,IonSegmentContent } from "@ionic/angular/standalone";
import { CategoryComponent } from '../../pages/category/category.component';
@Component({
  selector: 'app-settings-tab',
  imports: [IonLabel, IonSegment, IonSegmentButton, IonContent, IonToolbar, IonTitle, IonHeader, CommonModule, IonSegmentView, IonSegmentContent, CategoryComponent, BankComponent],
  templateUrl: './settings-tab.component.html',
  styleUrl: './settings-tab.component.scss',
})
export class SettingsTabComponent {}
