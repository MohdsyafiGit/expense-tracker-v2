import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonButton, IonIcon, IonLabel, IonList, IonItem, IonInput, IonCardHeader, IonRadioGroup, IonRadio, IonCardContent, IonGrid, IonRow, IonCol, IonModal, IonToolbar, IonButtons, IonPicker, IonDatetimeButton, IonDatetime, AlertController } from "@ionic/angular/standalone";
import { Filter } from '../../models/filter.model';
import { BehaviorSubject, combineLatest, Subscription, tap } from 'rxjs';
import { SelectCategory } from '../../models/select-category.model';
import { AccountNormalized } from '../../models/account-normalized.model';
import { SelectState } from '../../models/select-state.enum';
import { FilterService } from '../../services/filter.service';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import  *  as icons from 'ionicons/icons';
import { CategoryService } from '../../services/category.service';
import { BankService } from '../../services/bank.service';
import { IonRadioGroupCustomEvent, RadioGroupChangeEventDetail } from '@ionic/core';
import { ValueLabel } from '../../models/value-label.model';
import { NumberValueLabel } from '../../models/number-value-label';

@Component({
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-filter-form',
  imports: [
    IonDatetime, IonDatetimeButton, IonPicker, IonButtons, 
    IonToolbar, IonModal, IonCol, IonRow, IonGrid, IonCardContent, 
    IonRadio, IonRadioGroup, IonCardHeader, IonInput, IonItem, 
    IonList, IonLabel, IonIcon, IonButton, IonCard, CommonModule],
  templateUrl: './filter-form.component.html',
  styleUrl: './filter-form.component.scss',
})
export class FilterFormComponent implements OnDestroy, OnInit {
  
  @Input() isCustomFilter  = false;
  @Input() customFilter : Filter = new Filter("","","","",0,0,false,"","");
  alertMsg = ""
  isAlertOpen  = false;
  isDefaultFilter  = false;
  isModelStartOpen  = false;
  customMonthStart  = 1;
  customMonthEnd  = 31;
  customMonthStartModifier : string |null  = "lastMonth";
  customMonthEndModifier : string |null = "thisMonth";
  customMonthStartLabel : string |null ="";
  customMonthEndLabel : string |null  ="";
  title = "";
  isEdit = false;
  filterId = "";

  categoriesLoaded$ = new BehaviorSubject<SelectCategory[]>([]);
  banksLoaded$ = new BehaviorSubject<AccountNormalized[]>([]);
  $categoriesSub :Subscription | null = null;
  $banksSub : Subscription | null = null;
  accounts = signal<AccountNormalized[]>([]);
  categories  = signal<SelectCategory[]>([]);
  selectedCategories : SelectCategory[] = []
  selectedBankAccounts : AccountNormalized[] = []
  
  selectState = SelectState;
  startDate: string | null = null;
  endDate: string | null = null;
  dateTimePresentation = "date";
  selectedDateMode  = "";
  dateModes: {value:string,label:string}[] = [];
  weekDays : NumberValueLabel[] = [];
  daysInMonth: { value: number; label: string }[] = [];
  monthModifiers : ValueLabel[] = []
  filterLoaded$ = new BehaviorSubject<Filter|null>(null);
  $componentDataLoadSub : Subscription | null = null;

  constructor(
    private filterService: FilterService,
    private route: ActivatedRoute,
    private router:Router,
    private alertController: AlertController,
    private categoryService: CategoryService,
    private bankService : BankService) { 
    
    addIcons(icons);
    this.dateModes= this.filterService.dateModes;
    this.weekDays= this.filterService.weekDays;
    this.monthModifiers = this.filterService.monthModifiers;

    for (let i = 1; i <= 31; i++) {
      let suffix = 'th';
      if (i === 1 || i === 21 || i === 31) {
        suffix = 'st';
      } else if (i === 2 || i === 22) {
        suffix = 'nd';
      } else if (i === 3 || i === 23) {
        suffix = 'rd';
      }
    
      this.daysInMonth.push({ value: i, label: `${i}${suffix}` });
    }

  }
  ngOnDestroy(): void {
    if(this.$categoriesSub)
      this.$categoriesSub.unsubscribe();

    if(this.$banksSub)
      this.$banksSub.unsubscribe();

    if(this.$componentDataLoadSub)
      this.$componentDataLoadSub.unsubscribe();
  }

