import TextBox from "../../component/text-box.js";
import BaseEditor from "./base-editor.js";
import Utils from "../../utils.js";

export default class StartURLEditor extends BaseEditor {
    #components = {
        txtStartURL : null
    }

    constructor(parentElement, startURL, authObj, onSaveCallback,onExportCallBack, onValidateCallBack, onDebugCallBack) {
        super(parentElement);
        this.startURL = startURL;
        this.onSaveCallback = onSaveCallback;
        this.onExportCallBack = onExportCallBack;
        this.onValidateCallBack = onValidateCallBack;
        this.onDebugCallBack = onDebugCallBack;
        this.populateEditor();
        // Redirects the browser tab to Start URL provided.
        Utils.checkAndRedirect(startURL);
    }
    
    populateEditor() {
        if(this.validateInputNodeElement()) {
            this.startURL = "";
        }
        this.createContainerDivs();
        this.createComponents();   
        this.onChangeOfFormElements();     

    }
    
    validateInputNodeElement() {
        return this.startURL == null;
    }

    onSaveClick(event) {
        
        if(!this.validateEditor()) {
            // event.preventDefault();
            return false;
        }
        this.showAutoSaved();
        this.startURL= this.#components.txtStartURL.val;       
        this.onSaveCallback(this.startURL,event, this);
        this.hideAutosaved();
    }
    
    onExportClick(event) {
        this.onExportCallBack(event, this);
    }

    onValidateClick(event){
        this.onValidateCallBack && this.onValidateCallBack(event, this);
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
        this.createLabel('divLblStartURL', {style:lblStyleSmall, id : 'lblStartURL'}, 'Start URL');
        this.#components.txtStartURL = new TextBox('divEleStartURL','uh_editor_txtStartURL',null, this.startURL?this.startURL:"", "", 
                null, null);
        document.getElementById("uh_editor_txtStartURL").style.width = '79%';
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
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblStartURL"} }, {attr: { style: divElementStyle, id: "divEleStartURL"}}] },
                         { attr: {style: colStyle2X} , divs: [{ attr: {style: divLabelStyle, id: "divIconSelector"}}]}
                    ]
                }]
        }
        
    let divMain = this.createTable(tblObj);

    this.mountContainerToParent(divMain);
    }
    

}