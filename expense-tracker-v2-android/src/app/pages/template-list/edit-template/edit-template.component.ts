import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonButtons, IonButton, IonContent, IonList, IonItem, IonInput, IonLabel, IonToggle, IonDatetime, ModalController, ToggleCustomEvent } from "@ionic/angular/standalone";
import { CategoryPickerComponent } from '../../../shared/category-picker/category-picker.component';
import { AccountPickerComponent } from '../../../shared/account-picker/account-picker.component';
import { ReactiveFormsModule } from '@angular/forms';
import { TemplateForm } from '../../../forms/template/template.form';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { AccountNormalized } from '../../../models/account-normalized.model';
import { SelectCategory } from '../../../models/select-category.model';
import { SelectState } from '../../../models/select-state.enum';
import { BankService } from '../../../services/bank.service';
import { CategoryService } from '../../../services/category.service';
import { LoadingService } from '../../../services/loading.service';
import { TemplateService } from '../../../services/template.service';
import { Template } from '../../../models/template.model';
import { FilterCategoryForm } from '../../../forms/filter/filter-category.form';
import { FilterBankForm } from '../../../forms/filter/filter-bank.form';

@Component({
  selector: 'app-edit-template',
  imports: [
    IonDatetime, IonToggle, IonLabel, IonInput, IonItem, IonList, 
    IonContent, IonButton, IonButtons, IonToolbar, IonHeader, CommonModule,
    CategoryPickerComponent, AccountPickerComponent, ReactiveFormsModule],
  templateUrl: './edit-template.component.html',
  styleUrl: './edit-template.component.scss',
})
export class EditTemplateComponent implements OnDestroy, OnInit{
  @Input() templateToEdit!: Template;
  editTemplateFg : TemplateForm = new TemplateForm();
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
  ngOnInit(): void {
    if(this.templateToEdit){
      this.editTemplateFg.templateTitleFc.setValue(this.templateToEdit.templateTitle);
      this.editTemplateFg.expenseTitleFc.setValue(this.templateToEdit.expenseTitle);
      this.editTemplateFg.priceFc.setValue(this.templateToEdit.price);
      this.enableDefaultDate = this.templateToEdit.enableDateTime;

      if(this.enableDefaultDate){
        const localDate = new Date(this.templateToEdit.dateTime);
        const localISODate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        this.editTemplateFg.dateTimeFc.setValue(localISODate)
      }

      if(this.templateToEdit.catId){
        this.editTemplateFg.selectedCategoryIdsFc.push(new FilterCategoryForm(this.templateToEdit.catId,SelectState.include));
        this.editTemplateFg.selectedCategoryIdsFc.setValue([
          {
            catId: this.templateToEdit.catId,
            state: SelectState.include,
          }
        ])
      }

      if(this.templateToEdit.accId)
        this.editTemplateFg.selectedBankAccIdsFc.push(new FilterBankForm(this.templateToEdit.bankId,this.templateToEdit.accId,SelectState.include));

    }
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
      this.editTemplateFg.templateTitleFc.value,
      this.editTemplateFg.expenseTitleFc.value,
      this.editTemplateFg.priceFc.value,
      "",
      "",
      "",
      this.enableDefaultDate ? this.editTemplateFg.dateTimeFc.value : "", 
      this.enableDefaultDate);

      this.editTemplateFg.selectedCategoryIdsFc.controls.forEach((catForm)=>{
        if(catForm.stateFc.value === SelectState.include)
          template.catId = catForm.catIdFc.value;
      })

      this.editTemplateFg.selectedBankAccIdsFc.controls.forEach((accForm)=>{
        if(accForm.stateFc.value === SelectState.include){
          template.accId = accForm.accIdFc.value;
          template.bankId = accForm.bankIdFc.value;
        }
      })

      if(this.templateToEdit?.id)
        template.id = this.templateToEdit?.id;

      await this.templateService.updateTemplate(template);

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
