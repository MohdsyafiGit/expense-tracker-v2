import { Component, Input, OnDestroy, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton, IonButtons, IonToolbar, IonHeader, IonItem,  IonList, IonCard, IonInput, IonIcon, IonPicker, IonModal, IonPickerColumnOption, IonPickerColumn, ModalController, IonLabel } from "@ionic/angular/standalone";
import { Filter } from '../../models/filter.model';
import { FilterForm } from '../../forms/filter/filter.form';
import { BehaviorSubject, debounceTime, Subject, takeUntil } from 'rxjs';
import { SelectCategory } from '../../models/select-category.model';
import { AccountNormalized } from '../../models/account-normalized.model';
import { ValueLabel } from '../../models/value-label.model';
import { CategoryService } from '../../services/category.service';
import { BankService } from '../../services/bank.service';
import { FilterService } from '../../services/filter.service';
import { LoadingService } from '../../services/loading.service';
import { SelectState } from '../../models/select-state.enum';
import { FilterCategoryForm } from '../../forms/filter/filter-category.form';
import { FilterBankForm } from '../../forms/filter/filter-bank.form';
import { ConfirmResult, Dialog } from '@capacitor/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoryPickerComponent } from '../../shared/category-picker/category-picker.component';
import { AccountPickerComponent } from '../../shared/account-picker/account-picker.component';
import { DateRangePickerComponent } from '../../shared/date-range-picker/date-range-picker.component';
import { addIcons } from 'ionicons';
import { filterOutline } from 'ionicons/icons';
import { IonPickerColumnCustomEvent, PickerColumnChangeEventDetail } from '@ionic/core';
import { SelectCategoryId } from '../../models/select-category-id.model';
import { SelectId } from '../../models/select-id.model';
import { SelectAccountId } from '../../models/select-account-id.model';

