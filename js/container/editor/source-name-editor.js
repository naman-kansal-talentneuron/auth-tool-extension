import TextBox from "../../component/text-box.js";
import BaseEditor from "./base-editor.js";

export default class SourceNameEditor extends BaseEditor {
    #components = {
        txtSourceName : null
    }

    constructor(parentElement, sourceName, authObj, onSaveCallback,onExportCallBack, onValidateCallBack, onDebugCallBack) {
        super(parentElement);
        this.sourceName = sourceName;
        this.onSaveCallback = onSaveCallback;
        this.onExportCallBack = onExportCallBack;
        this.onDebugCallBack = onDebugCallBack;
        this.onValidateCallBack = onValidateCallBack;
        this.populateEditor();        
    }
    populateEditor() {
        if(this.validateInputNodeElement()) {
            this.sourceName = "";
        }
        this.createContainerDivs();
        this.createComponents();   
        this.onChangeOfFormElements();     

    }
    
    validateInputNodeElement() {
        return this.sourceName == null;
    }

    onSaveClick(event) {
        
        if(!this.validateEditor()) {
            // event.preventDefault();
            return false;
        }
        this.showAutoSaved();
        this.sourceName= this.#components.txtSourceName.val;       
        this.onSaveCallback(this.sourceName,event, this);
        this.hideAutosaved();
    }

    onValidateClick(event){
        this.onValidateCallBack && this.onValidateCallBack(event, this);
    }
    
    onExportClick(event) {
        this.onExportCallBack(event, this);
    }

    onDebugClick() {
        this.onDebugCallBack();
    }
	
    onChangeOfFormElements(){
        
        var inputs = document.querySelectorAll('[id^=uh_editor_]');
        var i =0;
        for (i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('change',this.onSaveClick.bind(this));            
        }
    }
    validateEditor() {
        return true;
    }

    createComponents() {
        
        const lblStyleSmall = "width: 80px;  font-weight: 550";                
        this.createLabel('divLblSourceName', {style:lblStyleSmall, id : 'lblSourceName'}, 'Source Name');
        this.#components.txtSourceName = new TextBox('divEleSourceName','uh_editor_txtSourceName','', this.sourceName?this.sourceName:"", "", 
                null, null);
        const btnStyle = "margin-right:20px";
     
        //this.createButton('divIconSelector', {style: btnStyle, id:'btnAnnotate'},'X', {"click": this.onPointAndClick.bind(this)});
        // this.createButton('divIconSave', {style: btnStyle, id:'btnSave'},'Save', {"click": this.onSaveClick.bind(this)});
        this.createButton('divIconSave', {style: btnStyle, id:'btnExport'},'Export', {"click": this.onExportClick.bind(this)});
        this.createButton('divIconValidate', { style: btnStyle, id: 'btnValidate' }, 'Validate', { "click": this.onValidateClick.bind(this) });
	    this.createButton('divDebug', {style: btnStyle, id:'btnDebug'},'Debug', {"click": this.onDebugClick.bind(this)});

    }

    createContainerDivs() {

        const tblStyle = "height:100%";
        const divLabelStyle = "display:inline; width: 155px; text-align:left; padding-top:2px;"
        const divElementStyle = "display:inline; width: 220px;  text-align:left; padding-top:2px;"
        const firstRow = "margin-top: 28px";
        const colStyle = "display:inline; width: 25%; min-width: 350px; margin-left: 25px";
        const colStyle2X = "display:inline; width: 25%; min-width: 350px; margin-left: 0px";
      
        const classRow = "margin-top:20px";
        const classCol = "display: inline-block;";
        const classColEle = "display: inline-block;";
        const exportIcon =  "display: inline-block;margin-left:25px";
        const editorHeader = ";border-bottom: 2px solid rgb(0 0 0 / 25%); padding-bottom:15px;width:90%";

        let tblObj = {
            attr : {style : tblStyle} ,
            id : "tblEditorMain",
            rows: [
                {
                    attr: { style: classRow + editorHeader},
                    col: [
                        {
                            attr: { style: classCol }, divs: [
                            { attr: { style: exportIcon, id: "divIconSave" } },
                            { attr: { style: classColEle, id: "divIconValidate" } },
                            { attr: { style: classColEle, id: "divDebug" } }]
                        }
                    ]
                },
                {
                    attr: {style: firstRow},
                    col : [
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblSourceName"} }, 
                         {attr: { style: divElementStyle, id: "divEleSourceName"}}] },
                         { attr: {style: colStyle2X} , divs: [{ attr: {style: divLabelStyle, id: "divIconSelector"}}]}
                    ]
                }]
        }
        
    let divMain = this.createTable(tblObj);

    this.mountContainerToParent(divMain);
    }
    

}