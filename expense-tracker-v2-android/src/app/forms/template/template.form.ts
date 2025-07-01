import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { FilterCategoryForm } from "../filter/filter-category.form";
import { FilterBankForm } from "../filter/filter-bank.form";

export class TemplateForm extends FormGroup {
  constructor(){
    super({
      id: new FormControl<string>(""),
      templateTitle: new FormControl<string>(""),
      expenseTitle: new FormControl<string>(""),
      price: new FormControl<number>(0),
      selectedCategoryIds: new FormArray<FilterCategoryForm>([]),
      selectedBankAccIds: new FormArray<FilterBankForm>([]),
      dateTime: new FormControl<string>(""),
    })
  }

  get idFc(){
    return this.get("id") as FormControl<string>;
  }

  get templateTitleFc(){
    return this.get("templateTitle")as FormControl<string>;
  }

   get expenseTitleFc(){
    return this.get("expenseTitle")as FormControl<string>;
  }

  get priceFc(){
    return this.get("price") as FormControl<number>;
  }

  get selectedCategoryIdsFc(){
    return this.get("selectedCategoryIds") as FormArray<FilterCategoryForm>;
  }

  get selectedBankAccIdsFc(){
    return this.get("selectedBankAccIds") as FormArray<FilterBankForm>;
  }

  get dateTimeFc(){
    return this.get("dateTime") as FormControl<string>;
  }
}