  async ngOnInit(): Promise<void> {

    if(this.isCustomFilter)
      this.title = "custom"

    if(this.customFilter){
      this.initializeFilterDetails(this.customFilter);
    }

   this.$categoriesSub = this.categoryService.categories$
    .pipe(
      tap((list)=>{
        const mappedList = list.map((item) => new SelectCategory(item,SelectState.none))
        this.categories.set(mappedList);
        this.categoriesLoaded$.next(mappedList);
      })
    )
    .subscribe();

    this.$banksSub =this.bankService.banks$.pipe(
      tap((list)=>{
        const mappedList = list.reduce((prev,curr) =>{
          curr.accounts.forEach((acc)=>{
            prev.push(new AccountNormalized(curr.id,acc.id,curr.picName,curr.bankName,acc.name,SelectState.none));
          })
          return prev;
        } ,[] as AccountNormalized[])

        this.accounts.set(mappedList);
        this.banksLoaded$.next(mappedList);
      })
    )
    .subscribe();

    const id = this.route.snapshot.params['id'];
    this.filterId = id;

    if(id){
      const filterDetail = await this.filterService.getFilterDetail(this.filterId);
      if(filterDetail){
        this.filterId = id; 
        this.title = filterDetail.title;
        this.initializeFilterDetails(filterDetail);
      }
    }
    
    const resMonthStart = this.getMonthRangeLabel(this.customMonthStart)
    this.customMonthStartLabel = resMonthStart ? resMonthStart.label : "";

    const resMonthEnd = this.getMonthRangeLabel(this.customMonthEnd)
    this.customMonthEndLabel = resMonthEnd ? resMonthEnd.label : "";

    this.$componentDataLoadSub = 
    combineLatest(
      [this.categoriesLoaded$, this.banksLoaded$,this.filterLoaded$])
    .subscribe(([categoryList, accList, loadedFilter]) => {
      if(!categoryList || !loadedFilter || !accList)
        return

      if(loadedFilter.selectedCategoryIds && loadedFilter.selectedCategoryIds.length > 0 && categoryList.length > 0){

        categoryList.forEach((item)=>{
          const res = loadedFilter.selectedCategoryIds.find((x)=> x.catId === item.category.id);
          if(res)         
            item.state = res.state
          
        });

        this.categories.set(categoryList);
        this.selectedCategories = categoryList.filter((item)=>item.state === SelectState.exclude || item.state === SelectState.include);
      }

      if(loadedFilter.selectedBankAccIds && loadedFilter.selectedBankAccIds.length > 0 && accList.length > 0){

        accList.forEach((item)=>{
          const res = loadedFilter.selectedBankAccIds.find((x)=> x.accId === item.accId && x.bankId === item.bankId)
            if(res)
              item.state = res.state
        });

        this.accounts.set(accList);
        this.selectedBankAccounts = accList.filter((item)=>item.state === SelectState.exclude || item.state === SelectState.include);
      }
    });
  }

  async initializeFilterDetails(filterDetail:Filter){

    this.isEdit = true;

    this.startDate = filterDetail.startDate ? this.getISODate(filterDetail.startDate) : this.getCurrentTime();
    this.endDate = filterDetail.endDate ?  this.getISODate(filterDetail.endDate) :  this.getCurrentTime();
    this.selectedDateMode = filterDetail.dateMode;
    this.customMonthStart = filterDetail.customMonthStart ?? 1;
    this.customMonthEnd = filterDetail.customMonthEnd ?? 31;
    this.isDefaultFilter = filterDetail.isDefaultFilter ?? false;
    this.customMonthStartModifier = filterDetail.customMonthStartModifier ?? "lastMonth";
    this.customMonthEndModifier = filterDetail.customMonthEndModifier ?? "thisMonth";

    this.filterLoaded$.next(filterDetail);
  }

  handleCategorySelected(catId:string){
    const newList =  this.categories();

      newList.forEach((item)=>{
        if(item.category.id === catId)
        {
          switch(item.state){
            case SelectState.exclude:
              item.state = SelectState.none;
              break;
            case SelectState.include:
              item.state = SelectState.exclude;
              break;
            case SelectState.none:
              item.state = SelectState.include;
              break;
            default:
              item.state = SelectState.none;
          }
        }
      });

      this.categories.set(newList);
      this.selectedCategories = newList.filter((item)=>item.state === SelectState.exclude || item.state === SelectState.include );
  }

