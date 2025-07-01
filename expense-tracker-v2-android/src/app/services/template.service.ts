import { Injectable } from "@angular/core";
import { Template } from "../models/template.model";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { FirebasePathBuilderService } from "./firebase-path-builder.service";
import { FirebaseFirestore } from "@capacitor-firebase/firestore";
import { AuthService } from "./auth.service";

@Injectable({
    providedIn : "root"
})
export class TemplateService {

private templates : Template[] = [];
public templates$ = new BehaviorSubject<Template[]>([]);
private templatesSub : Subscription | null = null;

  constructor(
    private path:FirebasePathBuilderService,
    private authService : AuthService
  ){
      this.authService.user$.subscribe((user)=>{
      if(!user){
        this.resetTemplatesSub();
        this.templates = [];
        this.templates$.next([]);
      }else{
        this.resetTemplatesSub();
        this.templatesSub = this.getTemplates().subscribe();
      }
    })
  }

  private getTemplates() : Observable<Template[]>{
      return new Observable<Template[]>( (obs)=>{

          let callBackId = "";
          const pathRef = this.path.userTemplateCollectionPath();
          try{
            const setupListener = async ()=>{
              callBackId = await  FirebaseFirestore.addCollectionSnapshotListener<Template>({
                    reference : pathRef,
                }, (event,error)=>{

                    if(error){
                        obs.error(error)
                    }else if(event){
                      const templates = event.snapshots.map((item) => ({...item.data, id: item.id} as Template));

                      if(templates){
                        this.templates = templates;
                        this.templates$.next(this.templates);
                      }
                    }
                })
            }

            setupListener();
          }catch(err){
            console.error(err);
          }
          return ()=>{
            if(callBackId)
              FirebaseFirestore.removeSnapshotListener({callbackId : callBackId});
          }
      }
      )
  }

  resetTemplatesSub(){
    if(this.templatesSub)
    {
      this.templatesSub.unsubscribe();
      this.templatesSub = null;
    }
  }

  async getTemplateDetail(id:string){
    const docRef = this.path.userTemplateDocPath(id);
    const { snapshot } = await FirebaseFirestore.getDocument<Template>({
      reference: docRef,
    });
    return {...snapshot.data,id:snapshot.id} as Template;
  }

  async addTemplate(template:Template){
    await FirebaseFirestore.addDocument({
      reference: this.path.userTemplateCollectionPath(),
      data: <Template> { 
        id: "",
        templateTitle: template.templateTitle,
        expenseTitle: template.expenseTitle,
        price: template.price,
        catId: template.catId,
        bankId : template.bankId,
        accId: template.accId,
        dateTime: template.dateTime,
        enableDateTime : template.enableDateTime
      },
    });
  }

  async updateTemplate(template:Template){
    const docRef = this.path.userTemplateDocPath(template.id);
    await FirebaseFirestore.updateDocument({
      reference: docRef,
      data: <Template>{ 
        id: template.id,
        templateTitle: template.templateTitle,
        expenseTitle: template.expenseTitle,
        price: template.price,
        catId: template.catId,
        bankId : template.bankId,
        accId: template.accId,
        dateTime: template.dateTime,
        enableDateTime : template.enableDateTime
      },
    });
  }

  async deleteTemplate(id:string){
    const docRef = this.path.userTemplateDocPath(id);
    await FirebaseFirestore.deleteDocument({
      reference: docRef,
    });
  }
}