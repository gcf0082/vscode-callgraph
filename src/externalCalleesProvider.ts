import * as vscode from 'vscode';
import fetch from 'node-fetch';
import {data_external_callees} from './mock/data';

export class ExternalCalleeProvider implements vscode.TreeDataProvider<Callee> {
        private _onDidChangeTreeData: vscode.EventEmitter<Callee | null> = new vscode.EventEmitter<Callee | null>();
        readonly onDidChangeTreeData: vscode.Event<Callee | null> = this._onDidChangeTreeData.event;
    
        data: Callee[];

        rules: Rule[];
    
        constructor() {
            this.data = [];
            this.rules = [
                {
                    name: "命令注入",
                    id: "commend_inject",
                    patterns:
                        [
                            "java.lang.Runtime:exec",
                            "java.lang.ProcessBuilder"
                        ]
                },
                {
                    name: "环境变量",
                    id: "env",
                    patterns:
                        [
                            "java.lang.System:getenv",
                            "java.lang.System:setenv"
                        ]
                },
                {
                    name: "其他_java",
                    id: "other_java",
                    patterns:
                        [
                            "java",
                            "javax"
                        ]
                },
                {
                    name: "其他_huawei",
                    id: "other_huawei",
                    patterns:
                        [
                            "com.huawei"
                        ]
                }
            ];
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
                newNode.data = {};
                newNode.data.fullMethod = callee;
                newNode.children = new Array(calllers.length);
                newNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed; 
                newNode.iconPath = new vscode.ThemeIcon('getting-started-setup');
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
                
                this.pushCatalogNode(newNode);
            }
        }	
    
        refresh(jsonData:string) {
            this.data = []; 
            this.transferCallGraph2TreeJson(JSON.parse(jsonData), true);
            //this.refreshDangerousFunctionHighlight();
            this._onDidChangeTreeData.fire(null);
        }

        pushCatalogNode(calleeNode:Callee){
            let catalog;
            let foundRule = false;  
            let ruleAdded = false;
            let ruleId = ''
            let catalogName = '其他';
            let i = 0;
            //是否找到匹配规则
            for (i = 0; !foundRule && i < this.rules.length; ++i) {
                for (let j = 0; !foundRule && j < this.rules[i].patterns.length;++j ){
                    if (calleeNode.data.fullMethod.indexOf(this.rules[i].patterns[j]) == 0) {                                                                  
                        foundRule = true;
                        ruleId = this.rules[i].id;
                        catalogName = this.rules[i].name;
                        break;
                    }
                }
            }

            //判断类别是否以添加
            for (catalog of this.data) {
                if (ruleId == catalog.data.id) {
                    ruleAdded = true;
                    break;
                }
            }             

            //添加类别节点
            if (ruleAdded && catalog != undefined && catalog.children != undefined) {
                catalog.children.push(calleeNode);
            } else {
                catalog = new Callee('');
                catalog.label = catalogName;
                catalog.data = {}
                catalog.data.id = ruleId;  
                catalog.children = [];
                catalog.children.push(calleeNode);  
                catalog.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed; 
                this.data.push(catalog);         
            }                        
        }

        refreshDangerousFunctionHighlight() {
            const dangerousFuncs:string[] = vscode.workspace.getConfiguration('codeseeker').dangerousFunction;
            this.data.forEach((item)=>{
                dangerousFuncs.forEach((func)=>{
                    if (item.data.fullMethod.indexOf(func) != -1) {
                        item.iconPath = new vscode.ThemeIcon('getting-started-setup', new vscode.ThemeColor('list.highlightForeground'));
                    } else {
                        item.iconPath = new vscode.ThemeIcon('getting-started-setup');                        
                    }
                })                
            });
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

class Rule {
    name:string;
    id:string;
    patterns:string[]
    constructor(name: string, id: string, patterns:string[]){
        this.name = name;
        this.id = id;
        this.patterns = [...patterns];
    }
}
