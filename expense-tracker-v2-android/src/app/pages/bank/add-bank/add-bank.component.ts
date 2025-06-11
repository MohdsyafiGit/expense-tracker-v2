import { LoadingService } from './../../../services/loading.service';
import { Component, input, OnInit, output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonButtons, IonButton, IonContent, IonCard, IonItem, IonAvatar, IonIcon, IonInput, IonLabel, IonModal, IonSpinner, ModalController } from "@ionic/angular/standalone";
import { Bank } from '../../../models/bank.model';
import { Account } from '../../../models/account.model';
import { BankPic } from '../../../models/bank-pic.model';
import { BankService } from '../../../services/bank.service';
import { addIcons } from 'ionicons';
import { addOutline, imageOutline, pencilOutline, trash } from 'ionicons/icons';
import { Dialog } from '@capacitor/dialog';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType, Photo } from '@capacitor/camera';
import { v4 as UUID } from 'uuid';

@Component({
  selector: 'app-add-bank',
  imports: [ IonLabel, IonInput, IonIcon, IonAvatar, IonItem, IonCard, IonContent, IonButton, IonButtons, IonToolbar, IonHeader, CommonModule, FormsModule],
  templateUrl: './add-bank.component.html',
  styleUrl: './add-bank.component.scss',
})
export class AddBankComponent implements OnInit{
  isPicEdited = false;
  isEdit = false;
  bankToEdit = input<Bank>();
  cancelClicked = output<void>();
  bankPicUrl = "";
  bankName = "";
  accountName = "";
  accountList: Account[] = [];
  bankPic:BankPic = new BankPic("",new Blob(),"");

  constructor(private bankService: BankService,private loadingService :LoadingService) { 
    addIcons({addOutline,imageOutline,trash,pencilOutline});
  }
  ngOnInit(): void {
    if(this.bankToEdit()){
      this.isEdit = true;
      this.bankName = this.bankToEdit()?.bankName ?? "";
      this.bankPicUrl = this.bankService.bankPictures.get(this.bankToEdit()?.picName ?? "") ?? "";
      this.accountList = this.bankToEdit()?.accounts ?? [];
      this.bankPic = new BankPic(this.bankToEdit()?.picName ?? "",new Blob(),"");
    }
  }

  takePicture = async () => {

    if(!this.bankName){
      this.displayErrorAlert("Please key in the bank name first");
      return;
    }

    if(this.isEdit)
      this.isPicEdited = true;

    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri
    });

    const savedImageFile = await this.savePicture(image);
    this.bankPic = savedImageFile;
    this.bankPicUrl = image.webPath ?? "";

  };

  private async savePicture(photo: Photo) {
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();
    const fileName = this.bankName + '-' + UUID() + '.' + photo.format;

    return {fileName:fileName,fileBlob:blob,androidUri:photo.path} as BankPic;
  }

  addNewAccount(){
    this.accountList.push(new Account(UUID(),this.accountName));
    this.accountName = "";
  }

  removeAcc(accId:string){
    this.accountList = this.accountList.filter((input)=>input.id !== accId).slice();
  }

  async confirm() {
    if(!this.bankName){
      this.displayErrorAlert("Bank Name cannot be empty");
      return;
    }

    if(this.accountList.length === 0){
      this.displayErrorAlert("Please add at least one account")
      return;
    }

    await this.loadingService.beginLoading();

    const newBank = new Bank(this.bankName,this.bankPic.fileName,this.accountList);

    if(this.isEdit)
    {
      newBank.id = this.bankToEdit()?.id ?? "";
      let oldPicName = "";
      if(this.isPicEdited)
        oldPicName = this.bankToEdit()?.picName ?? "";

      const res = await this.bankService.updateBank(newBank,this.bankPic, oldPicName );

      if(res){
        this.displayErrorAlert(res);
      }
    }
    else
      await this.bankService.addBank(newBank,this.bankPic);
    
    this.accountList = [];
    this.bankName = "";
    this.bankPicUrl = "";

    await this.loadingService.endLoading();
    this.cancelClicked.emit();
  }

  cancel(){
    this.cancelClicked.emit();
  }

  displayErrorAlert(msg:string){
    Dialog.alert({
        title: 'Error',
        message: msg,
    });
  }
}