@Component({
  selector: 'app-filter-picker',
  imports: [IonLabel, 
    IonModal, IonPicker, IonIcon, 
    IonInput, IonCard, IonList, 
    IonItem,  IonHeader, IonToolbar, IonButtons, IonButton, 
    IonContent, CommonModule, ReactiveFormsModule, CategoryPickerComponent,
    AccountPickerComponent, DateRangePickerComponent, IonPickerColumn,
    IonPickerColumnOption],
  templateUrl: './filter-picker.component.html',
  styleUrl: './filter-picker.component.scss',
})
export class FilterPickerComponent implements OnDestroy,OnInit {
  @Input() currentFilter!: Filter;
  pickedFilter = new Filter();
  filterFg : FilterForm = new FilterForm();
  categories$  = new BehaviorSubject<SelectCategory[]>([]);
  bankAccounts$  = new BehaviorSubject<AccountNormalized[]>([]);
  dateModes$ = new BehaviorSubject<ValueLabel[]>([]);
  monthModifiers: ValueLabel[] = [];
  daysInMonth : { value: number; label: string }[] = []
  destroy$ = new Subject<void>();
  filters$ = new BehaviorSubject<Filter[]>([]);
  filters  : Filter[] = [];
  userAcceptFilterModification = false;
  filterModal = viewChild<IonModal>('filterModal');
  constructor(
    private categoryService : CategoryService,
    private bankService : BankService,
    private filterService : FilterService,
    private loadingService : LoadingService,
    private modalCtrl:ModalController){

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

    this.filters$ = this.filterService.filters$

    this.filters$
    .pipe(
      takeUntil(this.destroy$)
    )
    .subscribe((filters)=>{
      this.filters = filters;
    })

    this.dateModes$.next(this.filterService.dateModes);
    this.monthModifiers = this.filterService.monthModifiers;
    this.daysInMonth = this.filterService.daysInMonth;

    addIcons({filterOutline});

    this.filterFg.valueChanges
    .pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
    )
    .subscribe(async (filter)=>{
      if( filter.id === this.currentFilter.id && this.isCurrentFilterModified() && !this.userAcceptFilterModification)
      {
        const res : ConfirmResult = await this.displayWarningAlert("Do you want to set a custom filter?");
        if(!res.value){
          this.updateFormGroup()
          this.userAcceptFilterModification = false;
        }else{
          this.userAcceptFilterModification = true;
          this.filterFg.titleFc.setValue("Custom");
        }
      }else if(!filter.id){
        this.userAcceptFilterModification = true;
        this.filterFg.titleFc.setValue("Custom");
      }
    })
  }

  ngOnInit(): void {
    this.updateFormGroup();
  }

  ngOnDestroy(): void {
    if(this.destroy$){
      this.destroy$.next();
      this.destroy$.complete();
    }
  }
  cancel(){
    this.modalCtrl.dismiss();
  }

  async confirm(){
    try{
      await this.loadingService.beginLoading();

      if(this.userAcceptFilterModification){
        const filter = new Filter(
          this.filterFg.titleFc.value,
          this.filterFg.dateRangeFg.startDateFc.value,
          this.filterFg.dateRangeFg.endDateFc.value,
          this.filterFg.dateRangeFg.dateModeFc.value,
          this.filterFg.dateRangeFg?.customMonthRangeFg?.startFc?.value ?? "",
          this.filterFg.dateRangeFg?.customMonthRangeFg?.endFc?.value ?? "",
          this.filterFg.isDefaultFilterFc.value,
          this.filterFg.dateRangeFg?.customMonthRangeFg?.startModifierFc?.value ?? "",
          this.filterFg.dateRangeFg?.customMonthRangeFg?.endModifierFc?.value ?? "");
        
        filter.id = "";
        filter.selectedBankAccIds = this.filterFg.selectedBankAccIdsFc.value;
        filter.selectedCategoryIds = this.filterFg.selectedCategoryIdsFc.value;
        this.filterService.changeFilter(filter);
      }
      else
        this.filterService.changeFilter(this.currentFilter);

      await this.loadingService.endLoading();
      this.modalCtrl.dismiss();
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

  onFilterChange(event:IonPickerColumnCustomEvent<PickerColumnChangeEventDetail>){
    if(event && this.filters.length > 0){
      const res = this.filters.find((x)=> x.id === event.detail.value)
      if(res)
        this.pickedFilter = res;
    }
  }

  applyPreDefinedFilter(){
    this.userAcceptFilterModification = false;
    this.currentFilter = this.pickedFilter;
    this.updateFormGroup();
    this.filterModal()?.dismiss();
  }

  updateFormGroup(){
    this.filterFg.idFc.setValue(this.currentFilter.id);
    this.filterFg.titleFc.setValue(this.currentFilter.title);
    this.filterFg.isDefaultFilterFc.setValue(this.currentFilter.isDefaultFilter);
    this.filterFg.dateRangeFg.startDateFc.setValue(this.currentFilter.startDate ?? "");
    this.filterFg.dateRangeFg.endDateFc.setValue(this.currentFilter.startDate ?? "");
    this.filterFg.dateRangeFg.dateModeFc.setValue(this.currentFilter.dateMode ?? "");
    this.filterFg.dateRangeFg.customMonthRangeFg.startFc.setValue(this.currentFilter.customMonthStart ?? 1);
    this.filterFg.dateRangeFg.customMonthRangeFg.endFc.setValue(this.currentFilter.customMonthEnd ?? 30);
    this.filterFg.dateRangeFg.customMonthRangeFg.startModifierFc.setValue(this.currentFilter.customMonthStartModifier ?? "");
    this.filterFg.dateRangeFg.customMonthRangeFg.endModifierFc.setValue(this.currentFilter.customMonthEndModifier ?? "");

    this.filterFg.selectedCategoryIdsFc.clear();
    this.currentFilter.selectedCategoryIds.forEach((item)=>{
      this.filterFg.selectedCategoryIdsFc.push(new FilterCategoryForm(item.catId,item.state));
    })

    this.filterFg.selectedBankAccIdsFc.clear();
    this.currentFilter.selectedBankAccIds.forEach((item)=>{
      this.filterFg.selectedBankAccIdsFc.push(new FilterBankForm(item.bankId,item.accId,item.state));
    });
  }

  closeFilterModal(){
    if(this.filterModal())
      this.filterModal()?.dismiss();
  }

  isCurrentFilterModified():boolean{

    if(!this.filterFg.idFc.value)
      return false;

    if(this.filterFg.idFc.value !== this.currentFilter.id)
      return false;

    if(this.filterFg.dateRangeFg.dateModeFc.value !== this.currentFilter.dateMode)
      return true;

    if(this.filterFg.dateRangeFg.startDateFc.value !== this.currentFilter.startDate)
      return true;

    if(this.filterFg.dateRangeFg.endDateFc.value !== this.currentFilter.endDate)
      return true;

    if(this.filterFg.dateRangeFg.customMonthRangeFg.startFc.value !== this.currentFilter.customMonthStart)
      return true;

    if(this.filterFg.dateRangeFg.customMonthRangeFg.endFc.value !== this.currentFilter.customMonthEnd)
      return true;

    if(this.filterFg.dateRangeFg.customMonthRangeFg.startModifierFc.value !== this.currentFilter.customMonthStartModifier)
      return true;

    if(this.filterFg.dateRangeFg.customMonthRangeFg.endModifierFc.value !== this.currentFilter.customMonthEndModifier)
      return true;

    const catFormValues: SelectId[] = this.filterFg.selectedCategoryIdsFc.value.map((item : SelectCategoryId)=>{ return this.mapToSelectId(item.catId,item.state)});
    const catFilterList: SelectId[] = this.currentFilter.selectedCategoryIds.map((item : SelectCategoryId)=>{ return this.mapToSelectId(item.catId,item.state)});
    
    if(this.isSelectArrayChanged(catFilterList,catFormValues))
      return true

    const bankFormValues: SelectId[] = this.filterFg.selectedBankAccIdsFc.value.map((item : SelectAccountId)=>{ return this.mapToSelectId(item.accId,item.state)});
    const bankFilterList: SelectId[] = this.currentFilter.selectedBankAccIds.map((item : SelectAccountId)=>{ return this.mapToSelectId(item.accId,item.state)});
    
    if(this.isSelectArrayChanged(bankFormValues,bankFilterList))
      return true

    return false;
  }

  isSelectArrayChanged(currentArray: SelectId[], formArray : SelectId[]){

    if (currentArray.length !== formArray.length) {
      return true;
    }

    for(const element of currentArray) {
      const res = formArray.find((x) => x.id === element.id);
      
      if(!res)
        return true;
        
      if(res.state !== element.state)
        return true;
    }

    // Check if any item in form values is missing in currentFilter
    for(const element of formArray) {
      if(!currentArray.some((x) => x.id === element.id))
        return true;
    }

    return false;
  }

  mapToSelectId(id:string,state:SelectState) : SelectId{
    return{
      id:id,
      state:state
    }
  } 

}
