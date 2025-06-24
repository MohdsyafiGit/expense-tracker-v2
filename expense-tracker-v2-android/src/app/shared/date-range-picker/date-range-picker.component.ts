import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonRadio, IonCard, IonCardHeader, IonList, IonRadioGroup, IonItem, IonLabel } from "@ionic/angular/standalone";
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { ValueLabel } from '../../models/value-label.model';
import { FilterDateRangeForm } from '../../forms/filter/filter-date-range.form';
import { ReactiveFormsModule } from '@angular/forms';
import { CustomMonthRangePickerComponent } from './custom-month-range-picker/custom-month-range-picker.component';
import { CustomDateRangePickerComponent } from "./custom-date-range-picker/custom-date-range-picker.component";

@Component({
  selector: 'app-date-range-picker',
  imports: [
    IonLabel, IonItem, IonRadioGroup, IonList,
    IonCardHeader, IonCard, IonRadio, CommonModule,
    ReactiveFormsModule, CustomMonthRangePickerComponent,
    CustomDateRangePickerComponent
],
  templateUrl: './date-range-picker.component.html',
  styleUrl: './date-range-picker.component.scss',
})
export class DateRangePickerComponent implements OnInit, OnDestroy{
  @Input() dateRangeForm!: FilterDateRangeForm;
  @Input() dateModes$ : BehaviorSubject<ValueLabel[]> | null = null;
  @Input() monthModifiers: ValueLabel[] = [];
  @Input() daysInMonth : { value: number; label: string }[] = []
  dateModes : ValueLabel[] = [];
  destroy$ = new Subject<void>();

  ngOnInit(): void {
    if(this.dateModes$){
      this.dateModes$
      .pipe(
        takeUntil(this.destroy$))
      .subscribe((list)=>{
        this.dateModes = list;
      })
    }
  }

  ngOnDestroy(): void {
    if(this.destroy$)
    {
      this.destroy$.next();
      this.destroy$.complete();
    } 
  }
}
