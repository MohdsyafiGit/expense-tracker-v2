import { SelectState } from "./select-state.enum";

export class SelectAccountId {
  constructor(  
    public accId:string,
    public bankId: string,
    public state:SelectState,
  ){}
}