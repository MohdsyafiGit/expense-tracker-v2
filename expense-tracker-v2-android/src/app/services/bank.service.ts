import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { Bank } from "../models/bank.model";
import { FirebaseFirestore } from "@capacitor-firebase/firestore";
import { FirebasePathBuilderService } from "./firebase-path-builder.service";
import { FirebaseStorage, UploadFileOptions } from "@capacitor-firebase/storage";
import { BankPic } from "../models/bank-pic.model";
import { Expense } from "../models/expense.model";
import { AuthService } from "./auth.service";

@Injectable({
    providedIn : "root"
})
export class BankService {

  private banks : Bank[] = [];
  public banks$ = new BehaviorSubject<Bank[]>([]);
  private banksSub : Subscription | null = null;
  bankPictures: Map<string, string> = new Map();
  bankPictures$ = new BehaviorSubject<Map<string, string>>(new Map());

  constructor(private path: FirebasePathBuilderService,private authService : AuthService){

    this.authService.user$.subscribe((user)=>{
      if(!user){
        this.resetBanksSub();
        this.banks = [];
        this.banks$.next([]);
        this.bankPictures = new Map();
        this.bankPictures$.next(new Map());
      }else{
        this.resetBanksSub();
        this.banksSub = this.getBanks().subscribe();
      }
    })
  }
  private getBanks() : Observable<Bank[]>{
    return new Observable<Bank[]>( (obs)=>{

        let callBackId = "";
        const pathRef = this.path.userBankCollectionPath();
        try{
          const setupListener = async ()=>{
            callBackId = await  FirebaseFirestore.addCollectionSnapshotListener({
                  reference : pathRef,
              }, (event,error)=>{

                  if(error){
                      obs.error(error)
                  }else if(event){
                      const list: Bank[] = event.snapshots.map((item) => ({...item.data,id:item.id} as Bank));
                      this.banks = list;
                      obs.next(list);
                      this.banks$.next(this.banks);
                  }
              })
          }

          setupListener();
        }catch(err){
          console.error(err);
        }
        return ()=>{
          if(callBackId)
            FirebaseFirestore.removeSnapshotListener({callbackId : callBackId});
        }
    }
    )
  }

  async getBank(bank:Bank){

    const docRef = this.path.userBankDocPath(bank.id);
    const { snapshot } = await FirebaseFirestore.getDocument<Bank>({
      reference: docRef,
    });
    return snapshot;
  }
  async getBankPicUrl(picName:string){
    const { downloadUrl } = await FirebaseStorage.getDownloadUrl({ path: this.path.userBankImagePath(picName),});
    this.bankPictures.set(picName,downloadUrl);
    this.bankPictures$.next(this.bankPictures);

    return downloadUrl ?? "";
  }

  async addBank(bank: Bank, file:BankPic) {
    
    await FirebaseFirestore.addDocument({
      reference: this.path.userBankCollectionPath(),
      data: <Bank>{ 
        id: "",
        bankName: bank.bankName,
        picName: bank.picName ?? "",
        picUrl: "",
        accounts: bank.accounts.map(account => ({
          id: account.id,
          name: account.name
        }))
      },
    });

    await this.uploadPic(file);
  }

  async updateBank(bank: Bank, file:BankPic, oldPicName:string) {
    
    const bankToUpdate = await this.getBank(bank);

    if(bankToUpdate){
      const accounts = bankToUpdate.data?.accounts.map((x)=>x.id) ?? []
      const isAccInUse = await this.bankInUse(accounts);
      if(isAccInUse)
        return "Account in use, not allowed to update";
    }

    const docRef = this.path.userBankDocPath(bank.id);

    await FirebaseFirestore.updateDocument({
      reference: docRef,
      data: <Bank>{ 
        id: "",
        bankName: bank.bankName,
        picName: bank.picName ?? "",
        picUrl: "",
        accounts: bank.accounts.map(account => ({
          id: account.id,
          name: account.name
        }))
      },
    });

    if(oldPicName){
      await this.deleteBankPic(oldPicName).catch((err)=>{
        console.log(err);
      });

      await this.uploadPic(file);
    }
    
    return "";
  }

  async uploadPic(file: BankPic): Promise<string> {

    const fileOption: UploadFileOptions = {
        path: this.path.userBankImagePath(file.fileName),
        uri: file.androidUri,
    };
  
    if (!fileOption) return "";
  
    return new Promise<string>((resolve, reject) => {
      FirebaseStorage.uploadFile(
        fileOption,
        async (event, error) => {
          if (error) {
            console.log(error);
            reject(error);
          } else if (event?.completed) {
            try {
              const picUrl = await this.getBankPicUrl(file.fileName);
              resolve(picUrl);
            } catch (err) {
              reject(err);
            }
          }
        }
      );
    });
  }

  async deleteBankPic(picName:string){
    await FirebaseStorage.deleteFile({
      path: this.path.userBankImagePath(picName),
    });
  }

  async bankInUse(accounts:string[]){
    const { snapshots : expensesSnapShot } = await FirebaseFirestore.getCollection<Expense>({
      reference: this.path.userExpensesCollectionPath(),
      compositeFilter: {
        type: 'and',
        queryConstraints: [
          {
            type: 'where',
            fieldPath: 'accId',
            opStr: 'in',
            value: accounts,
          },
        ],
      },
    });

    if(expensesSnapShot && expensesSnapShot.length > 0){
      return true;
    }
      return false
  }

  async deleteBank(bank:Bank){

    const bankToDelete = await this.getBank(bank);

    if(bankToDelete){
      const accounts = bankToDelete.data?.accounts.map((x)=>x.id) ?? []
      const isAccInUse = await this.bankInUse(accounts);
      if(isAccInUse)
        return "Account in use, not allowed to update";
    }

    const docRef = this.path.userBankDocPath(bank.id);
    await FirebaseFirestore.deleteDocument({reference: docRef,});

    return "";
  }

  resetBanksSub(){
    if(this.banksSub)
    {
      this.banksSub.unsubscribe();
      this.banksSub = null;
    }
  }
}