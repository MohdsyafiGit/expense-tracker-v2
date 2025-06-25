import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject, Subscription } from "rxjs";
import { Filter } from "../models/filter.model";
import { FirebaseFirestore } from "@capacitor-firebase/firestore";
import { FirebasePathBuilderService } from "./firebase-path-builder.service";
import { AuthService } from "./auth.service";
import { ValueLabel } from "../models/value-label.model";
import { NumberValueLabel } from "../models/number-value-label";

@Injectable({
    providedIn : "root"
})
export class FilterService {
  private filters: Filter[] = [];
  private filtersSub : Subscription|null = null
  public filters$ = new BehaviorSubject<Filter[]>([]);
  public filterIdToEdit = "";
  dismissEditFilterModal$ = new Subject<void>();
  private currentFilter : Filter|undefined;
  currentFilter$ = new BehaviorSubject<Filter| null>(null)
  daysInMonth :{ value: number; label: string }[] = []
  dateModes : ValueLabel[] = [
    { value : "all", label : "All"},
    { value : "today", label : "Today"},
    { value : "yesterday", label : "Yesterday"},
    { value : "currentMonth", label : "Current Month"},
    { value : "customMonthRange", label : "Custom Month Range"},
    { value : "currentWeek", label : "Current Week"},
    { value : "customDateRange", label : "Custom Date Range"}
  ]
  weekDays : NumberValueLabel[] =  [
    { value: 1, label : "Monday" },
    { value: 2, label : "Tuesday" },
    { value: 3, label : "Wednesday" },
    { value: 4, label : "Thursday" },
    { value: 5, label : "Friday" },
    { value: 6, label : "Saturday" },
    { value: 7, label : "Sunday" },
  ]
  monthModifiers : ValueLabel[] = [
   { value : "lastMonth", label: "Last Month"},
   { value : "thisMonth", label: "This Month"},
   { value : "nextMonth", label: "Next Month"}
  ]
  constructor(private path:FirebasePathBuilderService,private authService :AuthService){
    this.authService.user$.subscribe((user)=>{
      if(!user){
        this.resetFiltersSub();
        this.filters = [];
        this.filters$.next([]);
      }else{
        this.resetFiltersSub();
        this.filtersSub = this.getFilters().subscribe();
        
        this.getDefaultFilter()
        .then((res)=>{
          if(res){
            this.changeFilter(res);
          }
        });
      }
    })

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
  private getFilters(): Observable<Filter[]> {
    return new Observable(observer => {
      let callbackId = "";
      const setupListener = async () => {
        try {
          callbackId = await FirebaseFirestore.addCollectionSnapshotListener({
            reference : this.path.userFilterCollectionPath()
          }, (event, error) => {
              if (error) {
                observer.error(error);
              } else {
                const filters = event?.snapshots.map((item) => ({...item.data, id: item.id} as Filter)) ?? [];
                this.filters = filters;
                this.filters$.next(this.filters);
              }
          });

        } catch (error) {
          observer.error(error);
        }
      };

      setupListener();

      // Cleanup function
      return async () => {
        if (callbackId) {
          try {
            await FirebaseFirestore.removeSnapshotListener({ callbackId });
          } catch (error) {
            console.error('Error removing snapshot listener:', error);
          }
        }
      };
    });
  }

  async getFilterDetail(filterId:string):Promise<Filter>{
    const docRef = this.path.userFilterDocPath(filterId);
    const { snapshot } = await FirebaseFirestore.getDocument<Filter>({
      reference: docRef,
    });
    return {...snapshot.data,id:snapshot.id} as Filter;
  }

  async deleteFilter(filterId : string){
    const docRef = this.path.userFilterDocPath(filterId);
    await FirebaseFirestore.deleteDocument({reference: docRef,});
  }

  async changeFilter(filter:Filter){
    this.currentFilter = filter;
    this.currentFilter$.next(filter);
  }

  async getDefaultFilter(){
    const result = await FirebaseFirestore.getCollection<Filter>({
      reference: this.path.userFilterCollectionPath(),
      compositeFilter : {
        type: 'and',
        queryConstraints:[
          {
            type: 'where',
            fieldPath: 'isDefaultFilter',
            opStr: '==',
            value: true,
          }
        ]
      }
    });

    if(result && result.snapshots.length > 0)
    {
      const filter = result.snapshots[0].data;
      if(filter)
        filter.id = result.snapshots[0].id;
      return filter
    }

    return undefined;
  }
  async checkOtherDefaultFilterExist(filterId: string): Promise<Filter | undefined>{
    const defaultFilter = await this.getDefaultFilter();

    if (defaultFilter && defaultFilter.id !== filterId) 
      return defaultFilter;
    
    return undefined;   
  }

  async updateFilter(filter: Filter){

    const docRef = this.path.userFilterDocPath(filter.id);

    if(!filter.selectedBankAccIds || filter.selectedBankAccIds.length <= 0)
      filter.selectedBankAccIds = [];

    if(!filter.selectedCategoryIds || filter.selectedCategoryIds.length <= 0)
      filter.selectedCategoryIds = [];

    await FirebaseFirestore.updateDocument({
      reference: docRef,
      data: <Filter>{ 
        id : filter.id ?? "",
        title : filter.title ?? "",
        startDate : filter.startDate ?? "",
        endDate : filter.endDate ?? "",
        dateMode : filter.dateMode ?? "all",
        customMonthStart : filter.customMonthStart ?? 1,
        customMonthEnd : filter.customMonthEnd ?? 31,
        isDefaultFilter : filter.isDefaultFilter,
        customMonthStartModifier : filter.customMonthStartModifier ?? "",
        customMonthEndModifier : filter.customMonthEndModifier ?? "",
        selectedBankAccIds: filter.selectedBankAccIds.map(account => ({
          bankId: account.bankId,
          accId: account.accId,
          state: account.state,
        })),
        selectedCategoryIds : filter.selectedCategoryIds.map(cat => ({
          catId: cat.catId,
          state: cat.state
        })),
      },
    });
  }

  async saveFilter(filter: Filter){
    
    if(!filter.selectedBankAccIds || filter.selectedBankAccIds.length <= 0)
      filter.selectedBankAccIds = [];

    if(!filter.selectedCategoryIds || filter.selectedCategoryIds.length <= 0)
      filter.selectedCategoryIds = [];

    await FirebaseFirestore.addDocument({
      reference: this.path.userFilterCollectionPath(),
      data:  <Filter>{ 
        id : "",
        title : filter.title ?? "",
        startDate : filter.startDate ?? "",
        endDate : filter.endDate ?? "",
        dateMode : filter.dateMode ?? "all",
        customMonthStart : filter.customMonthStart ?? 1,
        customMonthEnd : filter.customMonthEnd ?? 31,
        isDefaultFilter : filter.isDefaultFilter,
        customMonthStartModifier : filter.customMonthStartModifier ?? "",
        customMonthEndModifier : filter.customMonthEndModifier ?? "",
        selectedBankAccIds: filter.selectedBankAccIds.map(account => ({
          bankId: account.bankId,
          accId: account.accId,
          state: account.state,
        })),
        selectedCategoryIds : filter.selectedCategoryIds.map(cat => ({
          catId: cat.catId,
          state: cat.state
        })),
      },
    });
  }

  resetFiltersSub(){
    if(this.filtersSub)
    {
      this.filtersSub.unsubscribe();
      this.filtersSub = null;
    }
  }

  async getFilterToEdit(){
    return this.getFilterDetail(this.filterIdToEdit);
  }
}