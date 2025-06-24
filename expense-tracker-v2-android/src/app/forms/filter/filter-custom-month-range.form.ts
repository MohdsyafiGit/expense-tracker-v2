import { FormControl, FormGroup } from "@angular/forms";

export class FilterCustomMonthRange extends FormGroup{
    constructor(
      start = 0,
      end= 0,
      startModifier = "",
      endModifier = ""
    ){
        super({
          start: new FormControl<number>(start),
          end: new FormControl<number>(end),
          startModifier: new FormControl<string>(startModifier),
          endModifier: new FormControl<string>(endModifier),
        })
    }

  get startFc(){
    return this.get("start") as FormControl<number>;
  }
  get endFc(){
    return this.get("end") as FormControl<number>;
  }
  get startModifierFc(){
    return this.get("startModifier") as FormControl<string>;
  }
  get endModifierFc(){
    return this.get("endModifier")as FormControl<string>;
  }
}