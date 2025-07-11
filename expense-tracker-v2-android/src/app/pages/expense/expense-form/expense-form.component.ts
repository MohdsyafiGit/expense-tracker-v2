import { BankService } from './../../../services/bank.service';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild, } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { 
  IonLabel, IonContent, IonHeader, IonToolbar, IonTitle, 
  IonButtons, IonCard, IonCardHeader, IonCardContent, 
  IonIcon, IonList, IonItem, IonInput, IonSelect, IonSelectOption, IonDatetime, 
   IonModal, IonButton, IonAccordionGroup,IonAccordion, 
   ModalController} from '@ionic/angular/standalone';
import {  Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { returnUpBack, add, camera, document, eye, trash, saveOutline } from 'ionicons/icons';
import { BehaviorSubject, Observable } from 'rxjs';
import { PdfJsViewerModule } from "ng2-pdfjs-viewer"; 
import { Camera, CameraResultType, Photo } from '@capacitor/camera';
import { v4 as UUID } from 'uuid';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { capShowResult, PhotoViewer } from '@capacitor-community/photoviewer';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { BankImgComponent } from '../../../shared/bank-img/bank-img.component';
import { Bank } from '../../../models/bank.model';
import { Category } from '../../../models/category.model';
import { Expense } from '../../../models/expense.model';
import { ExpenseService } from '../../../services/expense.service';
import { Template } from '../../../models/template.model';
import { CategoryService } from '../../../services/category.service';
import { Receipt } from '../../../models/receipt.model';
import { IonSelectCustomEvent, SelectChangeEventDetail } from '@ionic/core';
import { TemplateService } from '../../../services/template.service';
import { LoadingService } from '../../../services/loading.service';
import { NgxCurrencyDirective } from "ngx-currency";

@Component({
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-expense-form',
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss'],
  standalone: true,
  imports: [
    IonAccordionGroup, IonTitle, IonToolbar, IonHeader, FormsModule,IonAccordion,
    IonContent, IonButtons, IonCard,IonCardHeader,IonCardContent,
    IonIcon, IonList, IonItem, IonInput, PdfJsViewerModule, IonLabel,
    IonSelect, IonSelectOption, IonDatetime, CommonModule, ReactiveFormsModule,
    IonButton, BankImgComponent, NgxCurrencyDirective]
})
export class ExpenseFormComponent implements OnInit {

  @ViewChild('IonModal') modal: ElementRef | undefined;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Input() isEdit  = false;
  @Input() expenseId  = "";
  $categories  = new  Observable<Category[]>();
  $banks   = new Observable<Bank[]>();
  templates$  = new Observable<Template[]>();
  title = "";
  price = 0.00;
  selectedCategoryId = "";
  selectedCategoryIcon = "";
  selectedAccountId = "";
  selectedBankPic = "";
  txnDateTime  = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  selectedTemplateId = "";
  receipts : Receipt[] = [];
  receipts$ : BehaviorSubject<Receipt[]> = new BehaviorSubject<Receipt[]>([]);
  selectedFile: File | null = null;
  alertMsg = ""
  isAlertOpen = false;
  public alertButtons = [
    {
      text: 'OK',
      role: 'confirm',
    },
  ];

  currencyOptions = {
    align: 'left',
    allowNegative: false,
    allowZero: true,
    precision: 2,
    prefix : 'MYR '
  };

  constructor(
    private expenseService:ExpenseService,
    private categoryService : CategoryService,
    private bankService : BankService,
    private router:Router,
    private modalController: ModalController,
    private templateService: TemplateService,
    private loadingService : LoadingService) { 
    addIcons({returnUpBack,saveOutline,document,camera,trash,eye,add});
  }

  async ngOnInit(): Promise<void> {

    if(this.isEdit){
      const res = await this.expenseService.getExpenseDetail(this.expenseId);

      if(res){
        this.setExpenseDetail({title:res.title,price:res.price,catId:res.catId,accId:res.accId,dateTime:res.dateTime})

        if(res.receipts.length > 0){
          const result = await this.expenseService.getReceipts(res.receipts);
          this.receipts = result;
          this.receipts$.next(this.receipts);
        }
      }

    }
    else{
      this.title = "";
      this.price = 0;
      this.selectedCategoryId = "";
      this.selectedAccountId = "";
      this.selectedCategoryIcon = "";
      this.selectedBankPic = "";
      this.txnDateTime  = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    this.templates$ =  this.templateService.templates$
    this.$categories = this.categoryService.categories$;
    this.$banks = this.bankService.banks$;

  }

  async handleSave(){
    await this.loadingService.beginLoading();
    const bankId = this.bankService.getBankId(this.selectedAccountId);
    const expense: Expense = new Expense(this.title,+this.price,this.selectedCategoryId,bankId,this.selectedAccountId,this.txnDateTime);

    if(!this.isEdit)
      await this.expenseService.addExpense(expense,this.receipts);
    else{
      expense.id = this.expenseId;
      await this.expenseService.updateExpense(expense,this.receipts);
    }

    await this.loadingService.endLoading();
    this.goBack();
  }

  async handleCategoryChange(selectedCatEvent:IonSelectCustomEvent<SelectChangeEventDetail<string>>){
    this.selectedCategoryIcon = await this.categoryService.getCategoryIconName(selectedCatEvent.target.value);
  }

  handleBankChange(selectedBankEvent:IonSelectCustomEvent<SelectChangeEventDetail<string>>){
    const picName = this.bankService.getBankPicName(selectedBankEvent.target.value);
    this.selectedBankPic = picName;
  }

  goBack(){
    try{  
      this.modalController.dismiss();
    }catch(err){
      console.log(err);
      this.router.navigate(["/home"]);
    }
  }

  async handleTemplateChange(selectedTemplateEvent:IonSelectCustomEvent<SelectChangeEventDetail<string>>){

    const res = await this.templateService.getTemplateDetail(selectedTemplateEvent.target.value);

    if(!res)
      return

    this.setExpenseDetail({title:res.expenseTitle,price:res.price,catId:res.catId,accId:res.accId,dateTime:res.dateTime})
    
  }

  async setExpenseDetail(expenseDetail:{title:string,price:number,catId:string,accId:string,dateTime:string}){
    this.title = expenseDetail.title;
    this.price = expenseDetail.price;
    this.selectedCategoryId = expenseDetail.catId;
    this.selectedAccountId = expenseDetail.accId;
    this.selectedCategoryIcon = await this.categoryService.getCategoryIconName(this.selectedCategoryId);
    this.selectedBankPic = this.bankService.getBankPicName(this.selectedAccountId);

    if(expenseDetail.dateTime){
      const localDate = new Date(expenseDetail.dateTime);
      const localISODate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      this.txnDateTime = localISODate;
    }
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click(); // Programmatically click the hidden input
  }
  
  addReceipt= async () => {

    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri
    });

    const savedFile = await this.savePicture(image);

    if(savedFile)
      this.receipts.push(savedFile);

    this.receipts$.next(this.receipts);

  };
  
  private async savePicture(photo: Photo) {
    if(photo){
      let url = "";

      if(photo.webPath)
        url = photo.webPath;

      if(!url)
        return undefined

      const response = await fetch(url);
      const blob = await response.blob();
      const fileName = UUID() + '.' + photo.format;

      return {fileName:fileName,fileBlob:blob,androidUri:photo.path,webPath:photo.webPath,isPdf:false} as Receipt;
    }

    return undefined;
  }

  async onFileChange(event: Event) {

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile =  input.files[0]; // Returns the selected file (PDF, DOC, etc.)
    }

    let fileType = "";

    if(this.selectedFile)
      fileType = this.getFileExtensionFromMime(this.selectedFile);

    if (this.selectedFile && fileType) {
      const fileName = this.formatDateTime() + "-" + UUID() + fileType ;
      const blob = new Blob([this.selectedFile], { type: this.selectedFile.type });
      const result =  {fileName:fileName,fileBlob:blob,androidUri:'',webPath:'',isPdf:true} as Receipt;

      if (Capacitor.isNativePlatform()) {
        try {
          // Convert blob to base64
          const base64Data = await this.blobToBase64(blob);
          
          // Save to file system using Capacitor's Filesystem API
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache
          });
          
          // Set the URI for Android
          result.androidUri = savedFile.uri;

        } catch (error) {
          console.error('Error creating file:', error);
          this.alertMsg = "Error creating file";
          this.isAlertOpen = true;
          return;
        }
      }
      
      this.receipts.push(result);
      this.receipts$.next(this.receipts);
    }else{
      this.alertMsg = "Error, only pdf file is accepted"
      this.isAlertOpen = true;
      return;
    }
  }


  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data:application/pdf;base64, part
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  formatDateTime(): string {
    const now = new Date();
    
    const dd = String(now.getDate()).padStart(2, '0');  // Day
    const mm = String(now.getMonth() + 1).padStart(2, '0'); // Month (0-based index)
    const yyyy = now.getFullYear(); // Year
    const hh = String(now.getHours()).padStart(2, '0'); // Hours
    const min = String(now.getMinutes()).padStart(2, '0'); // Minutes
  
    return `${dd}${mm}${yyyy}${hh}${min}`;
  }

  getFileExtensionFromMime(file: File): string {
    const mimeToExt: { [key: string]: string } = {
      "application/pdf": ".pdf",
    };
  
    return mimeToExt[file.type] || ''; // Return extension or empty if unknown
  }

  async clickImage(receipt:Receipt) {
    
    const urlString = receipt.firebaseUrl ?? receipt.webPath

    if(!urlString){
      this.alertMsg = "Error, unable to load image viewer"
      this.isAlertOpen = true;
      return;
    }

    let echo : capShowResult | undefined = undefined
    try{
       echo = await PhotoViewer.show({
        images: [{
          url:  urlString,
          title: receipt.fileName,

        }],
        mode: 'one',
        
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (PhotoViewer as any).addListener('jeepCapPhotoViewerExit', () => 
      {
        this.closeModal();
      });

    }catch(err){
      console.error(err);
      console.log(echo?.result);
      this.alertMsg = "Error, unable to load image viewer"
      this.isAlertOpen = true;
      return;

    }

  }

  closeModal(){
    if(this.modal){
      const modal = this.modal.nativeElement as IonModal;
      modal.dismiss();
    }

  }

  setOpen(isOpen: boolean) {
    this.isAlertOpen = isOpen;
  }

  removeReceipt(receipt:Receipt){
    this.receipts =  this.receipts.filter((x)=>x.fileName !== receipt.fileName);
    this.receipts$.next(this.receipts);
  }
}