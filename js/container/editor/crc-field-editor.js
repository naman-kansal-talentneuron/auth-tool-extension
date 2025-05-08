import TextBox from "../../component/text-box.js";
import CRCField from "../../harvest/CRCField.js";
import DropDown from "../../component/drop-down.js";
import MetaData from "../../config/meta-data.js";
import BaseEditor from "./base-editor.js";
import TextArea from "../../component/text-area.js"
import MacrosProgressModal from "../../previewHarvester/macros-progress-modal.js";
import CodeEditor from "../../component/code-editor.js";
import Utils from "../../utils.js";

export default class CRCFieldEditor extends BaseEditor {
    #components ={
        txtFieldName : null,
        txtFieldSelector: null,
        selectorContextOn: { label : null , textbox : null , selectortype : ["css"]}, 
        ddlFieldSelectorType: null,
        txtValue: null,
        macrosTxtSelector:null
    }
    constructor(parentElement, CRCField,authManagerObj, onSaveCallback,onExportCallBack,togglePointAndClickClick,onSelectorChangeCallback, onValidateCallBack, navTreeUpdateCallBack, onDebugCallBack) {
        super(parentElement, navTreeUpdateCallBack);
        this.CRCField = CRCField;
        this.onSaveCallback = onSaveCallback;
        this.onExportCallBack = onExportCallBack;
        this.onDebugCallBack = onDebugCallBack;
        this.parentElement = parentElement;
        this.onSelectorChangeCallback = onSelectorChangeCallback;
        this.togglePointAndClickClick = togglePointAndClickClick;
        this.onValidateCallBack = onValidateCallBack;
        this.pointAndClick = false;
        this.getAuthObjManagerObj = authManagerObj;
        this.isScriptSelectorType = this.CRCField.fieldSelectorType === "script";
        this.isMacrosPresent = this.CRCField.fieldSelector !== undefined && this.CRCField.fieldSelector.includes("macros");
        this.populateEditor();
        this.togglePointAndClickClick();
        this.togglePointAndClickClick('Remove');
        
    }
    populateEditor() {
        if(this.validateInputElement()) {
            this.field = new CRCField('', '','','','');            
        }        
        this.createContainerDivs();
        this.createComponents();        
        this.onChangeOfFormElements();   
    }
    validateInputElement() {
        return this.field != null;
    }
    
    onExportClick(event) {
        this.onExportCallBack(event, this);
    }

    onDebugClick() {
        this.onDebugCallBack();
    }

    /**
     * On click function for initiating macros evaluation.
     */
    onPreviewMacrosClick(e){
        this.getAuthObjManagerObj().splitUnifiedObject();
        let parentElement = this.getAuthObjManagerObj().harvestingObject.payload.filter(e => {
            if(e["crc"] !== undefined){
                return e["crc"].document === this.CRCField.fieldParent
            }
        })
        this.macrosProgressModal = new MacrosProgressModal(this.getAuthObjManagerObj().harvestingObject, "payload" , parentElement[0].id, this.onSetMacrosPreviewCallback.bind(this));
        this.macrosProgressModal.launchMacrosEvalModal();
    }

    
    /**
     * Sets resolved macros values to preview text box and in code editor.
     */
    onSetMacrosPreviewCallback(nodeResponse){

        if(nodeResponse.crc){
            let crcResponse = nodeResponse.crc.fields[ this.CRCField.fieldName]
            if(crcResponse){
                typeof crcResponse.query == 'string' ? crcResponse.query : JSON.stringify(crcResponse.query, this.isScriptSelectorType);
                this.#components.txtPreview.setValue(crcResponse.result ? crcResponse.result : "");
                this.showMacrosEle();
                this.#components.macrosTxtSelector.setValue(crcResponse.query, this.isScriptSelectorType);
            }
        }
    }

    handleDynamicOptions(){
        this.handleSelectorChange();
        this.handleMacrosChange();
    }

    onSaveClick() {

        this.handleDynamicOptions()

        if(!this.validateEditor()) {
            // event.preventDefault();
            return false;
        }
        this.showAutoSaved();   
        this.CRCField.fieldName = this.#components.txtFieldName.val;
        this.CRCField.fieldSelectorType = this.#components.ddlFieldSelectorType.selectedItem;
        this.CRCField.fieldSelector =  Utils.removeEmptySpace(this.getCodeText().replace(/\r?\n|\r/g, ""), ["{", "}"]);
        this.CRCField.fieldSelectorContextOn = this.#components.selectorContextOn.textbox.val && this.#components.selectorContextOn.textbox.val.trim().length ? this.#components.selectorContextOn.textbox.val : undefined;
        this.CRCField.fieldValue = this.#components.txtValue.val;    
        this.CRCField["IsValidSelector"] = !this.isBroken;
        this.onSaveCallback(this.CRCField,null, this);
        this.hideAutosaved();
    }
    
    
    validateEditor() {
        return true;
    }

    onPointAndClick(event){
        let pointAndClick = this.pointAndClickActive? "Remove" : "Add";
        if(this.togglePointAndClickClick ) {
            this.togglePointAndClickClick(pointAndClick,event, this);
            this.pointAndClickActive = !this.pointAndClickActive;
            //document.getElementById('btnAnnotate').setAttribute('style', 'border: 1px solid blue');
        }
        this.toggleBtnPointAndClick();
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
    
    toggleBtnPointAndClick() {
        let style = this.pointAndClickActive?'margin-right:20px; background-color: #DCEDFF; font-weight:700':'margin-right:20px;';         
        let cursorStyle = this.pointAndClickActive? 'cursor: grab; cursor: -webkit-grab;': 'cursor: default';
        this.setAttributes(document.getElementById('btnAnnotate'), {'style': style});     
        document.querySelector('body').setAttribute('style',cursorStyle);
    }
  
    setSelector(selectedItem){
        if(this.#components.ddlFieldSelectorType.selectedItem == 'css' || this.#components.ddlFieldSelectorType.selectedItem == 'css.innerhtml') {
           this.CRCField.fieldSelector = selectedItem[1].content;           
        }
               
        if(this.#components.ddlFieldSelectorType.selectedItem == 'xpath' || this.#components.ddlFieldSelectorType.selectedItem == 'xpath.innerhtml') {
            this.CRCField.fieldSelector = selectedItem[2].content;
        }
        this.pointAndClickActive = false;                
        this.#components.txtFieldSelector.setValue(this.CRCField.fieldSelector);
        this.toggleBtnPointAndClick();
        this.onTxtSelectorChange();
    }

    setPreview(ele, cnt) {
        this.#components.txtPreview.setValue(JSON.stringify(ele));
        document.getElementById('lblSelectedItemCount').innerHTML = "("+cnt+")";    
     }
    
    annotationOnComplete(length) {     
        this.showOrHideElementNotExists(length>0);
       // this.showOrHideElementDetails(ele);        
    }

    
    showOrHideElementNotExists(elementExists) {
        
        this.isBroken = MetaData.isAnnotatableSelectorType(this.#components.ddlFieldSelectorType.selectedItem)? !elementExists: false;
        let style = this.isBroken ? "color: red; " : "color: red;  display: none;";
        document.getElementById('lblErrorMessage').setAttribute('style',style);    
    
    }

    //Enable or Disable the SelectorContext options based on Selectors
    resetSelectorContextOptions(selectoroptions){
        let enableSelectorContext = false;
        if( selectoroptions && this.#components.selectorContextOn.selectortype.indexOf( event.target.value.toLowerCase()) > -1){
            enableSelectorContext = true;
        }

        this.#components.selectorContextOn.label.style.display= enableSelectorContext? "block":"none";
        this.#components.selectorContextOn.textbox.enableControl( enableSelectorContext);
        
        if( !enableSelectorContext){
            this.#components.selectorContextOn.textbox.setValue( "");
        }
    }
    
    OnSelectorChange(event){        
        if( event && event.target && event.target.value){
            this.resetSelectorContextOptions( event.target.value);
        }

        this.onTxtSelectorChange(event);
    }


    onTxtSelectorChange(event) {

        this.showOrHideElementNotExists(true);        
        let mode = '';
        if(this.#components.ddlFieldSelectorType.selectedItem == 'xpath'|| this.#components.ddlFieldSelectorType.selectedItem == 'xpath.innerhtml')
        {
            mode ='xpath';
        }
        else if(this.#components.ddlFieldSelectorType.selectedItem == 'css'|| this.#components.ddlFieldSelectorType.selectedItem == 'css.innerhtml'){
            mode = 'css';
        }

        this.onSelectorChangeCallback(this.#components.txtFieldSelector.val, mode, false);
    
    }

    onCodeEditorSelectorChange() {
        this.onTxtSelectorChange(); 
        this.onSaveClick();
    }

    /**
     * Displays code editor with resolved macros values.
     * Hides normal code editor and related buttons.
     */
    showMacrosEle(){
        document.getElementById('temp_btnHideMacros').style.display = "block";
        document.getElementById('temp_btnShowMacros').style.display = "none";
        this.#components.macrosTxtSelector.getEditorObject().getWrapperElement().style.display = "block";
        this.#components.txtFieldSelector.getEditorObject().getWrapperElement().style.display = "none";
    }
    
    /**
    * Hides code editor with resolved macros values.
    * Shows normal code editor and related buttons.
    */
    hideMacrosEle(){
        document.getElementById('temp_btnShowMacros').style.display = "block";
        document.getElementById('temp_btnHideMacros').style.display = "none";
        this.#components.macrosTxtSelector.getEditorObject().getWrapperElement().style.display = "none";
        this.#components.txtFieldSelector.getEditorObject().getWrapperElement().style.display = "block";
    }

    handleSelectorChange(){
        if(this.CRCField.fieldSelectorType !== this.#components.ddlFieldSelectorType.selectedItem){
            this.isScriptSelectorType = this.#components.ddlFieldSelectorType.selectedItem === "script";
            this.#components.txtFieldSelector.toggleBeautifier(this.isScriptSelectorType );
            this.#components.macrosTxtSelector.toggleBeautifier(this.isScriptSelectorType );
            if(this.isScriptSelectorType){
                document.getElementById('divIconContainer').style.display = "inline-block";
                document.getElementById('temp_btnFullScreen').style.display = "block";
            } else {
                document.querySelectorAll(`[id^=temp_]`).forEach(ele => {
                    ele.style.display = "none";
                });
                this.#components.macrosTxtSelector.getEditorObject().getWrapperElement().style.display = "none";
                this.#components.txtFieldSelector.getEditorObject().getWrapperElement().style.display = "block";
            }          
        }
    }

    switchToFullscreen = () => {
        if(this.#components.macrosTxtSelector.getEditorObject().getWrapperElement().style.display == "block"){
            this.#components.macrosTxtSelector.switchToFullscreen(); 
        } else this.#components.txtFieldSelector.switchToFullscreen();
        
        document.getElementById('btnExitFullScreen').style.display = "block";
    }

    exitFullscreen = () => {
        document.getElementById('btnExitFullScreen').style.display = "none";

        if(this.#components.macrosTxtSelector.getEditorObject().getWrapperElement().style.display == "block"){
            this.#components.macrosTxtSelector.exitFromFullscreen(); 
        } else this.#components.txtFieldSelector.exitFromFullscreen();
        
    }    

    getCodeText = () => {
        if(this.#components.txtFieldSelector instanceof CodeEditor) {
            return this.#components.txtFieldSelector.getValue();
        }
        return this.#components.txtFieldSelector.value !== undefined ? this.#components.txtFieldSelector.value
                                                                : this.#components.txtFieldSelector.val;
    }

    handleMacrosChange() {
        this.isMacrosPresent = this.getCodeText().includes("macros");

        if(this.isMacrosPresent){
            document.getElementById("divPreviewMacros").style.display = "inline-block";
        } else {
            document.getElementById("divPreviewMacros").style.display = "none";
        }
    }

    createComponents() {
        const lblStyle = "width: 85px;  font-weight: 550";        
        const lblStyleSmall = "width: 55px;  font-weight: 550";        
        const btnStyle = "margin-right:20px";
        const lblErrorMessage= "color: red; width: 100%; display:none";
        const iconBottom = "float: left; clear: left; margin-top: 5px;"
        const iconTop = "float: left; "
        const classExitFullscreen = "position: fixed; top: 5px; right: 15px; z-index: 10;"
        
        this.createLabel('divLblFieldName', {style:lblStyleSmall, id : 'lblFieldName'}, 'Name *');
        this.#components.txtFieldName = new TextBox('divEleFieldName','uh_editor_txtFeildName', null, this.CRCField.fieldName?this.CRCField.fieldName:"", "", 
                this.onNodeIDChange.bind(this), null, null, null, null, null , true);
        this.createLabel('divLblSelectorType', {style:lblStyle, id : 'lblSelectorType'}, 'Selector Type *');
        this.#components.ddlFieldSelectorType = new DropDown('divEleSelectorType', 'uh_editor_ddlSelectorType', MetaData.getSelectorTypes, this.CRCField.fieldSelectorType,this.OnSelectorChange.bind(this), null ,null, true);
        
        this.createLabel('divLblSelector', {style:lblStyleSmall, id : 'lblSelector'}, 'Selector *');         
        this.createIcon("divIconContainer", { style: iconTop, id: 'temp_btnFullScreen' }, "../../images/expand-editor.png", { "click": this.switchToFullscreen } );
        this.createIcon("divIconContainer", { style: classExitFullscreen, id: 'btnExitFullScreen' }, "../../images/shrink-editor.png", { "click": this.exitFullscreen } );

        let codeEditorOptions = {};
        if((this.CRCField.fieldSelectorType && this.CRCField.fieldSelectorType.toLowerCase() !== "script") || !this.CRCField.fieldSelectorType){ 
            codeEditorOptions=  {lineNumbers: false, matchBrackets: false, autoCloseBrackets: false} ;
            // document.getElementById('temp_btnValidateScript').style.display = "none";
            document.getElementById('temp_btnFullScreen').style.display = "none";
        }
        this.#components.txtFieldSelector = new CodeEditor('divEleSelector', 'uh_editor_txtSelector', this.CRCField.fieldSelector?this.CRCField.fieldSelector: '', this.onCodeEditorSelectorChange.bind(this), codeEditorOptions, this.isScriptSelectorType);
        codeEditorOptions = {...codeEditorOptions, readOnly: true, theme: "duotone-light"}
        this.#components.macrosTxtSelector = new CodeEditor('divEleSelector', 'uh_editor_txtSelector', "Macros Element resolved here", () => {} , codeEditorOptions, this.isScriptSelectorType);
        this.#components.macrosTxtSelector.getEditorObject().getWrapperElement().style.display = "none";

        this.createLabel('divLblValue',{style: lblStyleSmall, id: 'lblValue'}, 'Value');
        this.#components.txtValue = new TextBox('divEleValue','uh_editor_txtValue','',this.CRCField.fieldValue ?this.CRCField.fieldValue:'','', null,  null, null, null, null, null , false);

        let enableSelectorContext = false;        
        if( this.CRCField.fieldSelectorType && this.#components.selectorContextOn.selectortype.indexOf( this.CRCField.fieldSelectorType.toLowerCase()) > -1){
            enableSelectorContext = true;
        }
        this.#components.selectorContextOn.label  = this.createLabel('divLblSelectorContextOn', {style: lblStyle + (enableSelectorContext? "" : " ;display : none" ), id: 'lblSelectorContextOn'}, 'Selector Context');
        this.#components.selectorContextOn.textbox = new TextBox('divEleSelectorContextOn','uh_editor_txtSelectorContextOn', '', this.CRCField.fieldSelectorContextOn? this.CRCField.fieldSelectorContextOn: '' ,'' );
        this.#components.selectorContextOn.textbox.enableControl( enableSelectorContext);

        this.createButton('divIconSelector', {style: btnStyle, id:'btnAnnotate'},'X', {"click": this.onPointAndClick.bind(this)});
        //this.createButton('divIconSave', {style: btnStyle, id:'btnSave'},'Save', {"click": this.onSaveClick.bind(this)});
        this.createButton('divIconSave', {style: btnStyle, id:'btnExport'},'Export', {"click": this.onExportClick.bind(this)});
        this.createButton('divIconValidate', { style: btnStyle, id: 'btnValidate' }, 'Validate', { "click": this.onValidateClick.bind(this) });
	    this.createButton('divDebug', {style: btnStyle, id:'btnDebug'},'Debug', {"click": this.onDebugClick.bind(this)});
        this.createButton('divPreviewMacros', {style: btnStyle, id:'btnPreview'},'Preview Macros', {"click": this.onPreviewMacrosClick.bind(this)});

        this.createLabel('divLblErrorMessage', {style: lblErrorMessage, id: 'lblErrorMessage'},'No matching element to highlight in this page for given (Selector-Selector type)')
        
        this.createLabel('divLblPreview', {style:lblStyleSmall, id : 'lblSelector'}, 'Preview');         
        this.#components.txtPreview = new TextArea('divElePreview','txtPreview','toolinput', '' ,'','5','100',null,null,null,null,'');        
        this.createIcon("divIconContainer", { style: iconBottom, id: 'temp_btnHideMacros' }, '../../images/toggle-on.png', { "click": this.hideMacrosEle.bind(this) } );
        this.createIcon("divIconContainer", { style: iconBottom, id: 'temp_btnShowMacros' }, '../../images/toggle-off.png', { "click": this.showMacrosEle.bind(this) } );

        // will be enabled only when in fullscreen mode
        document.getElementById('btnExitFullScreen').style.display = "none";
        document.getElementById('temp_btnHideMacros').style.display = "none";
        document.getElementById('temp_btnShowMacros').style.display = "none";
        this.createLabel('divLblCount', {style: lblStyleSmall, id: 'lblSelectedItemCount'},'(0)');
     
    }
    
    createContainerDivs() {
        const tblStyle = "height:100%";
        const divLabelStyle = "display:inline; width: 155px; text-align:left; padding-top:2px; padding-left:15px;"
        const divElementStyle = "display:inline; width: 220px;  text-align:left; padding-top:2px; padding-left:15px"
        //const divOptionContainerStyle = "display:inline, width:100%, padding-left:15px"
        const rowStyle = "margin-top: 12px";
        const firstRow = "margin-top: 28px";
        const colStyle = "display:inline; width: 25%; min-width: 350px; margin-left: 25px";
        const colStyle2X = "display:inline; width: 25%; min-width: 350px; margin-left: 0px";
        //const colOptionsStyle = "width: 100%; ";
        const divErrorMessageStyle = "display:inline; width: 100%; text-align:left; padding-top:2px; padding-left:15px;"
        const divLblCountStyle = "display:inline; width: 155px; text-align:left; padding-top:2px; padding-left:5px;color:#337ab7"
        const classRow="margin-top:20px";
        const classCol="display: inline-block;";
        const classColEle="display: inline-block;margin-left: auto;";
        const pointAndClick = "display: inline-block;margin-left: 25px;"
        const editorHeader = ";border-bottom: 2px solid rgb(0 0 0 / 25%); padding-bottom:15px;width:90%";
        const classSelectorScript = "display: inline-block; max-width: 70em; min-width: 70em; margin-bottom: 1em;";
        const classIconContainer = "display: inline-block ; position: absolute; margin-left: 5px;";
        const classMacros = this.isMacrosPresent ? "display: inline-block" : "display:none"
        /*
        let tblObj = {
            attr : {style : tblStyle} ,
            id : "tblEditorMain",
            rows: [
                {
                    attr: {style: firstRow},
                    col : [
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblFieldName"} }, {attr: { style: divElementStyle, id: "divEleFieldName"}}] },
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblSelectorType"} }, {attr: { style: divElementStyle, id: "divEleSelectorType"}}]},
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblSelector"}}, {attr:  { style: divElementStyle, id: "divEleSelector"}}]},
                         { attr: {style: colStyle2X} , divs: [{ attr: {style: divLabelStyle, id: "divIconSelector"}}, {attr:  { style: divElementStyle, id: "divIconSave"}}]}
                    ]
                },
                {
                    attr: {style: rowStyle},
                    col: [                        
                        {attr: {style: colStyle}, divs: [{attr: {style: divLabelStyle, id: "divLblValue"}},{attr: {style: divElementStyle, id: "divEleValue"}}]},
                        {attr: {style: colStyle}, divs: [{attr: {style: divLabelStyle, id: "divLblSelectorContextOn"}}, {attr: {style: divElementStyle, id: "divEleSelectorContextOn"}}]}
                    ]
                },
                {
                    attr: {style: rowStyle},
                    col: [                        
                        {attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblPreview"}}, {attr:  { style: divElementStyle, id: "divElePreview"}},
                            {attr: {style: divLblCountStyle, id: "divLblCount"}}]},                         
                        {attr: {style: colStyle}, divs: [{attr: {style: divErrorMessageStyle, id: "divLblErrorMessage"}}] }
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
                         { attr: {style: colStyle2X} , divs: [{ attr: {style: pointAndClick, id: "divIconSelector"}}, 
                         {attr:  { style: classColEle, id: "divIconSave"}},
                         { attr: { style: classColEle, id: "divIconValidate" } }, 
                         { attr: { style: classColEle, id: "divDebug" } }]
                        }
                    ]
                },
                {
                    attr: {style: classRow},
                    col : [
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblFieldName"} }, {attr: { style: classColEle, id: "divEleFieldName"}}] },
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblSelectorType"} }, {attr: { style: classColEle, id: "divEleSelectorType"}}]},
                         { attr: {style: colStyle} , divs: [{ attr: {style: classMacros, id: "divPreviewMacros"} },
                         ]}
                        ]
                },
                {
                    attr: {style: classRow},
                    col : [
                        { attr: {style: colStyle} , divs: [
                            { attr: {style: classCol, id: "divLblSelector"}}, 
                            {attr:  { style: classSelectorScript, id: "divEleSelector"}},
                            { attr: { style: classIconContainer, id: "divIconContainer" } }]}
                    ]
                },
                {
                    attr: {style: classRow},
                    col: [                        
                        {attr: {style: colStyle}, divs: [{attr: {style: classCol, id: "divLblValue"}},{attr: {style: classColEle, id: "divEleValue"}}]},
                        {attr: {style: colStyle}, divs: [{attr: {style: classCol, id: "divLblSelectorContextOn"}}, {attr: {style: classColEle, id: "divEleSelectorContextOn"}}]}
                    ]
                },
                {
                    attr: {style: classRow},
                    col: [                        
                        {attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblPreview"}}, {attr:  { style: classColEle, id: "divElePreview"}},
                            {attr: {style: divLblCountStyle, id: "divLblCount"}}]}
                    ]
                },
                {
                    attr: {style: classRow},
                    col: [                 
                        {attr: {style: colStyle}, divs: [{attr: {style: classCol, id: "divLblErrorMessage"}}] }
                    ]
                }
    
    
            ]
        }
       
    let divMain = this.createTable(tblObj);

    this.mountContainerToParent(divMain);

    }
}