import BaseEditor from "./base-editor.js";
import SettingElementOptions from "../options/setting-element-options.js";

export default class SettingsEditor extends BaseEditor {

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
    
    
    showOrHideElementNotExists(elementExists, message) {
        this.isBroken = !elementExists;
        let style = this.isBroken ? "color: red;" : "color: red;display: none;";
        document.getElementById('lblErrorMessage').setAttribute('style', style);
        document.getElementById('lblErrorMessage').innerText = message;
       
    }


    onSaveClick() {
        
    
        if (this.onSaveCallback) {
            let parentOptions = this.#components.dyanamicElements.onSaveChanges();
            
            // If errors exist, display the message and stop execution
            if (parentOptions?.error) {
                this.showOrHideElementNotExists(false, parentOptions.error);
                return;
            }
            this.showOrHideElementNotExists(true, "");
            this.showAutoSaved();
            // Proceed only if valid
            if (this.validateEditor(parentOptions)) {
                this.onSaveCallback(parentOptions);
            }
        }
    
        this.hideAutosaved();
    }
    
    
    validateEditor(settings) {
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
        let div = document.getElementById("divSettingContainer");
        div.innerHTML = "";
        this.#components.dyanamicElements = new SettingElementOptions( { elementOptions: this.optionParams}, "divSettingContainer", this.onSaveClick.bind(this));
    }

    createComponents(){
        const btnStyle = "margin-right:20px";
        const lblErrorMessage = "color: red; display:none";
        this.createButton('divIconSave', { style: btnStyle, id: 'btnExport' }, 'Export', { "click": this.onExportClick.bind(this) });
        this.createButton('divIconValidate', { style: btnStyle, id: 'btnValidate' }, 'Validate', { "click": this.onValidateClick.bind(this) });
        this.createButton('divDebug', {style: btnStyle, id:'btnDebug'},'Debug', {"click": this.onDebugClick.bind(this)});
        this.createLabel('divLblErrorMessage', { style: lblErrorMessage, id: 'lblErrorMessage' }, '');
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
        const divSettingContainerStyle = "display:inline, width:100%, padding-left:15px"
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
                    },
                    { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblErrorMessage" } }] },
                ]
            },
            {
                attr: { style: classRow },
                col: [
                    { attr: { style: colOptionsStyle }, divs: [{ attr: { style: divSettingContainerStyle, id: "divSettingContainer" } }] }
                ]
            }
        ]
       }
        
       let divMain = this.createTable(tblObj);
       this.mountContainerToParent(divMain);
        
    }
}