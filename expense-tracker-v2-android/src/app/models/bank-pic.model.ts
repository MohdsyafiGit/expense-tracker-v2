export class BankPic {
  public id = "";
  constructor(
    public fileName:string,
    public fileBlob:Blob,
    public androidUri: string,
  ){}
}