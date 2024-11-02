import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
@Injectable({
  providedIn: "root",
})
export class ApiService {
  baseUrl :string = environment.BASE_URL ?? ""
  constructor(private http:HttpClient) {
    console.log({baseUrl: this.baseUrl})
  }
  createRootFolder(){
    return this.http.get(`${this.baseUrl}folder/rootFolder`)
  }
  createSubFolder(data:any){
    console.log('data',data);

    return this.http.post(`${this.baseUrl}folder/create`,{name:data.name,parentId:data.parentId})
  }
  createFile(data:any){
    
    return this.http.post(`${this.baseUrl}file/create`,{name:data.name,folderId:data.parentId})
  }
  getFolder(folderId:string){
    
    return this.http.post(`${this.baseUrl}folder/show`,{folderId})

  }  
  edit(data:any){
    console.log('data',data);
    
    return this.http.post(`${this.baseUrl}folder/update/${data.id}`,{name:data.name})

  }
  deleteFileNode(id:string){
    const folderId = id
    return this.http.post(`${this.baseUrl}file/delete/${folderId}`,{})

  }
  deleteFolderNode(id:string){
    const folderId = id
    return this.http.post(`${this.baseUrl}folder/delete/${folderId}`,{})

  }
}