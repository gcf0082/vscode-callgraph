import * as vscode from 'vscode';
import { CallGraphViewer } from './callGraphViewer'

import { CallGraphCalleeProvider } from './callgraphCalleesProvider';
import { ExternalCalleeProvider } from './externalCalleesProvider';
import { data4 } from './mock/data';
import fetch from 'node-fetch';
import { exec } from "child_process";
import * as glob from 'glob';
import fs from 'fs';
import { Callee } from './callgraphCalleesProvider';

export function activate(context: vscode.ExtensionContext) {
  let calleegraphViewerDisposable = vscode.commands.registerCommand(`vscode-callgraph.getCallGraphCalllers`, async (node: Callee) => {
    let fullMethod: any = '';
    if (node != undefined) {
      fullMethod = node.data.fullMethod
    } else {
      const method = await vscode.window.showInputBox({
        value: '',
        placeHolder: 'input method',

      });
      fullMethod = method;
    }
    //vscode.window.showInformationMessage(`Got: ${fullMethod}`); 
    //const res = await fetch(`http://127.0.0.1:8080/caller_graph?project_name=test&method=${fullMethod}`);

    //const fullMethod = 'java.io.PrintStream:println(java.lang.String)';//method;
    const respone = await fetch(`http://127.0.0.1:8080/project/current`, { method: 'GET' });
    const project: any = await respone.json();
    const res = await fetch(`http://127.0.0.1:8080/callee_graph?project_name=${project.name}&method=${fullMethod}`);
    const data: any = await res.json();
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

  let callergraphViewerDisposable = vscode.commands.registerCommand(`vscode-callgraph.getCallGraphCalllees`, async (node: Callee) => {
    let fullMethod: any = '';
    if (node != undefined) {
      fullMethod = node.data.fullMethod
    } else {
      const method = await vscode.window.showInputBox({
        value: '',
        placeHolder: 'input method',

      });
      fullMethod = method;
    }

    //vscode.window.showInformationMessage(`Got: ${fullMethod}`); 
    //const res = await fetch(`http://127.0.0.1:8080/caller_graph?project_name=test&method=${fullMethod}`);

    //const fullMethod = 'java.io.PrintStream:println(java.lang.String)';//method;
    const respone = await fetch(`http://127.0.0.1:8080/project/current`, { method: 'GET' });
    const project: any = await respone.json();
    const res = await fetch(`http://127.0.0.1:8080/caller_graph?project_name=${project.name}&method=${fullMethod}`);
    const data: any = await res.json();
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
    const cp_callgraph = exec(callgraph_command, (err, stdout, stderr) => {
      console.log(err || stdout || stderr);
    })
    cp_callgraph.on("close", (code, singal) => {
      console.log(code === 0 ? vscode.window.showInformationMessage('启动callgrap服务成功') :
        vscode.window.showInformationMessage('启动callgrap服务失败'));
    })
  });
  context.subscriptions.push(startServerDisposable);

  let openFileDisposable = vscode.commands.registerCommand(`vscode-callgraph.openfile`, async (data) => {
    if (vscode.workspace.workspaceFolders == undefined) {
      return;
    }
    const workSpacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const pos1 = data.callerClass.indexOf('$');
    let classFile = data.callerClass;
    if (pos1 != -1) {
      classFile = data.callerClass.substring(0, pos1);
    }
    const javaFile = classFile.replaceAll('.', '/') + '.java';

    let javaPath = '';
    for (const specPath of glob.sync(`${workSpacePath}/**/${javaFile}`)) {
      javaPath = specPath;
      break;
    }

    const lineNum = data.lineNum;
    const searchLineNum = ' ' + lineNum + ' */ ';
    const fileContent = fs.readFileSync(javaPath, 'utf-8');
    const lines = fileContent.split(/\r?\n/);
    let newLineNum = 0;
    for (let i = 0; i < lines.length; ++i) {
      if (lines[i].indexOf(searchLineNum) != -1) {
        newLineNum = i;
        break;
      }
    }

    var pos = new vscode.Position(newLineNum, 1);
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

  let externalCalleeProvider = new ExternalCalleeProvider();

  //vscode.window.registerTreeDataProvider('method-callees', new CallGraphCalleeProvider());
  vscode.window.registerTreeDataProvider('project-external-callees', externalCalleeProvider);

  /* 有了分类暂时就不需要做高亮
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("codeseeker.dangerousFunction")) {
      externalCalleeProvider.refreshDangerousFunctionHighlight();
    }
  }))*/
}

export function deactivate() { }
