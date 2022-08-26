import * as vscode from 'vscode';
import * as http from 'http';
import * as url from 'url';

export class  ViewCodeServer{
    private model:string = 'local_model';
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
            this.setCurrentModel(model);
            if (this.isViewCodeModel()) {
                this.startServer();
            } else if (this.isDashboardModel()) {

            }

        });
        this.extensionContext.subscriptions.push(viewCodeModelDisposable);

    }

    private startServer():boolean {
        const server = http.createServer((req, res)=>{
            if (req.url != undefined) {
                var q = url.parse(req.url).query;
            }    
            res.writeHead(200);
            res.end('ok');
        });
        server.listen(9302);
        return true;
    }

    private setCurrentModel(model:string) {
        this.model = model;
    }

    private isViewCodeModel():boolean {
        if (this.model.indexOf('view_code_model') != -1) {
            return true;
        } else {
            return false;
        }
    }

    private isLocalModel(): boolean {
        if (this.model.indexOf('local_model') != -1) {
            return true;
        } else {
            return false;
        }
    }   
    
    private isDashboardModel(): boolean {
        if (this.model.indexOf('dashboard_model') != -1) {
            return true;
        } else {
            return false;
        }
    }
}