import { FormControl, FormGroup } from "@angular/forms";

export class Category {
  public id = "";
  constructor(
    public name: string,
    public iconName: string) {}
}

export class AddCategoryForm extends FormGroup {
  constructor(){
    super({
      name : new FormControl(""),
      iconName : new FormControl(""),
    });
  }

  get nameFc() {
    return this.get("name");
  }

  get iconNameFc(){
    return this.get("iconName");
  }
}