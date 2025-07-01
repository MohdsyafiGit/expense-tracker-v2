import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonButtons, IonToolbar, IonButton, ModalController, IonContent, IonList, IonItem, IonInput, IonLabel, IonToggle, IonDatetime, ToggleCustomEvent } from "@ionic/angular/standalone";
import { TemplateForm } from '../../../forms/template/template.form';
import { ReactiveFormsModule } from '@angular/forms';
import { Template } from '../../../models/template.model';
import { TemplateService } from '../../../services/template.service';
import { SelectState } from '../../../models/select-state.enum';
import { LoadingService } from '../../../services/loading.service';
import { CategoryPickerComponent } from '../../../shared/category-picker/category-picker.component';
import { AccountPickerComponent } from '../../../shared/account-picker/account-picker.component';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { AccountNormalized } from '../../../models/account-normalized.model';
import { SelectCategory } from '../../../models/select-category.model';
import { CategoryService } from '../../../services/category.service';
import { BankService } from '../../../services/bank.service';

@Component({
  selector: 'app-add-template',
  imports: [
    IonDatetime, IonToggle, IonLabel, IonInput, IonItem, 
    IonList, IonContent, IonButton, IonToolbar, IonButtons, 
    IonHeader, CommonModule, ReactiveFormsModule,
    CategoryPickerComponent, AccountPickerComponent],
  templateUrl: './add-template.component.html',
  styleUrl: './add-template.component.scss',
})
export class AddTemplateComponent implements OnDestroy {

  addTemplateFg : TemplateForm = new TemplateForm();
  categories$  = new BehaviorSubject<SelectCategory[]>([]);
  bankAccounts$  = new BehaviorSubject<AccountNormalized[]>([]);
  enableDefaultDate = false;
  destroy$ = new Subject<void>();

  constructor(
    private modalCtrl:ModalController,
    private templateService:TemplateService,
    private loadingService : LoadingService,
    private categoryService: CategoryService,
    private bankService : BankService
  ){
    this.categoryService.categories$
      .pipe(
        takeUntil(this.destroy$))
      .subscribe((list)=>{
        const mappedList = list.map((item) => new SelectCategory(item,SelectState.none));
        this.categories$.next(mappedList);
      })

    this.bankService.banks$
      .pipe(
        takeUntil(this.destroy$))
      .subscribe((list)=>{
        const mappedList = list.reduce((prev,curr) =>{
          curr.accounts.forEach((acc)=>{
            prev.push(new AccountNormalized(curr.id,acc.id,curr.picName,curr.bankName,acc.name,SelectState.none));
          })
          return prev;
        } ,[] as AccountNormalized[]);

        this.bankAccounts$.next(mappedList);
    })

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cancel(){
    this.modalCtrl.dismiss();
  }

  async confirm(){
    try{

      await this.loadingService.beginLoading();

      const template: Template = new Template(
      this.addTemplateFg.templateTitleFc.value,
      this.addTemplateFg.expenseTitleFc.value,
      this.addTemplateFg.priceFc.value,
      "",
      "",
      "",
      this.enableDefaultDate ? this.addTemplateFg.dateTimeFc.value : "", 
      this.enableDefaultDate);

      this.addTemplateFg.selectedCategoryIdsFc.controls.forEach((catForm)=>{
        if(catForm.stateFc.value === SelectState.include)
          template.catId = catForm.catIdFc.value;
      })

      this.addTemplateFg.selectedBankAccIdsFc.controls.forEach((accForm)=>{
        if(accForm.stateFc.value === SelectState.include){
          template.accId = accForm.accIdFc.value;
          template.bankId = accForm.bankIdFc.value;
        }
      })

      await this.templateService.addTemplate(template);

      await this.loadingService.endLoading();
      this.modalCtrl.dismiss();
    }catch(err){
      console.log(err);
      await this.loadingService.endLoading();
    }
  }

  async handleDateToggleChange(toggle: ToggleCustomEvent) {
    this.enableDefaultDate = toggle.detail.checked;
  }
}
