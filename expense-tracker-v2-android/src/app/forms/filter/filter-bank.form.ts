import { FormControl, FormGroup } from "@angular/forms";
import { SelectState } from "../../models/select-state.enum";

export class FilterBankForm extends FormGroup {
  constructor(bankId:string,accId:string,state:SelectState){
    super({
      bankId: new FormControl<string>(bankId),
      accId: new FormControl<string>(accId),
      state: new FormControl<SelectState>(state)
    })
  }

  get bankIdFc(){
    return this.get("bankId") as FormControl<string>;
  }
  get accIdFc(){
    return this.get("accId") as  FormControl<string>;
  }

  get stateFc(){
    return this.get("state") as FormControl<SelectState>;
  }
}