import { FormControl, FormGroup } from "@angular/forms";
import { SelectState } from "../../models/select-state.enum";

export class FilterCategoryForm extends FormGroup {
  constructor(catId:string,state:SelectState){
    super({
      catId: new FormControl(catId),
      state: new FormControl(state),
    })

  }

  get catIdFc() {
    return this.get("catId") as FormControl<string>;
  }

  get stateFc(){
    return this.get("state") as FormControl<SelectState>;
  }
}