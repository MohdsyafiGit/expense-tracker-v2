import { SelectState } from "./select-state.enum";

export class SelectId{
  constructor(
    public id:string,
    public state:SelectState
  ){}
}