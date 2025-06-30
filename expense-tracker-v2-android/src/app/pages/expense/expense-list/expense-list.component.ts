import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonAccordionGroup, IonAccordion, IonItem, IonModal, ModalController } from "@ionic/angular/standalone";
import { Observable } from 'rxjs';
import { GroupExpense } from '../../../models/group-expense.model';
import { CategoryIconComponent } from '../../../shared/category-icon/category-icon.component';
import { AccountDetailComponent } from '../../../shared/account-detail/account-detail.component';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';

@Component({
  selector: 'app-expense-list',
  imports: [IonItem, IonAccordion, IonAccordionGroup, CommonModule, CategoryIconComponent , AccountDetailComponent],
  templateUrl: './expense-list.component.html',
  styleUrl: './expense-list.component.scss',
})
export class ExpenseListComponent {
  @Input() expenses$! : Observable<GroupExpense[]>;
  @ViewChild(IonModal) modal: IonModal | undefined;
  @Input() editable = false;

  constructor(private modalCtrl:ModalController){

  }
  async handleClickExpense(expenseId:string){
    const modal  = await this.modalCtrl.create({
      component : ExpenseFormComponent,
      componentProps : {
        isEdit : true,
        expenseId : expenseId,
      }
    })
    modal.present();
  }
}
