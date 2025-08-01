import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, startWith, Subject, takeUntil } from 'rxjs';
import { AccountNormalized } from '../../models/account-normalized.model';
import { FilterBankForm } from '../../forms/filter/filter-bank.form';
import { FormArray } from '@angular/forms';
import { SelectState } from '../../models/select-state.enum';
import { BankImgComponent } from "../bank-img/bank-img.component";

@Component({
  schemas : [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-account-picker',
  imports: [CommonModule, BankImgComponent],
  templateUrl: './account-picker.component.html',
  styleUrl: './account-picker.component.scss',
})
export class AccountPickerComponent implements OnInit, OnDestroy{

  @Input() inputAccounts$ : BehaviorSubject<AccountNormalized[]> | null = null;
  @Input() bankAccFormArray : FormArray<FilterBankForm> | null = null;
  @Input() multiSelect = true;
  @Input() onlyInclude = false;
  accounts : AccountNormalized[] = []
  accounts$ = new BehaviorSubject<AccountNormalized[]>([]);
  selectState = SelectState;
  destroy$ = new Subject<void>();
  ngOnInit(): void {
    if(this.inputAccounts$){
      this.inputAccounts$
      .pipe(
        takeUntil(this.destroy$)
      ).subscribe((list)=>{
        this.accounts = list;
        this.accounts$.next(this.accounts);
      })
    }

    if(this.bankAccFormArray){
      this.bankAccFormArray.valueChanges
      .pipe(
        startWith(this.bankAccFormArray.value),
        takeUntil(this.destroy$)
      )
      .subscribe((list:AccountNormalized[])=>{
        list.forEach((item)=>{
          const acc = this.accounts.find((x)=>x.accId === item.accId && x.bankId === item.bankId);
          if(acc)
            acc.state = item.state;
        })

        if(list.length === 0){
          this.accounts.forEach((item)=>{
            item.state = SelectState.none;
          })
        }

        this.accounts$.next(this.accounts);
      })
    }
  }

  ngOnDestroy(): void {
    if(this.destroy$){
      this.destroy$.next();
      this.destroy$.complete();
    }
  }

  handleBankSelected(bankId:string,accId:string){
    const newList = this.accounts.map((item)=> {return {...item}}); // Also fix shallow copy issue

    newList.forEach(item => {
      if (item.bankId === bankId && item.accId === accId) {
        item.state = this.updateState(item.state);
      } else if (!this.multiSelect) {
        item.state = SelectState.none;
      }
    });
    
    this.updateBankAccFormArray(newList);
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

  updateBankAccFormArray(list:AccountNormalized[]){
    if(!this.bankAccFormArray) return;

    const filteredList = list.filter((item)=>item.state === SelectState.exclude || item.state === SelectState.include).map((x)=> {return x});

    this.bankAccFormArray.clear();
    filteredList.forEach((item)=>{
      this.bankAccFormArray?.push(new FilterBankForm(item.bankId,item.accId,item.state));
    })
  }
}
