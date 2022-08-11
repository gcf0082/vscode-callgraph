import * as vscode from 'vscode';
import {CallGraphViewer} from './callGraphViewer'

import { CallGraphCalleeProvider } from './callgraphCalleesProvider';

export function activate(context: vscode.ExtensionContext) {
	let callgraphViewerDisposable = vscode.commands.registerCommand(`vscode-callgraph.getCallGraphCalllees`, () => {
    const callgrapViewerPanel = vscode.window.createWebviewPanel(
      'Call Graph',
      'Call Graph Viewer',
      vscode.ViewColumn.One,
      {
        enableScripts: true
      }
    );
    const command = new CallGraphViewer(context);
    command.execute(callgrapViewerPanel.webview);
    context.subscriptions.push(callgraphViewerDisposable);
	});

  

  vscode.window.registerTreeDataProvider('method-callees', new CallGraphCalleeProvider());
}

export function deactivate() {}
