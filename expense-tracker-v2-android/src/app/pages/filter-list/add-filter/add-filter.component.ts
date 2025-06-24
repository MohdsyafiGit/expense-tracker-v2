import { Component, OnDestroy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonButtons, IonButton, IonContent, IonInput, IonItem, IonList, IonCard, IonCardHeader, IonLabel, IonRadio, IonRadioGroup } from "@ionic/angular/standalone";
import { FilterForm } from '../../../forms/filter/filter.form';
import {  ReactiveFormsModule } from '@angular/forms';
import { CategoryPickerComponent } from "../../../shared/category-picker/category-picker.component";
import { SelectCategory } from '../../../models/select-category.model';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { CategoryService } from '../../../services/category.service';
import { SelectState } from '../../../models/select-state.enum';
import { BankService } from '../../../services/bank.service';
import { AccountNormalized } from '../../../models/account-normalized.model';
import { AccountPickerComponent } from "../../../shared/account-picker/account-picker.component";
import { ValueLabel } from '../../../models/value-label.model';
import { FilterService } from '../../../services/filter.service';
import { DateRangePickerComponent } from "../../../shared/date-range-picker/date-range-picker.component";
import { ConfirmResult, Dialog } from '@capacitor/dialog';
import { Filter } from '../../../models/filter.model';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-add-filter',
  imports: [
    IonRadioGroup, IonRadio, IonLabel, IonCardHeader,
    IonCard, IonList, IonItem, IonInput, IonContent,
    IonButton, IonButtons, IonToolbar, IonHeader,
    CommonModule, ReactiveFormsModule, CategoryPickerComponent,
    AccountPickerComponent,
    DateRangePickerComponent
],
  templateUrl: './add-filter.component.html',
  styleUrl: './add-filter.component.scss',
})
export class AddFilterComponent implements OnDestroy{
  addFilterFg : FilterForm = new FilterForm();
  categories$  = new BehaviorSubject<SelectCategory[]>([]);
  bankAccounts$  = new BehaviorSubject<AccountNormalized[]>([]);
  dateModes$ = new BehaviorSubject<ValueLabel[]>([]);
  monthModifiers: ValueLabel[] = [];
  daysInMonth : { value: number; label: string }[] = []
  destroy$ = new Subject<void>();
  confirmClick = output();
  cancelClick = output();
  constructor(
    private categoryService : CategoryService,
    private bankService : BankService,
    private filterService : FilterService,
    private loadingService : LoadingService){

    this.categoryService.categories$
      .pipe(
        takeUntil(this.destroy$))
      .subscribe((list)=>{
        const mappedList = list.map((item) => new SelectCategory(item,SelectState.none));
        this.categories$.next(mappedList);
      })

    this.bankService.banks$
      .pipe(
        takeUntil(this.destroy$))
      .subscribe((list)=>{
        const mappedList = list.reduce((prev,curr) =>{
          curr.accounts.forEach((acc)=>{
            prev.push(new AccountNormalized(curr.id,acc.id,curr.picName,curr.bankName,acc.name,SelectState.none));
          })
          return prev;
        } ,[] as AccountNormalized[]);

        this.bankAccounts$.next(mappedList);
    })

    this.dateModes$.next(this.filterService.dateModes);
    this.monthModifiers = this.filterService.monthModifiers;
    this.daysInMonth = this.filterService.daysInMonth;
  }
  ngOnDestroy(): void {
    if(this.destroy$){
      this.destroy$.next();
      this.destroy$.complete();
    }
  }
  cancel(){
    this.cancelClick.emit();
  }

  async confirm(){
    try{
      await this.loadingService.beginLoading();
      const filter = new Filter(
        this.addFilterFg.titleFc.value,
        this.addFilterFg.dateRangeFg.startDateFc.value,
        this.addFilterFg.dateRangeFg.endDateFc.value,
        this.addFilterFg.dateRangeFg.dateModeFc.value,
        this.addFilterFg.dateRangeFg?.customMonthRangeFg?.startFc?.value ?? "",
        this.addFilterFg.dateRangeFg?.customMonthRangeFg?.endFc?.value ?? "",
        this.addFilterFg.isDefaultFilterFc.value,
        this.addFilterFg.dateRangeFg?.customMonthRangeFg?.startModifierFc?.value ?? "",
        this.addFilterFg.dateRangeFg?.customMonthRangeFg?.endModifierFc?.value ?? "");

      filter.selectedBankAccIds = this.addFilterFg.selectedBankAccIdsFc.value;
      filter.selectedCategoryIds = this.addFilterFg.selectedCategoryIdsFc.value;

      if(filter.isDefaultFilter){
        const currentDefaultFilter = await this.filterService.checkOtherDefaultFilterExist("");
        if(currentDefaultFilter)
        {
          await this.loadingService.endLoading();
          const confirmation : ConfirmResult = await this.displayWarningAlert(`Existing default filter exist, do you want to change default filter from ${currentDefaultFilter.title} to ${filter.title} ?`) ;
        
          if(confirmation){
            currentDefaultFilter.isDefaultFilter = false;
            await this.loadingService.beginLoading();
            await this.filterService.updateFilter(currentDefaultFilter);
          }
          else
            return
        }
      }

      await this.filterService.saveFilter(filter)
      await this.loadingService.endLoading();
      this.confirmClick.emit();
    }catch(err){
      console.error(err);
      this.loadingService.endLoading();
      this.displayErrorAlert("Unable to save filter!");

    }
   
  }

  displayErrorAlert(msg:string){
    Dialog.alert({
        title: 'Error',
        message: msg,
    });
  }

  async displayWarningAlert(msg:string){
    return Dialog.confirm({
        title: 'Warning',
        message: msg,
    });
  }
}
