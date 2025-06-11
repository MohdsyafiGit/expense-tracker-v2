import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSpinner } from "@ionic/angular/standalone";

@Component({
  selector: 'app-loading',
  imports: [IonSpinner, CommonModule],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss',
})
export class LoadingComponent {}
