import * as vscode from 'vscode';
import fetch from 'node-fetch';

export class CallGraphCalleeProvider implements vscode.TreeDataProvider<Callee> {
        private _onDidChangeTreeData: vscode.EventEmitter<Callee | null> = new vscode.EventEmitter<Callee | null>();
        readonly onDidChangeTreeData: vscode.Event<Callee | null> = this._onDidChangeTreeData.event;
    
        data: Callee[];
    
        constructor() {
            this.data = [];
            const disposable = vscode.commands.registerCommand('vscode-callgraph.getCallGraphCalllees', async () => {
                const caller: string | undefined = await vscode.window.showInputBox({ prompt: '请输入函数名'});
                console.log(caller);
                fetch(`http://127.0.0.1:8080/caller_graph?project_name=proj_log4j&method=${caller}`,{method: 'GET'}
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
    
        transferCallGraph2TreeJson(callGraph: any, callerFlag:boolean) {   
            let id = 0;
            let parentNode:any = null;             
            function insertNodeIntoTree(node: any, newNode: any) {
                //console.log(node.method_full);
                newNode.data = {};
                newNode.data.fullMethod = node.method_full;
                newNode.label = node.method_full;
                newNode.collapsibleState = vscode.TreeItemCollapsibleState.None;
                if (node.hasOwnProperty('lineNum')) {
                    newNode.data.lineNum = node.lineNum;
                }
                if (callerFlag && parentNode != null) {
                    newNode.data.callerMethod = parentNode.method_full;
                }
                id++;
                newNode.key = id;
    
                if (node.children != null) {
                    if (callerFlag) {
                        parentNode = node;
                    }                
                    newNode.children = new Array(node.children.length);
                    newNode.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
                    for (let i = 0; i < node.children.length; i++) {
                        newNode.children[i] = new Callee('');
                        insertNodeIntoTree(node.children[i], newNode.children[i]);
                    }
                }
                newNode.build();
            }
    
            var newNode = new Callee('');
            insertNodeIntoTree(callGraph, newNode)
            this.data = this.data.concat([newNode]);
            //console.log(callGraph);
            //console.log(JSON.stringify(newNode, null, '\t'));
            //return [newNode];
        }	
    
        refresh(jsonData:string) {
            let data = `{
                "method_hash": "Z4lMSWOI60SP_uKDAewipg#031",
                "method_full": "test.call_graph.method_call.TestMCCaller:test1a()",
                "children": [
                    {
                        "method_hash": "bcB3E0Ite2EG8fsL_A-eTQ#02e",
                        "method_full": "test.call_graph.method_call.TestMCCaller:str()",
                        "lineNum": 20
                    },
                    {
                        "method_hash": "SP_MOiuKbyMirmBMygzpGw#040",
                        "method_full": "test.call_graph.method_call.TestMCCallee:test1(java.lang.String)",
                        "lineNum": 21
                    }
                ]
            }`
    
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

		this.command = { command: 'extension.helloWorld', title: "Open File", arguments: [this.data] };
		this.tooltip = this.data.fullMethod + ' :' + this.data.lineNum;
	}
	
	contextValue = 'mytreeitem';
}
