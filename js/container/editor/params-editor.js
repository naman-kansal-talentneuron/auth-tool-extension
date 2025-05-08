import TextArea from "../../component/text-area.js";
import BaseEditor from "./base-editor.js";

export default class ParamsEditor extends BaseEditor {
    #components = {
        txtParams : null
    }

    constructor(parentElement, params, authObj, onSaveCallback,onExportCallBack, onValidateCallBack, onDebugCallBack, navTreeUpdateCallBack) {
        super(parentElement);
        this.params = params;
        this.onSaveCallback = onSaveCallback;
        this.onExportCallBack = onExportCallBack;
        this.onValidateCallBack = onValidateCallBack;
        this.onDebugCallBack = onDebugCallBack;
        this.navTreeUpdateCallBack = navTreeUpdateCallBack;
        this.populateEditor();        
    }
    populateEditor() {
        if(this.validateInputNodeElement()) {
            this.params = [];
        }
        this.createContainerDivs();
        this.createComponents();   
        this.onChangeOfFormElements();     

    }
    
    validateInputNodeElement() {
        return this.params == null;
    }

    onValidateClick(event){
        this.onValidateCallBack && this.onValidateCallBack(event, this);
    }

    onSaveClick(event) {
        try{

                
            if(!this.validateEditor()) {
                // event.preventDefault();
                return false;
            }
            this.params = JSON.parse(this.#components.txtParams.val); 
            this.showAutoSaved();                             
            this.onSaveCallback(this.params,event, this);
            this.navTreeUpdateCallBack();
            this.hideAutosaved();                             
        } catch(e) {
            this.showError(false);
            this.onSaveCallback(this.params,event, this);
        }
    }
    validateEditor() {
        return true;
    }
    
    showError(isValidJson) {          
        
        let style = isValidJson ? "color: red; display: none;" : "color: red;  ";
        document.getElementById('lblErrorMessage').setAttribute('style',style);              
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
    onTxtChange() {   
        this.showError(true);
    }

    createComponents() {
        
        const lblStyleSmall = "width: 60px;  font-weight: 550";    
        const lblErrorMessage= "color: red; display:none";

        this.createLabel('divLblParams', {style:lblStyleSmall, id : 'lblParams'}, 'Params * :');
        
         const btnStyle = "margin-right:20px;";
     
         //this.#components.keyValueList = new KeyValueList('divEleParams', 'uh_editor_lstKeyValue', '', this.params, null);
         this.#components.txtParams = new TextArea('divEleParams','uh_editor_', 'toolinput', this.params?JSON.stringify(this.params,null,'\t'):"", "",7,90,
                 this.onTxtChange.bind(this) ,null,null, this.onTxtChange.bind(this));
        this.createLabel('divLblErrorMessage', {style: lblErrorMessage, id: 'lblErrorMessage'},'Please enter a valid json');

        //this.createButton('divIconSelector', {style: btnStyle, id:'btnAnnotate'},'X', {"click": this.onPointAndClick.bind(this)});
        //this.createButton('divIconSave', {style: btnStyle, id:'btnSave'},'Save', {"click": this.onSaveClick.bind(this)});
        this.createButton('divIconSave', {style: btnStyle, id:'btnExport'},'Export', {"click": this.onExportClick.bind(this)});
        this.createButton('divIconValidate', { style: btnStyle, id: 'btnValidate' }, 'Validate', { "click": this.onValidateClick.bind(this) });
	    this.createButton('divDebug', {style: btnStyle, id:'btnDebug'},'Debug', {"click": this.onDebugClick.bind(this)});

        
    }

    createContainerDivs() {

        const tblStyle = "height:100%;width:100%";
        const divLabelStyle = "display:inline; width: 155px; text-align:left; padding-top:2px; padding-left:15px;"
        const divElementStyle = "display:inline; width: 220px;  text-align:left; padding-top:2px; padding-left:15px"
        const firstRow = "margin-top: 28px";
        const colStyle = "display:inline; width: 25%; min-width: 350px; margin-left: 25px";
        const colStyle2X = "display:inline; width: 25%; min-width: 350px; margin-left: 0px";
        const divErrorMessageStyle = "display:inline; width: 100%; text-align:left; padding-top:2px; padding-left:15px;"
      
        const classRow="margin-top:10px";
        const classCol="display: inline-block;";
        const classColEle="display: inline-block;margin-left: auto;";

        const editorHeader = ";border-bottom: 2px solid rgb(0 0 0 / 25%); padding-bottom:15px;width:90%";
        /*
        let tblObj = {
            attr : {style : tblStyle} ,
            id : "tblEditorMain",
            rows: [
                {
                    attr: {style: firstRow},
                    col : [
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblParams"} }, {attr: { style: divElementStyle, id: "divIconSave"}}] },
        //                         { attr: {style: colStyle2X} , divs: [{ attr: {style: divElementStyle, id: "divEleParams"}}]}
                    ]
                },
                {
                    attr: {style: firstRow},
                    col : [
                         { attr: {style: colStyle} , divs: [{ attr: {style: divElementStyle, id: "divEleParams"} }] }
        //                         { attr: {style: colStyle2X} , divs: [{ attr: {style: divElementStyle, id: "divEleParams"}}]}
                    ]
                },
                {
                    attr: {style: firstRow},
                    col: [                        
                        {attr: {style: colStyle}, divs: [{attr: {style: divErrorMessageStyle , id: "divLblErrorMessage"}}] }
                    ]
                }
            ]
        } */

        let tblObj = {
            attr : {style : tblStyle} ,
            id : "tblEditorMain",
            rows: [
                {
                    attr: {style: classRow + editorHeader},
                    col : [
                         { attr: {style: colStyle} , divs: [ {attr: { style: classColEle, id: "divIconSave"}},
                                                             { attr: { style: classColEle, id: "divIconValidate" }},
	                                                         { attr: { style: classColEle, id: "divDebug" } }] },
                    ]
                },
                {
                    attr: {style: classRow},
                    col : [
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblParams"} }] }
                    ]
                },
                {
                    attr: {style: classRow},
                    col : [
                         { attr: {style: colStyle} , divs: [{ attr: {style: classColEle, id: "divEleParams"} }] }
                    ]
                },
                {
                    attr: {style: classRow},
                    col: [                        
                        {attr: {style: colStyle}, divs: [{attr: {style: classCol , id: "divLblErrorMessage"}}] }
                    ]
                }
            ]
        }
        
    let divMain = this.createTable(tblObj);

    this.mountContainerToParent(divMain);
    }
    

}