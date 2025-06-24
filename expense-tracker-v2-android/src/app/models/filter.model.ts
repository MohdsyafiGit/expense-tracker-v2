import { SelectState } from "./select-state.enum";

export class Filter{
  public id = "";
  public selectedCategoryIds : {catId:string,state:SelectState}[] = []
  public selectedBankAccIds : {bankId:string,accId:string,state:SelectState}[] = []
  constructor(
    public title : string,
    public startDate : string,
    public endDate : string,
    public dateMode : string,
    public customMonthStart : number,
    public customMonthEnd : number,
    public isDefaultFilter : boolean,
    public customMonthStartModifier : string,
    public customMonthEndModifier : string,
  ){}
}




