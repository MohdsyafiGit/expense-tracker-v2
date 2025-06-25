import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { BankImgComponent } from '../bank-img/bank-img.component';
import { BankService } from '../../services/bank.service';

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss'],
  standalone: true,
  imports:[BankImgComponent, CommonModule,]
})
export class AccountDetailComponent  implements OnInit {
  private _bankId  = "";
  private _accountId  = "";

  @Input() size  = "";
  @Input() set accountId(value:string){
    if(value){
      this._accountId = value;
      this.loadDetail();
    }
  };
  get accountId(){
    return this._accountId;
  }

  @Input() set bankId(value: string) {
    if(value){
      this._bankId = value
      this.loadDetail();
    }

  };
  get bankId(): string{
    return this._bankId;
  }

  accountName = "";
  bankName = "";
  bankPicName  = "";
  constructor(private bankService: BankService) { }

  async ngOnInit() {
    if(this.accountId && this.bankId){
      await this.loadDetail();
    }

    if(!this.size)
      this.size = "small";
  }

  async loadDetail(){
    if(this.bankId && this.accountId){
      const res = await this.bankService.getBankAccountDetail(this.bankId,this.accountId);
      if(res){
        this.accountName = res.accName;
        this.bankName = res.bankName;
        this.bankPicName = res.picName;
      }
    }
  }

}
