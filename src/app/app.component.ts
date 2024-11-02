import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatTreeModule } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from './services/api.service';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { LucideAngularModule, FilePlus2,FolderPlus,Pencil,Trash2 } from 'lucide-angular';
import {BehaviorSubject} from 'rxjs';
export class FolderNode {
  name!: string;
  id!: string;
  children?: FolderNode[];
}

const TREE_DATA: FolderNode[] = [
];
//  interface TreeNode {
//   name: string;
//   children?: TreeNode[];
// }

export class ExampleFlatNode {
  expandable!: boolean;
  name!: string;
  level!: number;
  id!:string;
  isEditing?: boolean; 
  isAdding?: boolean;

}

const buildFolderTree = (items: any[], parentId: string | null = null): FolderNode[] => {
  const result: FolderNode[] = [];

  // Filter out folders first
  const filteredFolders = items.filter(item => item.parentId === parentId && !item.folderId);
  // Filter out files
  const filteredFiles = items.filter(item => item.folderId === parentId);

  for (const folder of filteredFolders) {
    const children = buildFolderTree(items, folder._id);
    result.push({
      name: folder.name,
      id: folder._id,
      children: children.length > 0 ? children : [],
    });
  }

  // Add files as children of the current parent
  for (const file of filteredFiles) {
    result.push({
      name: file.name,
      id: file._id,
    });
  }
  console.log({result})

  return result;
};
export class Tree{
  dataChange = new BehaviorSubject<FolderNode[]>([]);

  get data(): FolderNode[] { return this.dataChange.value; }

  constructor() {
    this.initialize();
  }

  initialize() {

    const data = this.buildFileTree(TREE_DATA, 0);

    this.dataChange.next(data);
  }

  buildFileTree(obj: {[key: string]: any}, level: number): FolderNode[] {
    return Object.keys(obj).reduce<FolderNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new FolderNode();
      node.name = key;

      if (value != null) {
        if (typeof value === 'object') {
          node.children = this.buildFileTree(value, level + 1);
        } else {
          node.name = value;
        }
      }

      return accumulator.concat(node);
    }, []);
  }

  insertItem(parent: FolderNode, folderName: string) {
    console.log('on insert item',parent)
    if (parent.children) {
      parent.children?.push({name: folderName} as FolderNode);
      console.log('afterinsert',this.data)
      this.dataChange.next(this.data);
    }
  }

  updateItem(node: FolderNode, name: string) {
    node.name = name;
    this.dataChange.next(this.data);
  }
}
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatTreeModule,
    MatIconModule,
    HttpClientModule,
    MatButtonModule,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers:[Tree]
})
export class AppComponent {
  readonly createFileIcon = FilePlus2;
  readonly createFolderIcon = FolderPlus;
  readonly createPencilIcon = Pencil;
  readonly createTrashIcon = Trash2;
  treeData = [
    {
      name: 'Root',
      children: [
        { name: 'Child 1' },
        { name: 'Child 2' }
      ]
    }
  ];
  addChild(node:any): void {
    const childName = prompt('Enter child name:');
    if (childName) {
      if (!node.children) {
        node.children = [];
      }
      node.children.push({ name: childName });
    }
  }
  title = 'fstruct-frontend';
  editingNodeName: string | null = null;
  editingNodeId: string | null = null;
  flatNodeMap = new Map<ExampleFlatNode, FolderNode>();
  nestedNodeMap = new Map<FolderNode, ExampleFlatNode>();
  private transformer = (node: FolderNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.name === node.name
        ? existingNode
        : new ExampleFlatNode();
        flatNode.name = node.name;
        flatNode.level = level;
        flatNode.expandable = !!node.children;
        flatNode.id = node.id
        this.flatNodeMap.set(flatNode, node);
        this.nestedNodeMap.set(node, flatNode);
        return flatNode;
  };

  treeControl = new FlatTreeControl<ExampleFlatNode>(
    (node) => node.level,
    (node) => node.expandable,
  );

  treeFlattener = new MatTreeFlattener(
    this.transformer,
    (node) => node.level,
    (node) => node.expandable,
    (node) => node.children
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener as any);
  editingNode: ExampleFlatNode | null = null; // To track the currently editing node
  creatingNode:boolean = false;

  // Use FormGroup to define the form and provide proper typing
  editForm: FormGroup;