  handleBankSelected(bankId:string,accId:string){
    const newList =  this.accounts();

      newList.forEach((item)=>{
        if(item.bankId === bankId && item.accId === accId)
        {
          switch(item.state){
            case SelectState.exclude:
              item.state = SelectState.none;
              break;
            case SelectState.include:
              item.state = SelectState.exclude;
              break;
            case SelectState.none:
              item.state = SelectState.include;
              break;
            default:
              item.state = SelectState.none;
          }
        }     
      });

      this.accounts.set(newList);
      this.selectedBankAccounts = newList.filter((item)=>item.state === SelectState.exclude || item.state === SelectState.include);
  }


  getISODate(inputDate:string):string{
    const localDate = new Date(inputDate);
    return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  getCurrentTime(){
    return new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  async applyCustomFilter(){

    const filter = new Filter(
      this.title,
      this.startDate ?? "",
      this.endDate ?? "",
      this.selectedDateMode,
      this.customMonthStart,
      this.customMonthEnd,
      this.isDefaultFilter,
      this.customMonthStartModifier ?? "",
      this.customMonthEndModifier ?? "");

      if(this.selectedCategories)

      filter.selectedBankAccIds = this.selectedBankAccounts;
      filter.selectedCategoryIds =this.selectedCategories.map((item)=>{return {state:item.state,catId:item.category.id}});
      this.filterService.changeFilter(filter);
      
  }

  async handleSave(){
    
    const filter = new Filter(
      this.title,
      this.startDate ?? "",
      this.endDate ?? "",
      this.selectedDateMode,
      this.customMonthStart,
      this.customMonthEnd,
      this.isDefaultFilter,
      this.customMonthStartModifier ?? "",
      this.customMonthEndModifier ?? "");

      filter.selectedBankAccIds = this.selectedBankAccounts;
      filter.selectedCategoryIds = this.selectedCategories.map((item)=>{return {state:item.state,catId:item.category.id}});

    if(this.isDefaultFilter){
      const currentDefaultFilter = await this.filterService.checkOtherDefaultFilterExist(this.filterId);
      if(currentDefaultFilter)
      {
        this.alertMsg = `Existing default filter exist, do you want to change default filter from ${currentDefaultFilter.title} to ${this.title} ?`;
        const confirmation = await this.showAlert();

        if(confirmation){
          currentDefaultFilter.isDefaultFilter = false;
          await this.filterService.updateFilter(currentDefaultFilter);
        }
        else
          return
      }
    }



    if(this.isEdit){
      filter.id = this.filterId;
      await this.filterService.updateFilter(filter);
    }
    else
      await this.filterService.saveFilter(filter)

    this.router.navigate(["/maintenance/filter/filter-list"]);
  }

  async showAlert(): Promise<boolean> {
    const alert = await this.alertController.create({
      header: 'Warning',
      message: this.alertMsg,
      buttons: [
        {
          text: 'Confirm',
          role: 'confirm',
          handler: () => true
        },
        {
          text: 'Cancel', 
          role: 'cancel',
          handler: () => false
        }
      ],
      cssClass: ["warning-alert"]
    });

    return alert.present().then(() => {
      return new Promise<boolean>(resolve => {
        alert.onDidDismiss().then(result => {
          resolve(result.role === 'confirm');
        });
      });
    });
  }

  handleDateModeChange(input:IonRadioGroupCustomEvent<RadioGroupChangeEventDetail<unknown>>){
    if(input.target.value)
      this.selectedDateMode = input.target.value;
  }


  getWeekRangeLabel(inputNumber:number){
    const res =  this.weekDays.find((item)=> inputNumber === item.value);
    return res
  }

  getMonthRangeLabel(inputNumber:number){
    const res =  this.daysInMonth.find((item)=> inputNumber === item.value);
    return res
  }

  redirectToFilterList(){
    this.router.navigate(["/maintenance/filter/filter-list"]);
  }

  onChangeStartMonth(event: CustomEvent) {
    this.customMonthStart = event.detail.value;
    const res = this.getMonthRangeLabel(this.customMonthStart);
    if(res)
      this.customMonthStartLabel = res.label;
  }

  onChangeStartMonthModifier(event: CustomEvent) {
    this.customMonthStartModifier = event.detail.value;
  }

  onChangeEndMonth(event: CustomEvent) {
    this.customMonthEnd = event.detail.value;
    const res = this.getMonthRangeLabel(this.customMonthEnd);
    if(res)
      this.customMonthEndLabel = res.label;
  }

  onChangeEndMonthModifier(event: CustomEvent) {
    this.customMonthEndModifier = event.detail.value;
  }

  setOpen(isOpen: boolean) {
    this.isAlertOpen = isOpen;
  }

}
