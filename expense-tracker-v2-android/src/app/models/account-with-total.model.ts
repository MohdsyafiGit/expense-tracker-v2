export class AccountWithTotal{
  public percentage = 0;
  constructor(
    public accId : string,
    public bankId : string,
    public total : number,
  ){}
}