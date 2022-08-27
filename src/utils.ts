export class Utils {
    private static model: string = 'local_model';
   
    public static setModel(model:string) {
        Utils.model = model;
    }

    public static isViewCodeModel(): boolean {
        if (Utils.model.indexOf('view_code_model') != -1) {
            return true;
        } else {
            return false;
        }
    }

    public static isLocalModel(): boolean {
        if (Utils.model.indexOf('local_model') != -1) {
            return true;
        } else {
            return false;
        }
    }

    public static isDashboardModel(): boolean {
        if (Utils.model.indexOf('dashboard_model') != -1) {
            return true;
        } else {
            return false;
        }
    }    
}