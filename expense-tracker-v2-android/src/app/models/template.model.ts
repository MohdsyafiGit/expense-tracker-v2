export class Template {
  public id = ""
  constructor(
    public templateTitle: string,
    public expenseTitle: string,
    public price: number,
    public catId: string,
    public bankId : string,
    public accId: string,
    public dateTime: string,
    public enableDateTime : boolean,
  ) {}
  
}