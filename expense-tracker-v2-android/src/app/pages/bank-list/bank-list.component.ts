import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Bank } from '../../models/bank.model';
import { BankService } from '../../services/bank.service';
import { IonAccordion, IonAccordionGroup, IonItem, IonLabel, IonCard, IonModal, IonIcon, IonButton, IonContent, } from "@ionic/angular/standalone";
import { BankImgComponent } from '../../shared/bank-img/bank-img.component';
import { AddBankComponent } from './add-bank/add-bank.component';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline } from 'ionicons/icons';
import { LoadingService } from '../../services/loading.service';
import { Dialog } from '@capacitor/dialog';
@Component({
  selector: 'app-bank-list',
  imports: [IonContent, IonButton, IonIcon, IonModal, IonCard, IonLabel, IonItem, IonAccordionGroup, IonAccordion, CommonModule, BankImgComponent, AddBankComponent],
  templateUrl: './bank-list.component.html',
  styleUrl: './bank-list.component.scss',
})
export class BankListComponent {
  @ViewChild(IonModal) modal: IonModal | undefined;
  banks$ : Observable<Bank[]>;
  constructor(private bankService : BankService, private loadingService :LoadingService){
    this.banks$ = this.bankService.banks$;
    addIcons({trashOutline,addOutline})
  }

  closeModal(){
    if(this.modal)
      this.modal.dismiss(null, 'cancel');
  }

  closeModalEdit(modal: IonModal){
    if(modal)
      modal.dismiss(null, 'cancel');
  }

  async deleteBank(bank:Bank){
    await this.loadingService.beginLoading();
    const res = await this.bankService.deleteBank(bank);
    if(res){
      await Dialog.alert({
        title : "Error",
        message : res,
      })
    }
    await this.loadingService.endLoading();
  }
}
