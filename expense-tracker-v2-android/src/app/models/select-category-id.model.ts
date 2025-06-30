import { SelectState } from "./select-state.enum";

export class SelectCategoryId{
  constructor(
    public catId:string,
    public state:SelectState
  ){}
}