  constructor(private apiService: ApiService, private fb: FormBuilder,private tree:Tree) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
      this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<ExampleFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    tree.dataChange.subscribe(data => {
      this.dataSource.data = data;
    });

    // Initialize the form with a FormControl
    this.editForm = this.fb.group({
      name: new FormControl<string>(''), 
    });
  }
  getLevel = (node: ExampleFlatNode) => node.level;

  isExpandable = (node: ExampleFlatNode) => node.expandable;

  getChildren = (node: FolderNode): FolderNode[] => node.children as any;
  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;
  hasNoContent = (_: number, _nodeData: ExampleFlatNode) => _nodeData.name==='';
  ngOnInit() {
    const rootFolderId = localStorage.getItem('rootFolder');
    console.log({rootFolderId})
    if (!rootFolderId) {
      this.apiService.createRootFolder().subscribe((res: any) => {
        console.log({res})
        localStorage.setItem('rootFolder', res.rootFolder?._id);
        console.log("first block ran")
        const param = [res.rootFolder]
        console.log({param})
        this.dataSource.data = buildFolderTree([{...res.rootFolder, children: []}])
      });
    } else {
      this.apiService.getFolder(rootFolderId).subscribe((res: any) => {
        console.log('response on init',res)
        const param = [...res.data.files,...res.data.subfolders,{...res.data.folderDetails}];
        console.log("new array",param)
        const folderTree: FolderNode[] = buildFolderTree(param);
        console.log('folder tree',folderTree)
        this.dataSource.data = folderTree
      });
    }
  }

  addNewItem(node: FolderNode, isFolder: boolean): void {
    const newName = prompt("Enter the name for the new " + (isFolder ? "folder" : "file") + ":");
  
    if (newName) {
      // Create a new FolderNode
      const newNode: FolderNode = {
        name: newName,
        id: this.generateId(), 
        children: isFolder ? [] : undefined 
      };
  
      // Add the new node to the current node's children
      if (!node.children) {
        node.children = [];
      }
      node.children.push(newNode);
      console.log('addded children',node)
      
        const service = isFolder?this.apiService.createSubFolder({ parentId: node.id, name: newName }) : this.apiService.createFile({ parentId: node.id, name: newName });
        service
          .subscribe((response: any) => {
            console.log('responsee',response)
            const existingData = this.dataSource.data;
            if (isFolder) {
              // Create the new folder structure
              const newFolder = {
                name: response.subfolder.name,
                id: response.subfolder._id,
                children: [] 
              };
          
              // Find the parent folder where this new subfolder should be added
              const parentFolder:any = existingData.find((folder: any) => folder.id === response.subfolder.parentId);
          
              if (parentFolder) {
                parentFolder.children.push(newFolder);
              }
            } else {
              // For adding a new file
              const newFile = {
                name: response.file.name, 
                id: response.file._id
              };
          
              const folder:any = existingData.find((folder: any) => folder.id === response.file.folderId);
              console.log('folder',folder)
              if (folder) {
                folder.children.push(newFile);
              }
            }
             this.dataSource.data = [...existingData];
          });
    
    }
  }
  private updateDataSource() {
    const flatNodes = Array.from(this.flatNodeMap.keys());
    this.dataSource.data = flatNodes;
  }
  

  // deleteNode(node: ExampleFlatNode): void {
  //   this.http.post('/api/delete', { id: node.id }).subscribe(() => {
  //     this.nodes = this.nodes.filter(n => n.id !== node.id);
  //     // Additional logic for child nodes if needed
  //   });
  // }
  editName(node: ExampleFlatNode): void {
    node.isEditing = true;
    this.editForm.setValue({ name: node.name }); // Set the current name for editing
  }
  saveName(node: ExampleFlatNode): void {
    const newName = this.editForm.value.name;
    
    if (newName) {
      this.apiService.edit({ id: node.id, name: newName }).subscribe((res: any) => {
        console.log("on new name",res);
        node.name = newName; 
        node.isEditing = false;
      });
    }
  }

  cancelEdit(node:ExampleFlatNode): void {
    node.isEditing = false; 
  }

  deleteNode(node: ExampleFlatNode): void {
    // Implement logic to handle deleting the node
    console.log('Delete node:', node);
  }
  get nameControl(): FormControl {
    return this.editForm.get('name') as FormControl;
  }
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9); // Generate a random string ID
  }
}
