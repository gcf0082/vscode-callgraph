import * as vscode from 'vscode';
import * as http from 'http';
import * as url from 'url';
import { Utils } from './utils'

export class  ViewCodeServer{
    private model:string = 'local_model';
    private port = 9302;
    private extensionContext: vscode.ExtensionContext;
    constructor(context: vscode.ExtensionContext) {
        this.extensionContext = context;
    }

    public init() {
        let viewCodeModelDisposable = vscode.commands.registerCommand(`vscode-callgraph.setViewCodeModel`, async () => {
            let model = await vscode.window.showQuickPick(['local_model', 'view_code_model', 'dashboard_model']);
            if (model == undefined) {
                return;
            }   
            Utils.setModel(model);
            if (Utils.isLocalModel()) {
                
            } else if (Utils.isViewCodeModel()) {
                this.port = 9302;
                this.startServer();
            } else {
                this.port = 9303;
                this.startServer();
            }

        });
        this.extensionContext.subscriptions.push(viewCodeModelDisposable);

    }

    private startServer():boolean {
        const server = http.createServer((req, res)=>{
            if (req.url != undefined) {
                var q:any = url.parse(req.url, true).query;
                if (req.url.indexOf('/openfile') == 0) {
                    vscode.commands.executeCommand('vscode-callgraph.openfile', { callerClass: q.fullClass, lineNum: q.linenum });

                } else if (req.url.indexOf('/callgraph') == 0) {

                }
                console.log(q.fullClass);
            }    
            res.writeHead(200);
            res.end('ok');
        });
        server.listen(this.port);
        return true;
    }
}