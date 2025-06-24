import { Category } from "./category.model";
import { SelectState } from "./select-state.enum";

export class SelectCategory{
  constructor(
    public category:Category,
    public state:SelectState
  ){}
}