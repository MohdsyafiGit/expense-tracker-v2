import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { FilterCategoryForm } from "./filter-category.form";
import { FilterBankForm } from "./filter-bank.form";
import { FilterDateRangeForm } from "./filter-date-range.form";

export class FilterForm extends FormGroup {
  constructor(){
    super({
      id: new FormControl<string>(""),
      title: new FormControl<string>(""),
      isDefaultFilter: new FormControl<boolean>(false),
      selectedCategoryIds: new FormArray<FilterCategoryForm>([]),
      selectedBankAccIds: new FormArray<FilterBankForm>([]),
      dateRange : new FilterDateRangeForm()
    })
  }

  get idFc(){
    return this.get("id") as FormControl<string>;
  }

  get titleFc(){
    return this.get("title")as FormControl<string>;
  }

  get isDefaultFilterFc(){
    return this.get("isDefaultFilter") as FormControl<boolean>;
  }

  get selectedCategoryIdsFc(){
    return this.get("selectedCategoryIds") as FormArray<FilterCategoryForm>;
  }

  get selectedBankAccIdsFc(){
    return this.get("selectedBankAccIds") as FormArray<FilterBankForm>;
  }

  get dateRangeFg(){
    return this.get("dateRange") as FilterDateRangeForm;
  }
}