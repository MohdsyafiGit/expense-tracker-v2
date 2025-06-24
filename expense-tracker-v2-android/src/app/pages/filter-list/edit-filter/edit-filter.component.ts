import { Component, OnDestroy } from '@angular/core';
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
import { FilterCategoryForm } from '../../../forms/filter/filter-category.form';
import { FilterBankForm } from '../../../forms/filter/filter-bank.form';

@Component({
  selector: 'app-edit-filter',
  imports: [
    IonRadioGroup, IonRadio, IonLabel, IonCardHeader,
    IonCard, IonList, IonItem, IonInput, IonContent,
    IonButton, IonButtons, IonToolbar, IonHeader,
    CommonModule, ReactiveFormsModule, CategoryPickerComponent,
    AccountPickerComponent,
    DateRangePickerComponent
  ],
  templateUrl: './edit-filter.component.html',
  styleUrl: './edit-filter.component.scss',
})
export class EditFilterComponent implements OnDestroy {
  filterToEdit!: Filter;
  editFilterFg : FilterForm = new FilterForm();
  categories$  = new BehaviorSubject<SelectCategory[]>([]);
  bankAccounts$  = new BehaviorSubject<AccountNormalized[]>([]);
  dateModes$ = new BehaviorSubject<ValueLabel[]>([]);
  monthModifiers: ValueLabel[] = [];
  daysInMonth : { value: number; label: string }[] = []
  destroy$ = new Subject<void>();
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

    this.filterService.getFilterToEdit().then((res)=>{
      this.filterToEdit = res;
      this.editFilterFg.idFc.setValue(this.filterToEdit.id);
      this.editFilterFg.titleFc.setValue(this.filterToEdit.title);
      this.editFilterFg.isDefaultFilterFc.setValue(this.filterToEdit.isDefaultFilter);
      this.editFilterFg.dateRangeFg.startDateFc.setValue(this.filterToEdit.startDate ?? "");
      this.editFilterFg.dateRangeFg.endDateFc.setValue(this.filterToEdit.startDate ?? "");
      this.editFilterFg.dateRangeFg.dateModeFc.setValue(this.filterToEdit.dateMode ?? "");
      this.editFilterFg.dateRangeFg.customMonthRangeFg.startFc.setValue(this.filterToEdit.customMonthStart ?? 1);
      this.editFilterFg.dateRangeFg.customMonthRangeFg.endFc.setValue(this.filterToEdit.customMonthEnd ?? 30);
      this.editFilterFg.dateRangeFg.customMonthRangeFg.startModifierFc.setValue(this.filterToEdit.customMonthStartModifier ?? "");
      this.editFilterFg.dateRangeFg.customMonthRangeFg.endModifierFc.setValue(this.filterToEdit.customMonthEndModifier ?? "");

      this.filterToEdit.selectedCategoryIds.forEach((item)=>{
        this.editFilterFg.selectedCategoryIdsFc.push(new FilterCategoryForm(item.catId,item.state));
      })
      this.filterToEdit.selectedBankAccIds.forEach((item)=>{
        this.editFilterFg.selectedBankAccIdsFc.push(new FilterBankForm(item.bankId,item.accId,item.state));
      });

    });

  }
  ngOnDestroy(): void {
    if(this.destroy$){
      this.destroy$.next();
      this.destroy$.complete();
    }
  }
  cancel(){
    this.filterService.dismissEditFilterModal$.next();
  }

  async confirm(){
    try{
      await this.loadingService.beginLoading();
      const filter = new Filter(
        this.editFilterFg.titleFc.value,
        this.editFilterFg.dateRangeFg.startDateFc.value,
        this.editFilterFg.dateRangeFg.endDateFc.value,
        this.editFilterFg.dateRangeFg.dateModeFc.value,
        this.editFilterFg.dateRangeFg?.customMonthRangeFg?.startFc?.value ?? "",
        this.editFilterFg.dateRangeFg?.customMonthRangeFg?.endFc?.value ?? "",
        this.editFilterFg.isDefaultFilterFc.value,
        this.editFilterFg.dateRangeFg?.customMonthRangeFg?.startModifierFc?.value ?? "",
        this.editFilterFg.dateRangeFg?.customMonthRangeFg?.endModifierFc?.value ?? "");
      
      filter.id = this.editFilterFg.idFc.value;
      filter.selectedBankAccIds = this.editFilterFg.selectedBankAccIdsFc.value;
      filter.selectedCategoryIds = this.editFilterFg.selectedCategoryIdsFc.value;

      if(filter.isDefaultFilter){
        const currentDefaultFilter = await this.filterService.checkOtherDefaultFilterExist(this.filterToEdit.id);
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

      await this.filterService.updateFilter(filter)
      await this.loadingService.endLoading();
      this.filterService.dismissEditFilterModal$.next();
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
