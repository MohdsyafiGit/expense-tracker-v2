import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
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
      .pipe(takeUntil(this.destroy$))
      .subscribe((list:AccountNormalized[])=>{
        list.forEach((item)=>{
          const acc = this.accounts.find((x)=>x.accId === item.accId && x.bankId === item.bankId);
          if(acc)
            acc.state = item.state;
        })

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
    const newList =  this.accounts.map((item)=> {return item});

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
      this.updateBankAccFormArray(newList);
  }

  updateBankAccFormArray(list:AccountNormalized[]){
    const filteredList = list.filter((item)=>item.state === SelectState.exclude || item.state === SelectState.include);

    if(this.bankAccFormArray){
      this.bankAccFormArray.clear();
      filteredList.forEach((item)=>{
        this.bankAccFormArray?.push(new FilterBankForm(item.bankId,item.accId,item.state));
      })
    }
  }
}
