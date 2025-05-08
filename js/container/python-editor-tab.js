import PythonEditor from "./python-editor/python-editor.js"
import Utils from "../utils.js"
import AuthScriptObjManager from "../auth-script-obj-manager.js";

export default class PythonEditorTab {

    constructor(sourceName) {
        this.sourceName = sourceName;
        this.authScriptObjManager = null;
        this.init();
    }

    init(){
        if( !this.sourceName || this.sourceName == "null"){
            this.enableEditorTab( false);
            return;
          }
          this.enableEditorTab(true);
        this.authScriptObjManager = new AuthScriptObjManager(this.path, this.sourceName);
        this.createEditor(this.authScriptObjManager.authScriptObject.customScript);
    }

    enableEditorTab( isEnable){

        document.getElementById("empty-editor").classList.add( isEnable ? "disable" : "enable");
        document.getElementById("empty-editor").classList.remove( isEnable ? "enable" : "disable");
  
        document.getElementById("selected-editor").classList.add( isEnable ? "enable" : "disable");
        document.getElementById("selected-editor").classList.remove( isEnable ? "disable" : "enable");
    }

    createEditor(customScript){
        new PythonEditor(this.sourceName, customScript, this.onSaveChanges.bind(this), this.onExportCallBack.bind(this));
    }

   
    onSaveChanges(customScript){
        this.authScriptObjManager.saveCustomScript(customScript);
    }

    /**
     * Exports Harvester, Extractor and Custom script if available.
     */
    onExportCallBack(){
        let fileName = this.sourceName != "null" ? this.sourceName : this.authScriptObjManager.authScriptObject.source;
        this.authScriptObjManager.splitUnifiedObject();
        Utils.exportFileToDownload(this.authScriptObjManager.extractorObject, fileName + '.extract');
        Utils.exportFileToDownload(this.authScriptObjManager.harvestingObject, fileName + '.harvest');
        this.authScriptObjManager.authScriptObject.customScript != "" && 
                Utils.exportFileToDownload(this.authScriptObjManager.authScriptObject.customScript, fileName + '.py', true);
    }

}    