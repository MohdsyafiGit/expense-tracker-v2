import { BankService } from './../../../services/bank.service';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild, } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { 
  IonLabel, IonContent, IonHeader, IonToolbar, IonTitle, 
  IonButtons, IonCard, IonCardHeader, IonCardContent, 
  IonIcon, IonList, IonItem, IonInput, IonSelect, IonSelectOption, IonDatetime, 
   IonModal, IonButton, IonAccordionGroup,IonAccordion, 
   ModalController, IonDatetimeButton} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { returnUpBack, add, camera, document, eye, trash, saveOutline } from 'ionicons/icons';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LocationStrategy } from '@angular/common';
import { MaskitoDirective } from '@maskito/angular';
import { MaskitoElementPredicate, MaskitoOptions } from '@maskito/core';
import { PdfJsViewerModule } from "ng2-pdfjs-viewer"; 
import { Camera, CameraResultType, Photo } from '@capacitor/camera';
import { v4 as UUID } from 'uuid';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PhotoViewer } from '@capacitor-community/photoviewer';
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

@Component({
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-expense-form',
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss'],
  standalone: true,
  imports: [IonAccordionGroup, 
    IonTitle, IonToolbar, IonHeader, FormsModule,IonAccordion,
    IonContent, IonButtons, IonCard,IonCardHeader,IonCardContent,
    IonIcon, IonList, IonItem, IonInput, PdfJsViewerModule, IonLabel,
    IonSelect, IonSelectOption, IonDatetime, CommonModule, ReactiveFormsModule,
    IonButton, BankImgComponent, MaskitoDirective]
})
export class ExpenseFormComponent implements OnInit {

  @ViewChild('IonModal') modal: ElementRef | undefined;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Input() isEdit  = false;
  @Input() expenseId  = "";
  $categories  = new  Observable<Category[]>();
  $banks   = new Observable<Bank[]>();
  $templates  = new Observable<Template[]>();
  title = "";
  price = 0.00;
  selectedCategoryId = "";
  selectedCategoryIcon = "";
  selectedAccountId = "";
  selectedBankPic = "";
  txnDateTime  = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  selectedTemplateId = "";
  templates : Template[] = [];
  readonly maskPredicate: MaskitoElementPredicate = async (el) => (el as HTMLIonInputElement).getInputElement();
  receipts : Receipt[] = [];
  receipts$ : BehaviorSubject<Receipt[]> = new BehaviorSubject<Receipt[]>([]);
  selectedFile: File | null = null;
  dateTimePresentation = "date";
  alertMsg = ""
  isAlertOpen = false;
  public alertButtons = [
    {
      text: 'OK',
      role: 'confirm',
    },
  ];
  readonly priceMask: MaskitoOptions = {
	  mask: /^\d+(\.\d{0,2})?$/, // digits and comma (as decimal separator)
    preprocessors: [
      ({elementState, data}, actionType) => {
        const {value, selection} = elementState;
        
        const strValue =  value.toString();
        return {
          elementState: {
            selection,
            value: strValue.replace(/[^\d.]/g, ''),
          },
          data: data.replace(/[^\d.]/g, ''),
        };
      },
    ],
    postprocessors: [
      ({value, selection}, initialElementState) => {
        if (value.includes('.')) {
          // Ensure 2 decimal places by padding zeroes if needed
          const [integer, decimals] = value.split('.');
          return {value:`${integer}.${(decimals || '').padEnd(2, '0')}`,selection: selection};
        }else{
          if(value.length <= 2){
            return {value:`${value}.`.padEnd(2, '0'),selection: selection};
          }else{
            return {
              value: value,
              selection: selection,
            };
          }
        }
      },
    ],
  };

  constructor(
    private expenseService:ExpenseService,
    private categoryService : CategoryService,
    private bankService : BankService,
    private router:Router,
    private modalController: ModalController) { 
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

          console.log(this.receipts);
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

    this.$templates =  this.expenseService.getTemplatesObservable().pipe(
      tap((list)=>{
        this.templates = list;
    }));

    this.$categories = this.categoryService.categories$;
    this.$banks = this.bankService.banks$;

  }

  handleSave(){
    const bankId = this.bankService.getBankId(this.selectedAccountId);
    const expense: Expense = new Expense(this.title,+this.price,this.selectedCategoryId,bankId,this.selectedAccountId,this.txnDateTime);

    if(!this.isEdit)
      this.expenseService.addExpense(expense,this.receipts);
    else{
      expense.id = this.expenseId;
      this.expenseService.updateExpense(expense,this.receipts);
    }

    this.goBack();
  }

  async handleCategoryChange(selectedCatEvent:any){
    this.selectedCategoryIcon = await this.categoryService.getCategoryIconName(selectedCatEvent.target.value);
  }

  handleBankChange(selectedBankEvent:any){
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

  handleTemplateChange(selectedTemplateEvent:any){

    if(!this.templates || this.templates.length <= 0)
      return;

    const res = this.templates.find((item)=>item.id === selectedTemplateEvent.target.value);

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
    this.receipts.push(savedFile);
    this.receipts$.next(this.receipts);

  };
  
  private async savePicture(photo: Photo) {
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();
    const fileName = UUID() + '.' + photo.format;

    return {fileName:fileName,fileBlob:blob,androidUri:photo.path,webPath:photo.webPath,isPdf:false} as Receipt;
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
    
    const urlString = receipt.firebaseUrl.toString() ?? receipt.webPath

    if(!urlString){
      this.alertMsg = "Error, unable to load image viewer"
      this.isAlertOpen = true;
      return;
    }

    const echo = await PhotoViewer.show({
      images: [{
        url:  urlString,
        title: receipt.fileName,

      }],
      mode: 'one',
      
    })

    const eventListener = await (PhotoViewer as any).addListener('jeepCapPhotoViewerExit', (eventData: any) => 
    {
      this.closeModal();
      console.log(eventData);
    });
  }

  closeModal(){
    console.log(this.modal);
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