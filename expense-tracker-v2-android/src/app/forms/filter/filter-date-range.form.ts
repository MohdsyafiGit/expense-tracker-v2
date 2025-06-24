import { FormControl, FormGroup } from "@angular/forms";
import { FilterCustomMonthRange } from "./filter-custom-month-range.form";

export class FilterDateRangeForm extends FormGroup {
  constructor(
    startDate = "",
    endDate = "",
    dateMode = "",){
    super({
      startDate: new FormControl<string>(startDate),
      endDate: new FormControl<string>(endDate),
      dateMode: new FormControl<string>(dateMode),
      customMonthRange: new FilterCustomMonthRange(),
    })
  }

  get startDateFc(){
    return this.get("startDate") as FormControl<string>;
  }
  get endDateFc(){
    return this.get("endDate") as FormControl<string>;
  }

  get dateModeFc(){
    return this.get("dateMode") as FormControl<string>;
  }

  get customMonthRangeFg(){
    return this.get("customMonthRange") as FilterCustomMonthRange
  }

}