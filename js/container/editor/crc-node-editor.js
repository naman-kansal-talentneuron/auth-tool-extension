import TextBox from "../../component/text-box.js";
import CRCNode from "../../harvest/CRCNode.js";
import BaseEditor from "./base-editor.js";

export default class CRCNodeEditor extends BaseEditor {
    #components = {
        txtDocument : null
    }

    constructor(parentElement, crcNode, authObj, onSaveCallback,onExportCallBack, onValidateCallBack, navTreeUpdateCallBack, onDebugCallBack) {
        super(parentElement, navTreeUpdateCallBack);
        this.crcNode = crcNode;
        this.onSaveCallback = onSaveCallback;
        this.onExportCallBack = onExportCallBack;
        this.onValidateCallBack = onValidateCallBack;
        this.onDebugCallBack = onDebugCallBack;
        this.populateEditor();        
    }

    populateEditor() {
        if(this.validateInputNodeElement()) {
            this.crcNode = new CRCNode('',null);
        }
        this.createContainerDivs();
        this.createComponents();   
        this.onChangeOfFormElements();     

    }
    
    validateInputNodeElement() {
        return this.crcNode == null;
    }

    onSaveClick() {
        
        if(!this.validateEditor()) {
            // event.preventDefault();
            return false;
        }
        this.crcNode.document = this.#components.txtDocument.val;       
        this.showAutoSaved();   
        this.onSaveCallback(this.crcNode,null, this);        
        this.hideAutosaved();
    }
    
    validateEditor() {
        return true;
    }
    
    onExportClick(event) {
        this.onExportCallBack(event, this);
    }

    onDebugClick() {
        this.onDebugCallBack();
    }

    onValidateClick(event){
        this.onValidateCallBack && this.onValidateCallBack(event, this);
    }

    onChangeOfFormElements(){
        
        var inputs = document.querySelectorAll('[id^=uh_editor_]');
        var i =0;
        for (i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('change',this.onSaveClick.bind(this));            
        }
    }

    createComponents() {
        
        const lblStyleSmall = "width: 75px;  font-weight: 550";                
        this.createLabel('divLblDocumentType', {style:lblStyleSmall, id : 'lblCRCDocumentType'}, 'Document');
        this.#components.txtDocument = new TextBox('divEleCRCDocument','uh_editor_txtDocument', null, this.crcNode?this.crcNode.document:"", "", 
            this.onNodeIDChange.bind(this), null);
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
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblDocumentType"} }, {attr: { style: divElementStyle, id: "divEleCRCDocument"}}] },
                         { attr: {style: colStyle2X} , divs: [{ attr: {style: divLabelStyle, id: "divIconSelector"}}, {attr:  { style: divElementStyle, id: "divIconSave"}}]}
                    ]
                }]
        }
        
    let divMain = this.createTable(tblObj);

    this.mountContainerToParent(divMain);
    }
    

}