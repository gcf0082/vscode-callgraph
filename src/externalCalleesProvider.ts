import * as vscode from 'vscode';
import fetch from 'node-fetch';
import {data_external_callees} from './mock/data';

export class ExternalCalleeProvider implements vscode.TreeDataProvider<Callee> {
        private _onDidChangeTreeData: vscode.EventEmitter<Callee | null> = new vscode.EventEmitter<Callee | null>();
        readonly onDidChangeTreeData: vscode.Event<Callee | null> = this._onDidChangeTreeData.event;
    
        data: Callee[];
    
        constructor() {
            this.data = [];
            const disposable = vscode.commands.registerCommand('vscode-callgraph.getProjectExternalCallees', async () => {
                const respone = await fetch(`http://127.0.0.1:8080/project/current`, { method: 'GET' });
                const project:any = await respone.json();
                fetch(`http://127.0.0.1:8080/callee?project_name=${project.name}`,{method: 'GET'}
                ).then(res => res.json()).then(
                   json => {
                       vscode.window.showInformationMessage(JSON.stringify(json));
                       this.refresh(JSON.stringify(json));
                   }
               );                 
                
            });
        }
    
    
        getTreeItem(element: Callee): vscode.TreeItem | Thenable<vscode.TreeItem> {
            return element;
        }
    
        getChildren(element?: Callee | undefined): vscode.ProviderResult<Callee[]> {
            if (element === undefined) {
                return this.data;
            }
            return element.children;
        }
    
        transferCallGraph2TreeJson(external_callees: any, callerFlag:boolean) { 
            let mapCallees = new Map();   
            for (const external_callee of external_callees) {
                const calleeMethod = external_callee.calleeMethod;
                const caller = mapCallees.get(calleeMethod);
                if (caller == undefined) {
                    let callerMap = new Map();
                    callerMap.set(external_callee.callerMehtod, { data: { linenum: external_callee.linenum, callerClass: external_callee.callerClass}});
                    mapCallees.set(calleeMethod, callerMap);                    
                } else {
                    caller.set(external_callee.callerMehtod, { data: { linenum: external_callee.linenum, callerClass: external_callee.callerClass }});  
                    mapCallees.set(calleeMethod, caller);                   
                }
            }

            for(const [callee, calllers] of mapCallees.entries()) {
                var newNode = new Callee('');
                newNode.label = callee;
                newNode.children = new Array(calllers.length);
                newNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed; 
                for(const [callerMethod, callerAttr] of calllers.entries()) {
                    var newCaller = new Callee('');
                    newCaller.label = callerMethod;
                    newCaller.data = {};
                    newCaller.data.fullMethod = callerMethod;
                    newCaller.data.lineNum = callerAttr.data.linenum;
                    newCaller.data.callerClass = callerAttr.data.callerClass;
                    newCaller.build();
                    newCaller.collapsibleState = vscode.TreeItemCollapsibleState.None;
                    newNode.children.push(newCaller);
                }
                this.data.push(newNode);
            }
        }	
    
        refresh(jsonData:string) {
            this.data = []; 
            this.transferCallGraph2TreeJson(JSON.parse(jsonData), true);
            this._onDidChangeTreeData.fire(null);
        }
    }

class Callee extends vscode.TreeItem {
	children: Callee[] | undefined;
	data: any;

	constructor(label: string, children?: Callee[]) {
		super(label);
	}

	build() {

		this.command = { command: 'vscode-callgraph.openfile', title: "Open File", arguments: [this.data] };
		this.tooltip = this.data.fullMethod + ' :' + this.data.lineNum;
	}
	
	contextValue = 'mytreeitem';
}
