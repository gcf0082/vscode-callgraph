import * as vscode from 'vscode';
import {CallGraphViewer} from './callGraphViewer'

import { CallGraphCalleeProvider } from './callgraphCalleesProvider';
import { ExternalCalleeProvider } from './externalCalleesProvider';
import {data4} from './mock/data';
import fetch from 'node-fetch';
import { exec } from "child_process";
import * as glob from 'glob';

export function activate(context: vscode.ExtensionContext) {
	let calleegraphViewerDisposable = vscode.commands.registerCommand(`vscode-callgraph.getCallGraphCalllees`, async () => {
    const method = await vscode.window.showInputBox({
      value: '',
      placeHolder: 'input method',
    
    });
    const fullMethod = method;
    //vscode.window.showInformationMessage(`Got: ${fullMethod}`); 
    //const res = await fetch(`http://127.0.0.1:8080/caller_graph?project_name=test&method=${fullMethod}`);
   
    //const fullMethod = 'java.io.PrintStream:println(java.lang.String)';//method;
    const respone = await fetch(`http://127.0.0.1:8080/project/current`, { method: 'GET' });
    const project: any = await respone.json();
    const res = await fetch(`http://127.0.0.1:8080/callee_graph?project_name=${project.name}&method=${fullMethod}`);    
    const data:any = await res.json();
    console.log(data);
    const callgrapViewerPanel = vscode.window.createWebviewPanel(
      'Call Graph',
      'Call Graph Viewer',
      vscode.ViewColumn.One,
      {
        enableScripts: true
      }
    );

    const command = new CallGraphViewer(context);
    let callgraph = JSON.parse(data4);
    command.viewCallGraph(JSON.stringify(data.nodes),
    JSON.stringify(data.edges),
    callgrapViewerPanel.webview)    
	});
  context.subscriptions.push(calleegraphViewerDisposable);

  let callergraphViewerDisposable = vscode.commands.registerCommand(`vscode-callgraph.getCallGraphCalllers`, async () => {
    const method = await vscode.window.showInputBox({
      value: '',
      placeHolder: 'input method',
    
    });
    const fullMethod = method;
    //vscode.window.showInformationMessage(`Got: ${fullMethod}`); 
    //const res = await fetch(`http://127.0.0.1:8080/caller_graph?project_name=test&method=${fullMethod}`);
   
    //const fullMethod = 'java.io.PrintStream:println(java.lang.String)';//method;
    const respone = await fetch(`http://127.0.0.1:8080/project/current`, { method: 'GET' });
    const project: any = await respone.json();    
    const res = await fetch(`http://127.0.0.1:8080/caller_graph?project_name=${project.name}&method=${fullMethod}`);    
    const data:any = await res.json();
    console.log(data);
    const callgrapViewerPanel = vscode.window.createWebviewPanel(
      'Call Graph',
      'Call Graph Viewer',
      vscode.ViewColumn.One,
      {
        enableScripts: true
      }
    );

    const command = new CallGraphViewer(context);
    let callgraph = JSON.parse(data4);
    command.viewCallGraph(JSON.stringify(data.nodes),
    JSON.stringify(data.edges),
    callgrapViewerPanel.webview)      
	}); 
  context.subscriptions.push(callergraphViewerDisposable);  


  let startServerDisposable = vscode.commands.registerCommand(`vscode-callgraph.startServer`, async () => {
    const extension = vscode.extensions.getExtension('xylab.vscode-callgraph');
    let callgraph_path = '';
    if (extension != undefined) {
      callgraph_path = extension.extensionPath + '/server/start_callgraph.bat';
    }
    
    const callgraph_command = callgraph_path;
    const cp_callgraph=exec(callgraph_command, (err,stdout,stderr) => {
        console.log(err||stdout||stderr);
    })
    cp_callgraph.on("close",(code,singal)=>{
        console.log(code===0?vscode.window.showInformationMessage('启动callgrap服务成功'):
        vscode.window.showInformationMessage('启动callgrap服务失败'));
    })        
	}); 
  context.subscriptions.push(startServerDisposable);    

  let openFileDisposable = vscode.commands.registerCommand(`vscode-callgraph.openfile`, async (data) => {
    if (vscode.workspace.workspaceFolders == undefined) {
      return;
    }
    const workSpacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const javaFile = data.callerClass.replaceAll('.', '/') + '.java';

    let javaPath = '';
    for (const specPath of glob.sync(`${workSpacePath}/**/${javaFile}`)) {
      javaPath = specPath;
      break;
    }       
    var pos = new vscode.Position(9, 4);
    var openPath = vscode.Uri.file(javaPath);
    vscode.workspace.openTextDocument(openPath).then(doc => {
      vscode.window.showTextDocument(doc).then(editor => {
        // Line added - by having a selection at the same position twice, the cursor jumps there
        editor.selections = [new vscode.Selection(pos, pos)];

        // And the visible range jumps there too
        var range = new vscode.Range(pos, pos);
        editor.revealRange(range);
      });
    });        
	}); 
  context.subscriptions.push(openFileDisposable);   

  //vscode.window.registerTreeDataProvider('method-callees', new CallGraphCalleeProvider());
  vscode.window.registerTreeDataProvider('project-external-callees', new ExternalCalleeProvider());
}

export function deactivate() {}
