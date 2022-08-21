var fs = require('fs');
import * as vscode from 'vscode';
import * as path from 'path'
import { FileSystemUtils } from './filesystemUtils';


export class CallGraphViewer {
  private static readonly _name: string = 'callgraphViewer';
  private fsUtils = new FileSystemUtils();
    private extensionContext: vscode.ExtensionContext;
    constructor(context: vscode.ExtensionContext) {
        this.extensionContext = context;
      }

      private generateAndWriteJavascriptFile(nodesJson: string, edgesJson: string, callbackFunction: () => void) {
   
          const jsContent = this.generateJavascriptContent(nodesJson, edgesJson);
          const outputJsFilename = CallGraphViewer._name + '.js';
          try {
            this.fsUtils.writeFile(this.extensionContext?.asAbsolutePath(path.join('.', outputJsFilename)), jsContent, callbackFunction);
          } catch (ex) {
            console.log('Dgml Viewer Exception:' + ex);
          }
      }

      private generateJavascriptContent(nodesJson: string, edgesJson: string): string {
        const templateJsFilename = CallGraphViewer._name + '_Template.js';
        let template = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('templates', templateJsFilename)), 'utf8');
        let jsContent = template.replace('var nodeElements = [];', `var nodeElements = ${nodesJson};`);
        jsContent = jsContent.replace('var edgeElements = [];', `var edgeElements =${edgesJson};`);
        //jsContent = jsContent.replace('\'shape\': \'round-rectangle\',', `'shape': '${this.config.nodeShape}',`);
        //jsContent = jsContent.replace('const edgeArrowType = \'triangle\' // edge arrow to type', `const edgeArrowType = '${this.config.edgeArrowToType}' // edge arrow to type}`);
        //jsContent = jsContent.replace('ctx.strokeStyle = \'blue\'; // graph selection guideline color', `ctx.strokeStyle = '${this.config.graphSelectionGuidelineColor}'; // graph selection guideline color`);
        //jsContent = jsContent.replace('ctx.lineWidth = 1; // graph selection guideline width', `ctx.lineWidth = ${this.config.graphSelectionGuidelineWidth}; // graph selection guideline width`);
        //jsContent = jsContent.replace('selectionCanvasContext.strokeStyle = \'red\';', `selectionCanvasContext.strokeStyle = '${this.config.graphSelectionColor}';`);
        //jsContent = jsContent.replace('selectionCanvasContext.lineWidth = 2;', `selectionCanvasContext.lineWidth = ${this.config.graphSelectionWidth};`);
        //jsContent = jsContent.replace("const defaultLayout = ''; // The graph layout from the dgml file itself", `const defaultLayout = '${this.config.defaultLayout}'; // The graph layout from the dgml file itself`);
       // jsContent = jsContent.replace('const defaultZoom = 1.25;', `const defaultZoom = ${this.zoom};`);
        return jsContent;
      }     
   

      private generateHtmlContent(webview: vscode.Webview, outputJsFilename: string): string {
        const templateHtmlFilename = CallGraphViewer._name+'_Template.html';
        let htmlContent = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('templates', templateHtmlFilename)), 'utf8');
    
        const javascriptIncludes = ['cytoscape.min.js', 'cytoscape-svg.js', 'cytoscape-klay.js', 'klay.js'];
        javascriptIncludes.forEach((includeFile) => {
          const includePath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'javascript', includeFile);
          const includeUri = webview.asWebviewUri(includePath);
          htmlContent = htmlContent.replace(includeFile, includeUri.toString());
        });
    
        const cssPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'stylesheets', CallGraphViewer._name + '.css');
        const cssUri = webview.asWebviewUri(cssPath);
        htmlContent = htmlContent.replace(CallGraphViewer._name + '.css', cssUri.toString());
        const nonce = this.getNonce();
        htmlContent = htmlContent.replace('nonce-nonce', `nonce-${nonce}`);
        htmlContent = htmlContent.replace(/<script /g, `<script nonce="${nonce}" `);
        htmlContent = htmlContent.replace('cspSource', webview.cspSource);
    
        const jsPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, outputJsFilename);
        const jsUri = webview.asWebviewUri(jsPath);
        htmlContent = htmlContent.replace(CallGraphViewer._name + '.js', jsUri.toString());
        return htmlContent;
      }   
      
      private getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
          text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
      }

      public viewCallGraph(nodesJson: string, edgesJson: string, webview: vscode.Webview): void {
        const extensionPath = this.extensionContext.extensionPath;
        const javascriptPath = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'javascript')));
        
        const outputJsFilename = CallGraphViewer._name + '.js';
        let htmlContent = this.generateHtmlContent(webview, outputJsFilename);
        this.generateAndWriteJavascriptFile(nodesJson, edgesJson, () => {
          webview.html = htmlContent;
        });
      }
}