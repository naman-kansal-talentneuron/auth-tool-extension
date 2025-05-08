import BaseEditor from "./base-editor.js";
import ParentElementOptions from "../options/parent-element-options.js";

export default class OptionParamsEditor extends BaseEditor {

    #components = {
        txtNode : null,
        ddlDocumentType: null,
        txtParentNode: null,
        lstKeyValue: null
    };

    constructor(parentElement, optionParams, authObj, onSaveCallback, onExportCallback, onValidateCallBack, onDebugCallBack){
        super(parentElement);
        this.optionParams = optionParams;
        this.onSaveCallback = onSaveCallback;
        this.parentElement = this.parentElement;
        this.onExportCallback = onExportCallback;
        this.onValidateCallBack = onValidateCallBack;
        this.onDebugCallBack = onDebugCallBack;
        this.authObj = authObj;        
        this.populateEditor();
    }

    populateEditor() {
        if (this.validateInputNodeElement()) {
            //if Empty, initiate empty param element editor node
            this.optionParams = {};
        }

        this.createContainerDivs();
        this.createComponents();    
        this.createDynamicComponents();        
        this.onChangeOfFormElements();

    }
    onChangeOfFormElements() {

        var inputs = document.querySelectorAll('[id^=uh_editor_]');
        var i = 0;
        for (i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('change', this.onSaveClick.bind(this));
        }
    }
    
    onSaveClick() {

        this.showAutoSaved();

        if (this.onSaveCallback) {

            let parentOptions = this.#components.dyanamicElements.onSaveChanges();
            if (this.validateEditor(parentOptions)) {
                this.onSaveCallback( parentOptions);              
            }
        }

        this.hideAutosaved();
    }
    
    validateEditor(options) {
        return true;
    }
    
    onExportClick(event) {
        this.onExportCallback(event, this);
    }

    onValidateClick(event){
        this.onValidateCallBack(event, this);
    }

    onDebugClick() {
        this.onDebugCallBack();
    }

    setPreview(ele, cnt) {
    }

    validateInputNodeElement() {
        return this.optionParams  ==  null;
    }

    createDynamicComponents() {
        let div = document.getElementById("divOptionContainer");
        div.innerHTML = "";
        this.#components.dyanamicElements = new ParentElementOptions( { elementOptions: this.optionParams}, "divOptionContainer", this.onSaveClick.bind(this));
    }

    createComponents(){
        const btnStyle = "margin-right:20px";
        this.createButton('divIconSave', { style: btnStyle, id: 'btnExport' }, 'Export', { "click": this.onExportClick.bind(this) });
        this.createButton('divIconValidate', { style: btnStyle, id: 'btnValidate' }, 'Validate', { "click": this.onValidateClick.bind(this) });
        this.createButton('divDebug', {style: btnStyle, id:'btnDebug'},'Debug', {"click": this.onDebugClick.bind(this)});
    }

    createContainerDivs() {
        const colStyle = "display:inline; width: 25%; min-width: 350px; margin-left: 25px";
        // my custom css style goes here
        const tblStyle = "height:100%";
        const classRow = "margin-top:20px";
        const classCol = "display: inline-block;";
        const pointAndClick = "display: inline-block;margin-left: 25px;"
        const classColEle = "display: inline-block;margin-left: auto;";
        const editorHeader = ";border-bottom: 2px solid rgb(0 0 0 / 25%); padding-bottom:15px;width:90%";
        const colOptionsStyle = "width: 100%; ";
        const divOptionContainerStyle = "display:inline, width:100%, padding-left:15px"
        const exportIcon =  "display: inline-block;margin-left:25px";
        
       let  tblObj = {
        attr: { style: tblStyle },
        id: "tblEditorMain",       
        rows: [
            {
                attr: { style: classRow + editorHeader},
                col: [
                    {
                        attr: { style: classCol }, divs: [{ attr: { style: exportIcon, id: "divIconSave" } },{ attr: { style: classColEle, id: "divIconValidate" } },
                        { attr: { style: classColEle, id: "divDebug" } }]
                    }
                ]
            },
            {
                attr: { style: classRow },
                col: [
                    { attr: { style: colOptionsStyle }, divs: [{ attr: { style: divOptionContainerStyle, id: "divOptionContainer" } }] }
                ]
            }
        ]
       }
        
       let divMain = this.createTable(tblObj);
       this.mountContainerToParent(divMain);
        
    }
}