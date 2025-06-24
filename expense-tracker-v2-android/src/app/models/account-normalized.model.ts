import { SelectState } from "./select-state.enum";

export class AccountNormalized{
  constructor(  
    public bankId:string,
    public accId:string,
    public picName:string,
    public bankName:string,
    public accName:string,
    public state:SelectState){}
}