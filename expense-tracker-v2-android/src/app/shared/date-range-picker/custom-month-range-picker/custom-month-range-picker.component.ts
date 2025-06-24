import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonPickerColumn, IonPickerColumnOption, IonCard, IonCardContent, IonCardHeader, IonLabel, IonGrid, IonRow, IonCol, IonButton, IonModal, IonToolbar, IonButtons, IonPicker } from "@ionic/angular/standalone";
import { FilterCustomMonthRange } from '../../../forms/filter/filter-custom-month-range.form';
import { ReactiveFormsModule } from '@angular/forms';
import { ValueLabel } from '../../../models/value-label.model';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-custom-month-range-picker',
  imports: [
    IonPicker, IonButtons, IonToolbar, IonModal, 
    IonButton, IonCol, IonRow, IonGrid, IonLabel, 
    IonCardHeader, IonCardContent, IonCard, CommonModule,
    IonPickerColumn, IonPickerColumnOption, ReactiveFormsModule],
  templateUrl: './custom-month-range-picker.component.html',
  styleUrl: './custom-month-range-picker.component.scss',
})
export class CustomMonthRangePickerComponent implements OnInit, OnDestroy {

  @Input() customMonthRangeFg!: FilterCustomMonthRange;
  @Input() monthModifiers!: ValueLabel[];
  @Input() daysInMonth!: { value: number; label: string }[];

  startDay = 1;
  endDay = 31;
  startModifier: string | null = "lastMonth";
  endModifier: string | null = "thisMonth";
  
  startDayLabel$ = new BehaviorSubject<string>("");
  endDayLabel$ = new BehaviorSubject<string>("");
  startModifierLabel$ = new BehaviorSubject<string>("");
  endModifierLabel$ = new BehaviorSubject<string>("");
  
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeValues();
    this.updateLabels();
    this.subscribeToFormChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onChangeStartMonthModifier(event: CustomEvent): void {
    this.startModifier = event.detail.value;
    this.customMonthRangeFg.startModifierFc.setValue(this.startModifier ?? "");
  }

  onChangeEndMonthModifier(event: CustomEvent): void {
    this.endModifier = event.detail.value;
    this.customMonthRangeFg.endModifierFc.setValue(this.endModifier ?? "");
  }

  onChangeStartMonth(event: CustomEvent): void {
    this.startDay = event.detail.value;
    this.customMonthRangeFg.startFc?.setValue(this.startDay);
  }

  onChangeEndMonth(event: CustomEvent): void {
    this.endDay = event.detail.value;
    this.customMonthRangeFg.endFc?.setValue(this.endDay);
  }

  private initializeValues(): void {
    this.startDay = this.customMonthRangeFg?.startFc?.value || 
                   this.daysInMonth?.[0]?.value || 1;
    
    this.endDay = this.customMonthRangeFg?.endFc?.value || 
                  this.daysInMonth?.[this.daysInMonth.length - 1]?.value || 31;

    this.startModifier = this.customMonthRangeFg?.startModifierFc?.value || 
                   this.monthModifiers?.[0]?.value || "Please Select";

    this.endModifier = this.customMonthRangeFg?.endModifierFc?.value || 
                  this.monthModifiers?.[0]?.value || "Please Select";
  }

  private updateLabels(): void {
    this.startModifierLabel$.next(this.findLabel(this.monthModifiers, this.startModifier));
    this.endModifierLabel$.next(this.findLabel(this.monthModifiers, this.endModifier));
    this.startDayLabel$.next(this.findLabel(this.daysInMonth, this.startDay));
    this.endDayLabel$.next(this.findLabel(this.daysInMonth, this.endDay));
  }

  private subscribeToFormChanges(): void {
    this.customMonthRangeFg.startModifierFc?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.startModifierLabel$.next(this.findLabel(this.monthModifiers, value));
      });

    this.customMonthRangeFg.endModifierFc?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.endModifierLabel$.next(this.findLabel(this.monthModifiers, value));
      });

    this.customMonthRangeFg.startFc?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.startDayLabel$.next(this.findLabel(this.daysInMonth, value));
      });

    this.customMonthRangeFg.endFc?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.endDayLabel$.next(this.findLabel(this.daysInMonth, value));
      });
  }

  private findLabel(items: ValueLabel[] | { value: number; label: string }[], value: string | null | number): string {
    return items?.find(x => x.value === value)?.label ?? "";
  }
}
