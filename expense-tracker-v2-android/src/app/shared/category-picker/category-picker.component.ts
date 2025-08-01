import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnDestroy, OnInit, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from "@ionic/angular/standalone";
import { SelectCategory } from '../../models/select-category.model';
import { SelectState } from '../../models/select-state.enum';
import { FilterCategoryForm } from '../../forms/filter/filter-category.form';
import { FormArray } from '@angular/forms';
import { BehaviorSubject, startWith, Subject, takeUntil } from 'rxjs';

@Component({
  schemas :[CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-category-picker',
  imports: [IonIcon, CommonModule],
  templateUrl: './category-picker.component.html',
  styleUrl: './category-picker.component.scss',
})
export class CategoryPickerComponent implements OnInit , OnDestroy{

  @Input() inputCategories$ : BehaviorSubject<SelectCategory[]> | null = null;
  @Input() categoryFormArray : FormArray<FilterCategoryForm> | null = null;
  @Input() multiSelect = true;
  @Input() onlyInclude = false;
  categories : SelectCategory[] = []
  categories$ = new BehaviorSubject<SelectCategory[]>([]);
  selectState = SelectState;
  destroy$ = new Subject<void>();
  ngOnInit(): void {

    if(this.inputCategories$){
      this.inputCategories$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value)=>{
        this.categories = value;
        this.categories$.next(this.categories);
      })
    }

    if(this.categoryFormArray){
      this.categoryFormArray?.valueChanges
      .pipe(
        startWith(this.categoryFormArray.value),
        takeUntil(this.destroy$))
      .subscribe((list :{catId:string,state:SelectState}[])=>{

        list.forEach((item)=>{
          const cat = this.categories.find((x)=>x.category.id === item.catId);
          if(cat)
            cat.state = item.state;
        })

        if(list.length === 0){
          this.categories.forEach((item)=>{
            item.state = SelectState.none;
          })
        }

        this.categories$.next(this.categories);
      })
    }
  }

  ngOnDestroy(): void {
    if(this.destroy$){
      this.destroy$.next();
      this.destroy$.complete();
    }
  }

  handleCategorySelected(catId: string) {
    const newList = this.categories.map(item => ({ ...item }));
    
    newList.forEach(item => {
      if (item.category.id === catId) {
        item.state = this.updateState(item.state);
      } else if (!this.multiSelect) {
        item.state = SelectState.none;
      }
    });
    
    this.updateCategoryFormArray(newList);
  }

  updateState(currentState: SelectState): SelectState {
    switch (currentState) {
      case SelectState.exclude:
        return SelectState.none;
      case SelectState.include:
        return this.onlyInclude ? SelectState.none : SelectState.exclude;
      case SelectState.none:
        return SelectState.include;
      default:
        return SelectState.none;
    }
  }

  updateCategoryFormArray(input:SelectCategory[]){
    if (!this.categoryFormArray) return;

    const filteredItems = input
      .filter((item) => item.state === SelectState.exclude || item.state === SelectState.include)
      .map(item => ({
        catId: item.category.id,
        state: item.state,
      }));

    // Clear and recreate all controls
    this.categoryFormArray.clear();
    filteredItems.forEach((item) => {
      if(this.categoryFormArray)
        this.categoryFormArray.push(new FilterCategoryForm(item.catId,item.state));
    });
  }
}
