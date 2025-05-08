import BaseEditor from "./base-editor.js";
import TextBox from "../../component/text-box.js"
import DropDown from "../../component/drop-down.js";
import MetaData from "../../config/meta-data.js";
import ElementOptionsFactory from "../options/element-options-factory.js";
import BasicElement from "../../element/BasicElement.js";
import Utils from "../../utils.js";
import StackUtil from "../../helper/stack-util.js";
import TextArea from "../../component/text-area.js";
import CodeEditor from "../../component/code-editor.js";
import MacrosProgressModal from "../../previewHarvester/macros-progress-modal.js"
import ShowErrDialog from "../../component/showError-dialog.js";
import ProxyDialogUtil from "./proxy-dialog-util.js";

export default class HarvesterNodeEditor extends BaseEditor {

    //# private 
    #components = {
        txtNode: null,
        ddlSelectorType: null,
        txtSelector: null,
        macrosTxtSelector:null,
        txtParentNode: null,
        ddlDocumentType: null,
        ddlPersist: null,
        ddlActionType: null,
        selectorContextOn: { label : null , textbox : null , selectortype : ["css"]},        
        txtPreview: null,
        dyanamicElements: null,
        trimmedPreviewTxt: null,
        showMoreloader: false,
    };

    constructor(parentElement, nodeElement, authObj, callBackRefObj) {
        
        super(parentElement, callBackRefObj.navTreeUpdateCallBack, MetaData.getHarvestorValidateFields);    

        this.nodeElement = nodeElement;
        this.onSaveCallback = callBackRefObj.onSaveCallback;
        this.parentElement = parentElement;
        this.onExportCallBack = callBackRefObj.onExportCallBack;
        this.onDebugCallBack = callBackRefObj.onDebugCallBack;
        this.togglePointAndClickClick = callBackRefObj.togglePointAndClickClick;
        this.pointAndClickActive = false;
        this.onSelectorChangeCallback = callBackRefObj.onTxtSelectorChange;
        this.authObj = authObj;
        this.LstHarvestingIds = this.getListOfHarvestingNodes(authObj, nodeElement?.category);
        this.currentIndex = this.computeCurrentIndex(nodeElement);
        this.onValidateCallBack = callBackRefObj.onValidateCallBack;
        this.onTraverseCallBack = callBackRefObj.onTraverseCallBack;
        this.getAuthObjManagerObj = callBackRefObj.getAuthManagerObj;

        this.undoStack = new StackUtil(); 
        this.isValidEditor = true;
        // this.onShowMorePreviewCallback = onShowMorePreviewCallback;
        this.isMacrosPresent = this.nodeElement?.elementSelector && this.nodeElement.elementSelector.includes("macros");
        this.isScriptSelectorType = this.nodeElement?.elementSelectorType === "script";
        this.populateEditor();
        this.toggleBtnPointAndClick();
        this.togglePointAndClickClick('Remove');
        this.onTxtSelectorChange();
        this.handleHeaderButtons();
        this.checkForInvalidScript();
        // Initiate Undo stack with original Value for restoring.
        this.undoStack.push(this.nodeElement);

        
    }

    /**
     * Checks if the script failed to beautified and displays error message if failed
     */
    checkForInvalidScript(){
        if(this.isScriptSelectorType && this.#components.txtSelector.scriptStatus.isError){
            let errorMessage = "<span style='width: 100%;display: inline-flex; align-items: center; justify-content: center; font-weight: 900;'> Failed to parse script </span> <br><br>"
            let dialogBox = new ShowErrDialog({
                okButtonText: "Ok",
                errorText: errorMessage +  "Script might have invalid syntax. Please validate.",
                warningText: " "
              });
          
              dialogBox.confirm();
        }
    }

    computeCurrentIndex(nodeElement) {

        let payloadList = this.getAuthRootNodeDataBasedOnCategory(  this.authObj, nodeElement);
        let isExistingNode = false;
        if (payloadList && payloadList.length > 0) {
            for (let i in payloadList) {
                if (nodeElement.elementId === payloadList[i].elementId) {
                    isExistingNode = true;
                    return i;
                }
            }
            
        } 
        if(!isExistingNode && payloadList) {
            return payloadList.length;
        }
    }

    populateEditor() {

        if (this.validateInputNodeElement()) {
            //if empty, initiate Basic element node
            this.nodeElement = new BasicElement("", "BasicElement", "", "", "root");
        } else {
            this.createContainerDivs();
            this.createStaticComponents();
            this.createDynamicComponents(this.#components.ddlActionType.getSelectedItem(), this.nodeElement);
            this.onChangeOfFormElements('uh_static_editor_');  
			this.onChangeOfFormElements('uh_editor_');
        }
    }


    onExportClick(event) {
        this.onExportCallBack(event, this);
    }

    onValidateClick(event){
        this.onValidateCallBack(event, this);
    }

    onDebugClick() {
        this.onDebugCallBack();
    }

    /**
     * Call back is triggered on the event of traverse button(UP or DOWN) click.
     */

    onTraverseClick(event) {
        this.onTraverseCallBack(event.srcElement.innerHTML, this);
    }

    onUndoClick(){

        this.nodeElement = this.undoStack.pop();
        this.populateEditor();
        this.handleHeaderButtons();

        this.onSaveCallback(this.currentIndex, null, this, this.nodeElement);
    }

    handleSelectorChange(){
        if(this.nodeElement.elementSelectorType !== this.#components.ddlSelectorType.selectedItem && this.isValidEditor){

            this.isScriptSelectorType = this.#components.ddlSelectorType.selectedItem === "script";
            this.#components.txtSelector.toggleBeautifier(this.isScriptSelectorType );
            this.#components.macrosTxtSelector.toggleBeautifier(this.isScriptSelectorType );
            if(this.isScriptSelectorType){
                document.getElementById('temp_btnValidateScript').style.display = "inline-block";
                document.getElementById('divIconContainer').style.display = "inline-block";
                document.getElementById('temp_btnFullScreen').style.display = "block";
            } else {

                document.querySelectorAll(`[id^=temp_]`).forEach(ele => {
                    ele.style.display = "none";
                });

                this.#components.macrosTxtSelector.getEditorObject().getWrapperElement().style.display = "none";
                this.#components.txtSelector.getEditorObject().getWrapperElement().style.display = "block";
            }
        }
        let content = this.getCodeText();
        let allow = (content!=undefined && (content.length==0 || content.replaceAll(' ','').length==0)) ? false : true;
        
        if(allow && (this.#components.ddlSelectorType.selectedItem=="css" || this.#components.ddlSelectorType.selectedItem=='xpath'))
            Utils.disableEnableButton(document.getElementById('btnListingPgSuggestXpath'), false);
        else
           Utils.disableEnableButton(document.getElementById('btnListingPgSuggestXpath'), true);
    }

    handleMacrosChange() {
        this.isMacrosPresent = this.getCodeText().includes("macros");

        if(this.isMacrosPresent){
            document.getElementById("divPreview").style.display = "inline-block";
        } else {
            document.getElementById("divPreview").style.display = "none";
        }
    }

    handleDynamicOptions(){
        this.handleSelectorChange();
        this.handleMacrosChange();
    }

    onSaveClick(event) {
        
        //  Set selector type as css and selector as body if element persit is true for new node
        if(event && event.target.value != "Select" && event.target.id == 'uh_editor_ddlDocumentType'){
            this.setSelectorOnDocumentChange();
        }
        

        this.handleDynamicOptions();

        if (this.onSaveCallback) {

            let nodeElement = this.#components.dyanamicElements.onSaveChanges();
            //Prepare or Payload type
            nodeElement.category = this.nodeElement.category;
            
            nodeElement = this.saveStaticComponentValues(nodeElement);
            // nodeElement["IsValidSelector"] = !this.isBroken;
            
            if (this.validateEditor(nodeElement)) {
                this.showAutoSaved();
                this.onSaveCallback(this.currentIndex, null, this, nodeElement);              
                let authObject =  this.getUHAuthObjectFromStorage();// JSON.parse(window.localStorage.getItem('authScriptObject'));              
                this.authObj = authObject;              
                this.currentIndex = this.computeCurrentIndex(nodeElement);
                this.nodeElement = nodeElement;
                this.hideAutosaved();
            }

            // For UNDO functionality
            this.undoStack.push(nodeElement);
            this.handleHeaderButtons();

        }

        //this.resetFormIsDirty(this.#components);
        

    }

    validateEditor(nodeElement) {
        this.isValidEditor = true;
        //Validate Duplicate ElementIds
        if( this.validateNodeNameAlreadyExists( nodeElement)){
            return this.toggleDisplayMessage(null, "Already Node Id Exists. Please update with new Node Id");
        }

        //do validations here	
        let elementType = nodeElement.elementType;
        if (elementType) {
            if (elementType === 'SelectElement') {
                let elementSelectVal = nodeElement.elementSelect;
                let message = "Select attribute is mandatory for Select Element";
                return this.toggleDisplayMessage(elementSelectVal, message);
            } else if (elementType === 'InputTextElement') {
                let elementTextVal = nodeElement.elementText;
                let message = "Text attribute is mandatory for Input Text Element";
                return this.toggleDisplayMessage(elementTextVal, message);                                
            } else if (nodeElement.elementMultiple && nodeElement.elementFetchType === undefined) {                
                let message = "FetchType should be set some value if multiple is true";
                let style = "color: red; width: 100%;";
                document.getElementById('lblErrorMessage').setAttribute('style', style);
                document.getElementById('lblErrorMessage').innerText = message;              
            }
            else if (this.validatePersistCountForPrepare(nodeElement)){
                let message = "Persist can be done only once in prepare";
                let style = "color: red; width: 100%;";
                document.getElementById('lblErrorMessage').setAttribute('style', style);
                document.getElementById('lblErrorMessage').innerText = message;                               
            }
            else {
                return true;
            }
        }
        return true;
    }

    validatePersistCountForPrepare(nodeElement) {
        
        
        if( nodeElement && nodeElement.category && nodeElement.category !== "prepare" ){
            return false;
        }               
         
        let isElementPersistedCount = 0;        
        let harvestorPrepareNodes =  this.getAuthRootNodeDataBasedOnCategory( this.authObj, nodeElement);//  authObj.payload.harvestorPayloadNode;
        if (harvestorPrepareNodes.length) {
            for (let i in harvestorPrepareNodes) {
                if(harvestorPrepareNodes[i].elementPersist === true) {
                    isElementPersistedCount++;
                }
                
            }
        }
        return isElementPersistedCount > 1;

    }

    validateNodeNameAlreadyExists(nodeElement){

        let isNodeNameExistsAlready = false;
        let currentIndex = this.currentIndex;
        let harvesterNodes =  this.getAuthRootNodeDataBasedOnCategory( this.authObj,this.nodeElement);
        harvesterNodes.forEach(function (item, index) {
            if( item.elementId.trim().toLowerCase() ===  nodeElement.elementId.trim().toLowerCase()  && index != currentIndex){
                isNodeNameExistsAlready = true;
                return;
            }
        });

        return isNodeNameExistsAlready;
    }

    saveStaticComponentValues(nodeElement) {
        nodeElement.elementId = this.#components.txtNode.val;
        nodeElement.elementSelectorType = this.#components.ddlSelectorType.selectedItem;

        let selectorContent = Utils.removeEmptySpace(this.getCodeText().replace(/\r?\n|\r/g, ""), ["{", "}"]);
        nodeElement.elementSelector = selectorContent === "" ? undefined : selectorContent;
        nodeElement.elementType = this.#components.ddlActionType.selectedItem;   
        nodeElement.elementSelectorContextOn = this.#components.selectorContextOn.textbox.val && this.#components.selectorContextOn.textbox.val.trim().length ? this.#components.selectorContextOn.textbox.val : undefined;
        
        // if new parent is a valid parent then, proceed to save, else display error
        let harvestorPayloadNodes =  this.getAuthRootNodeDataBasedOnCategory( this.authObj, nodeElement);
        let validParents = this.createEligibleParentsList(harvestorPayloadNodes, nodeElement);       

        if (!harvestorPayloadNodes.length || ( validParents != undefined && validParents.length > 0 && validParents.includes(this.#components.txtParentNode.val))) {
            nodeElement.elementParent = this.#components.txtParentNode.val;
            let style = "color: red; width: 100%; display: none;";
            document.getElementById('lblErrorMessage').setAttribute('style', style);
        } else {
            let message = "Not a valid parent value";
            let style = "color: red; width: 100%;";
            document.getElementById('lblErrorMessage').setAttribute('style', style);
            document.getElementById('lblErrorMessage').innerText = message;

        }

        //Validate Node Element Fields
        nodeElement.isvalid = this.hasValidValues( nodeElement);
        
        return nodeElement;
    }

    setSelector(selectedItem) {
        let val = this.nodeElement.elementSelector;
        if (this.#components.ddlSelectorType.selectedItem == 'css') {
            val = selectedItem[1].content;
        }

        if (this.#components.ddlSelectorType.selectedItem == 'xpath') {
            val = selectedItem[2].content;
        }
        this.pointAndClickActive = false;
        this.#components.txtSelector.setValue(val);
        this.onTxtSelectorChange();
        this.toggleBtnPointAndClick();

    }

    /*
        Set element selector type as css and selector as body if perists is true
    */
    setSelectorOnDocumentChange() {
        let elementSelectorType = this.nodeElement.elementSelectorType == undefined? "":this.nodeElement.elementSelectorType;
        if(elementSelectorType.length<1){
            this.setSelectorTypeDropdown(this.nodeElement.actionType,'css');
            this.resetSelectorContextOptions( 'css');
            this.toggleValidateScript('css');
            this.onChangeOfFormElements('uh_static_editor_ddlSelectorType');
        }
        
        let elementSelector = this.nodeElement.elementSelector == undefined ?"":this.nodeElement.elementSelector ;
        if(elementSelector.length<1){
            this.#components.txtSelector.setValue('body');
        }       
    }

    onChangeOfFormElements(editoridname) {

        var inputs = document.querySelectorAll(`[id^=${editoridname}]`);
        var i = 0;
        for (i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('change', this.onSaveClick.bind(this));
        }
    }

    setPreview(ele, cnt) {

        if( !ele){
            return;
        }

        if (ele === "body" || ele === "//body") {
            ele = "The preview content can't be displayed as the selector is a 'body' which may have a huge content";
        }

        this.#components.txtPreview.setValue(ele);

        if (document.getElementById('txtPreview').value != undefined && this.#components.showMoreloader) {
            document.getElementById('divLoading').style.display = "none";
            this.#components.showMoreloader = false;
        }

        if (ele.endsWith("...Click on Show More button to view more")) {
            document.getElementById('btnShowMore').disabled = false;
            this.#components.trimmedPreviewTxt = ele;
            Utils.disableEnableButton(document.getElementById('btnShowMore'), false);
        } else {
            document.getElementById('btnShowMore').disabled = true;
            Utils.disableEnableButton(document.getElementById('btnShowMore'), true);
        }

        document.getElementById('lblSelectedItemCount').innerHTML = "(" + cnt + ")";
    }


    onPointAndClick(event) {
        if (MetaData.isAnnotatableSelectorType(this.#components.ddlSelectorType.selectedItem)) {

            let pointAndClick = this.pointAndClickActive ? "Remove" : "Add";
            if (this.togglePointAndClickClick) {
                this.togglePointAndClickClick(pointAndClick, event, this);
                this.pointAndClickActive = !this.pointAndClickActive;
            }
            this.toggleBtnPointAndClick();
        }
        // if (MetaData.isExecutableSelectorType(this.#components.ddlSelectorType.selectedItem)) {
        //     this.onSelectorChangeCallback(this.#components.txtSelector.val, this.#components.ddlSelectorType.selectedItem, false);
        // }
    }

    switchToFullscreen = () => {
        if(this.#components.macrosTxtSelector.getEditorObject().getWrapperElement().style.display == "block"){
            this.#components.macrosTxtSelector.switchToFullscreen(); 
        } else this.#components.txtSelector.switchToFullscreen();
        
        document.getElementById('btnExitFullScreen').style.display = "block";
    }

    exitFullscreen = () => {
        document.getElementById('btnExitFullScreen').style.display = "none";

        if(this.#components.macrosTxtSelector.getEditorObject().getWrapperElement().style.display == "block"){
            this.#components.macrosTxtSelector.exitFromFullscreen(); 
        } else this.#components.txtSelector.exitFromFullscreen();
        
    }

    clearPreviewTest = () => {
        let previewTextArea = document.getElementById("txtPreview");

        //clearing the previous value from preview textarea
        if(previewTextArea !== null) {
            previewTextArea.innerHTML = "";
        }
    }

    validateScript = () => {      
        this.clearPreviewTest();
        
        if (MetaData.isExecutableSelectorType(this.#components.ddlSelectorType.selectedItem)) {
            if(this.#components.macrosTxtSelector.getEditorObject().getWrapperElement().style.display == "block"){
                this.onSelectorChangeCallback(this.#components.macrosTxtSelector.getValue(), this.#components.ddlSelectorType.selectedItem, false, false);
            } else {
                this.onSelectorChangeCallback(this.#components.txtSelector.getValue(), this.#components.ddlSelectorType.selectedItem, false, false);
            }
        }
    }

    annotationOnComplete(length) {
        //Skip Error message for APIHTMLElement
        if( this.#components.ddlActionType.getSelectedItem() === MetaData.getActionTypes.APIToHTMLElement || this.#components.ddlActionType.getSelectedItem() === MetaData.getActionTypes.FileToHTMLElement || this.#components.ddlActionType.getSelectedItem() === MetaData.getActionTypes.BrowserToHtmlElement){
            return;
        }

        this.showOrHideElementNotExists(length > 0, "No matching element to highlight in this page for given (Selector-Selector type)");
        // this.showOrHideElementDetails(ele);       
    }

    showOrHideElementDetails(ele) {
        let showMessage = MetaData.isAnnotatableSelectorType(this.#components.ddlSelectorType.selectedItem) ? ele != null && ele.length > 0 : false;
        let style = showMessage ? "color: width: 100%;" : "color:  width: 100%; display: none;";
        document.getElementById('lblSelectedElement').setAttribute('style', style);
        document.getElementById('lblSelectedElement').innerText = ele.innerHTML;
    }

    showOrHideElementNotExists(elementExists, message) {
        this.isBroken = !elementExists;
        let style = this.isBroken ? "color: red; width: 100%;" : "color: red; width: 100%; display: none;";
        document.getElementById('lblErrorMessage').setAttribute('style', style);
        document.getElementById('lblErrorMessage').innerText = message;
    }

    toggleBtnPointAndClick() {
        let style = this.pointAndClickActive ? 'margin-right:0px; background-color: #DCEDFF; font-weight:700' : 'margin-right:0px;';
        let cursorStyle = this.pointAndClickActive ? 'cursor: grab; cursor: -webkit-grab;' : 'cursor: default';
        this.setAttributes(document.getElementById('btnAnnotate'), { 'style': style });
        document.querySelector('body').setAttribute('style', cursorStyle);
    }

    getCodeText = () => {
        try {
            if(this.#components.txtSelector instanceof CodeEditor) {
                return this.#components.txtSelector.getValue();
            }
            return this.#components.txtSelector.value !== undefined ? this.#components.txtSelector.value
                                                                    : this.#components.txtSelector.val;
        } catch (error) {
           console.log("Error occured while fetching Value: "+ error);  
        }
    }

    validateInputNodeElement() {
        return this.nodeElement == null
    }

    OnSelectorChange(event){        
        if( event && event.target && event.target.value){
            this.resetSelectorContextOptions( event.target.value);
            this.toggleValidateScript(event.target.value);
        }

        this.onTxtSelectorChange(event);
    }

    //Enable or Disable Validate Script button based on Selector type
    toggleValidateScript (selectorOption) {
        document.getElementById('temp_btnValidateScript').style.display = selectorOption !== "script"
                                                                        ? "none" : "inline-block";

    }

    //Enable or Disable the SelectorContext options based on Selectors
    resetSelectorContextOptions(selectoroptions){
        let enableSelectorContext = false;
        if( selectoroptions && this.#components.selectorContextOn.selectortype.indexOf( selectoroptions.toLowerCase()) > -1){
            enableSelectorContext = true;
        }

        this.#components.selectorContextOn.label.style.display= enableSelectorContext? "block":"none";
        this.#components.selectorContextOn.textbox.enableControl( enableSelectorContext);
        
        if( !enableSelectorContext){
            this.#components.selectorContextOn.textbox.setValue( "");
        }
    }

    onTxtSelectorChange(event) {
        this.showOrHideElementNotExists(true, "");

        let codeText = this.getCodeText();
        
        try {
            let disableSuggest = (codeText!=undefined &&(codeText.length==0 || codeText.replaceAll(' ','').length==0)) ? true : false;
            Utils.disableEnableButton(document.getElementById('btnListingPgSuggestXpath'), disableSuggest);

            if (MetaData.isAnnotatableSelectorType(this.#components.ddlSelectorType.selectedItem)) {
                this.onSelectorChangeCallback(codeText, this.#components.ddlSelectorType.selectedItem, false);
            }

            if (MetaData.isProvidedType(this.#components.ddlSelectorType.selectedItem)) {
                this.validateMacro(codeText);
            }
        } catch (error) {
            console.log("Error occured: "+ error);
        }
    }

    onClickShowMorePreview() {
        if(this.isMacrosPresent && this.#components.trimmedPreviewTxt != null){
            return;
        }
        document.getElementById('divLoading').style.display = "block";
        this.#components.showMoreloader = true;

        let codeText = this.getCodeText();
                                            
        if (MetaData.isAnnotatableSelectorType(this.#components.ddlSelectorType.selectedItem)) {
            this.onSelectorChangeCallback(codeText, this.#components.ddlSelectorType.selectedItem, false, true);
        }

        if(MetaData.isExecutableSelectorType(this.#components.ddlSelectorType.selectedItem)) {
            this.onSelectorChangeCallback(codeText, this.#components.ddlSelectorType.selectedItem, false, true);
        }
    }

    onClickXPATHSuggestor() {

        // Ensuring the document-type from the user.
        if(this.nodeElement.elementDocumentType==undefined){
            this.showDialogMessage("Please set Document Type in Harvester - '"+this.nodeElement.elementId+"'");
            return;
        }

        if(this.isMacrosPresent && this.#components.trimmedPreviewTxt != null){
            return;
        }
        document.getElementById('divLoading').style.display = "block";

        let codeText = this.getCodeText();

        const PAGE_TYPE = (this.nodeElement.elementId==='listing_page') ? 'listing_page'
                       : (this.nodeElement.elementId==='detail_page') ? 'posting_page' : '';

        if(PAGE_TYPE){
            if (MetaData.isAnnotatableSelectorType(this.#components.ddlSelectorType.selectedItem)) {
                this.onSelectorChangeCallback(codeText, this.#components.ddlSelectorType.selectedItem, false, true, PAGE_TYPE);
            }
    
            if(MetaData.isExecutableSelectorType(this.#components.ddlSelectorType.selectedItem)) {
                this.onSelectorChangeCallback(codeText, this.#components.ddlSelectorType.selectedItem, false, true, PAGE_TYPE);
            }
        }
    }

    onFocusOutTextArea(event) {

        this.#components.txtPreview.setValue(this.#components.trimmedPreviewTxt);
        document.getElementById('btnShowMore').disabled = false;
        Utils.disableEnableButton(document.getElementById('btnShowMore'), false);
    }

    validateMacro(selector) {

        let keyValues = [];
        try {

            if (selector.split("${macros['").length == 1) {
                return;
            }

            let macroExps = selector.split("${macros['").filter(ele => {
                return ele.indexOf("']}") >= 0;
            });

            keyValues = macroExps.map(ele => {
                return ele.split("']}")[0].replaceAll("']['", '||');
            });

            let inValidFields = "";
            keyValues.forEach(ele => {

                if (ele.split('||')[0] == "params" && (this.authObj.params == undefined || this.authObj.params[ele.split('||')[1]] == undefined)) {
                    this.showOrHideElementNotExists(false, ele.split('||')[1] + ' is not a valid param');
                    inValidFields = ele.split('||')[1];
                    return false;
                }

                if (ele.split('||')[0] != "params" && this.LstHarvestingIds.indexOf(ele.split('||')[0].trim()) < 0) {
                    inValidFields = ele.split('||')[0];
                    this.showOrHideElementNotExists(false, inValidFields + ' is not a valid field');
                    return false;
                }

            });

            if (inValidFields == "") {
                this.showOrHideElementNotExists(true, ' ');
                return true;
            }

        } catch (e) {
            this.showOrHideElementNotExists(false, selector + ' is not a valid macro');
            return;
        }


    }

    getListOfHarvestingNodes(authObj, nodeElement) {

        //Get Root Node Data based on Category - Prepare or Payload
        let rootNodeData = this.getAuthRootNodeDataBasedOnCategory( authObj, nodeElement);
        return rootNodeData.map(node => {
            return node.elementId;
        });
    }

    // Dynamically sets the element selector dropdown options based on the action types.
    setSelectorTypeDropdown(actionType, elementSelectorType){ 

        let selectorType = MetaData.getSelectorTypes;
        if( actionType === MetaData.getActionTypes.APIToHTMLElement || actionType === "APIToHTMLElement" || actionType === MetaData.getActionTypes.FileToHTMLElement || actionType === "FileToHTMLElement" || actionType === MetaData.getActionTypes.BrowserToHtmlElement || actionType === "BrowserToHtmlElement"){
            selectorType = MetaData.getApiSelectorTypes;
            MetaData.getSelectorTypes[elementSelectorType] != undefined && (elementSelectorType = undefined);
        } else {
            MetaData.getApiSelectorTypes[elementSelectorType] != undefined && (elementSelectorType = undefined);
        }
        this.nodeElement.elementSelectorType = elementSelectorType;
        document.getElementById('divEleSelectorType').innerHTML = "";
        this.#components.ddlSelectorType = new DropDown('divEleSelectorType', 'uh_static_editor_ddlSelectorType', selectorType, elementSelectorType, this.OnSelectorChange.bind(this), null, null, true);
    }

    /**
     * Displays code editor with resolved macros values.
     * Hides normal code editor and related buttons.
     */
    showMacrosEle(){
        document.getElementById('temp_btnHideMacros').style.display = "block";
        document.getElementById('temp_btnShowMacros').style.display = "none";
        this.#components.macrosTxtSelector.getEditorObject().getWrapperElement().style.display = "block";
        this.#components.txtSelector.getEditorObject().getWrapperElement().style.display = "none";
    }

    /**
     * Hides code editor with resolved macros values.
     * Shows normal code editor and related buttons.
     */
    hideMacrosEle(){
        document.getElementById('temp_btnShowMacros').style.display = "block";
        document.getElementById('temp_btnHideMacros').style.display = "none";
        this.#components.macrosTxtSelector.getEditorObject().getWrapperElement().style.display = "none";
        this.#components.txtSelector.getEditorObject().getWrapperElement().style.display = "block";
    }

    onCodeEditorSelectorChange() {
        this.onTxtSelectorChange(); 
        this.onSaveClick();
    }

    createStaticComponents() {
        const lblStyle = "width: 85px;  font-weight: 550";
        const lblStyleSmall = "width: 25px;  font-weight: 550";
        //const lblStyleSmall = "width: 55px;  font-weight: 550";
        const lblStyleSmallParent = "width: 85px;  font-weight: 550";
        //const lblStyleLarge = "width: 45px;  font-weight: 550; height: 30px";   
        const btnStyle = "margin-right:20px";
        const lblErrorMessage = "color: red; display:none";
        const classExitFullscreen = "position: fixed; top: 5px; right: 15px; z-index: 10;"
        const iconBottom = "float: left; clear: left; margin-top: 5px;"
        const iconTop = "float: left; "
        const imageStyle = "top: 200px;left: 240px;z-index: 100; box-shadow:0 0 0 0";

        this.createLabel('divLblActionType', { style: lblStyle, id: 'lblActionType' }, 'Action Type *');
        this.#components.txtNode = new TextBox('divEleNodeId', 'uh_static_editor_txtNodeId', null, this.nodeElement.elementId, "",
                this.onNodeIDChange.bind(this), null, null, null, null, null, true);
        this.createLabel('divLblSelectorType', { style: lblStyle, id: 'lblSelectorType' }, 'Selector Type *');
        this.setSelectorTypeDropdown(this.nodeElement.elementType, this.nodeElement.elementSelectorType);
        this.createLabel('divLblSelector', { style: lblStyle, id: 'lblSelector' }, 'Selector *');
        
        this.createButton("divValidateScript", {id: 'temp_btnValidateScript' }, 'Validate Script', { "click": this.validateScript } );

        this.createIcon("divIconContainer", { style: iconTop, id: 'temp_btnFullScreen' }, "../../images/expand-editor.png", { "click": this.switchToFullscreen } );
        this.createIcon("divIconContainer", { style: classExitFullscreen, id: 'btnExitFullScreen' }, "../../images/shrink-editor.png", { "click": this.exitFullscreen } );

        if(this.isMacrosPresent){
            this.createIcon("divIconContainer", { style: iconBottom, id: 'temp_btnShowMacros' }, '../../images/toggle-off.png', { "click": this.showMacrosEle.bind(this) } );
            document.getElementById('temp_btnShowMacros').style.display = "none";
            
        }
        this.createButton('divPreview', {style: btnStyle, id:'btnPreview'},'Preview Macros', {"click": this.launchPreviewMacroEvaluate.bind(this) });
        this.createIcon("divIconContainer", { style: iconBottom, id: 'temp_btnHideMacros' }, '../../images/toggle-on.png', { "click": this.hideMacrosEle.bind(this) } );

        // will be enabled only when in fullscreen mode
        document.getElementById('btnExitFullScreen').style.display = "none";
        document.getElementById('temp_btnHideMacros').style.display = "none";

        let codeEditorOptions = {};
        if((this.nodeElement.elementSelectorType && this.nodeElement.elementSelectorType.toLowerCase() !== "script") || !this.nodeElement.elementSelectorType){ 
            codeEditorOptions=  {lineNumbers: false, matchBrackets: false, autoCloseBrackets: false} ;
            document.getElementById('temp_btnValidateScript').style.display = "none";
            document.getElementById('temp_btnFullScreen').style.display = "none";
        }
        this.#components.txtSelector = new CodeEditor('divEleSelector', 'uh_static_editor_txtSelector', this.nodeElement.elementSelector ? this.nodeElement.elementSelector : '', this.onCodeEditorSelectorChange.bind(this), codeEditorOptions, this.isScriptSelectorType);
        codeEditorOptions = {...codeEditorOptions, readOnly: true, theme: "duotone-light"}
        this.#components.macrosTxtSelector = new CodeEditor('divEleSelector', 'uh_static_editor_txtSelector', "Macros Element resolved here", () => {} , codeEditorOptions, this.isScriptSelectorType);
        this.#components.macrosTxtSelector.getEditorObject().getWrapperElement().style.display = "none";

        let actionTypes = JSON.parse(JSON.stringify(MetaData.getActionTypes));     
        if(this.nodeElement.category == 'payload'){
            delete actionTypes.ParamElement;
        }

        this.createLabel('divLblParentNode', { style: lblStyleSmallParent, id: 'lblParentNodeId' }, 'Parent *');
        this.#components.txtParentNode = new TextBox('divEleParentNode', 'uh_static_editor_txtParentNode', '', this.nodeElement.elementParent, '', null, null, null, null, null, null, true);        
        this.createLabel('divLblNodeId', { style: lblStyle, id: 'lblNodeId' }, 'Node id *');
        this.#components.ddlActionType = new DropDown('divEleActionType', 'uh_static_editor_ddlActionType', actionTypes, this.nodeElement.elementType, this.changeActionType.bind(this), null, null, true);

        let enableSelectorContext = false;        
        if( this.nodeElement.elementSelectorType && this.#components.selectorContextOn.selectortype.indexOf( this.nodeElement.elementSelectorType.toLowerCase()) > -1){
            enableSelectorContext = true;
        }

        this.#components.selectorContextOn.label = this.createLabel('divLblSelectorContextOn', {style: lblStyle + (enableSelectorContext? "" : " ;display : none" ), id: 'lblSelectorContextOn'}, 'Selector Context');
        this.#components.selectorContextOn.textbox = new TextBox('divEleSelectorContextOn','uh_static_editor_txtSelectorContextOn', '', this.nodeElement.elementSelectorContextOn? this.nodeElement.elementSelectorContextOn: '' ,'' , enableSelectorContext);
        this.#components.selectorContextOn.textbox.enableControl( enableSelectorContext);

        this.createButton('divBtnXpathSuggestor',{style: btnStyle, id:"btnListingPgSuggestXpath"}, 'Suggest', {"click": this.onClickXPATHSuggestor.bind(this)});

        this.createButton('divIconSelector', { style: btnStyle, id: 'btnAnnotate' }, 'X', { "click": this.onPointAndClick.bind(this) });
        //this.createButton('divIconSave', {style: btnStyle, id:'btnSave'},'Save', {"click": this.onSaveClick.bind(this)});
        this.createButton('divIconSave', { style: btnStyle, id: 'btnExport' }, 'Export', { "click": this.onExportClick.bind(this) });
        this.createButton('divIconValidate', { style: btnStyle, id: 'btnValidate' }, 'Validate', { "click": this.onValidateClick.bind(this) });
        this.createButton('divMoveUp', { style: btnStyle, id: 'btnUp' }, 'Up',  { "click": this.onTraverseClick.bind(this) });
        this.createButton('divMoveDown', { style: btnStyle, id: 'btnDown' }, 'Down',  { "click": this.onTraverseClick.bind(this) });
        this.createButton('divUndo', { style: btnStyle, id: 'btnUndo' }, 'Undo',  { "click": this.onUndoClick.bind(this) });
        this.createLabel('divLblErrorMessage', { style: lblErrorMessage, id: 'lblErrorMessage' }, 'No matching element to highlight in this page for given (Selector-Selector type)');
        this.createLabel('divSeparator', { style: lblStyleSmall, id: 'lblSeparator' }, '|');
        //this.createLabel('divLblErrorMessage', {style: lblInfo, id: 'lblSelectedElement'},'Hello');
        this.createButton('divDebug', {style: btnStyle, id:'btnDebug'},'Debug', {"click": this.onDebugClick.bind(this)});

        this.createLabel('divLblPreview', { style: lblStyle, id: 'lblSelector' }, 'Preview');
        this.#components.txtPreview = new TextArea('divElePreview', 'txtPreview', 'toolinput', '', '', '5', '100', null, this.onFocusOutTextArea.bind(this), null, null, true);

        this.createLabel('divLblCount', { style: lblStyle, id: 'lblSelectedItemCount' }, '(0)');

        this.createButton('divIconShowMore', { style: btnStyle, id: 'btnShowMore', disabled: "disabled" }, 'Show More', { "click": this.onClickShowMorePreview.bind(this) });
        Utils.disableEnableButton(document.getElementById('btnShowMore'), true);
        this.createImage("divLoading", "loading-image", imageStyle, "../../js/container/editor/loader.gif", "Loading..");
    }

    /**
     * On click function for initiating macros evaluation.
     */
    launchPreviewMacroEvaluate = () => {
        this.getAuthObjManagerObj().splitUnifiedObject();
        this.macrosProgressModal = new MacrosProgressModal(this.getAuthObjManagerObj().harvestingObject, this.nodeElement.category , this.nodeElement.elementId, this.onSetMacrosPreviewCallback.bind(this),null);
        this.macrosProgressModal.launchMacrosEvalModal();
    }
    
    onPreviewMacrosClick(){
        let proxyDialogUtil = new ProxyDialogUtil();
        proxyDialogUtil.showProxyDialog( this.launchPreviewMacroEvaluate);
    }

    /**
     * Sets resolved macros values to preview text box and in code editor.
     */
    onSetMacrosPreviewCallback(nodeResponse){

        if(nodeResponse.result){
            let result = typeof nodeResponse.result == 'string' ? nodeResponse.result : JSON.stringify(nodeResponse.result, this.isScriptSelectorType);
            this.#components.txtPreview.setValue(result);
            this.#components.trimmedPreviewTxt = result;
        }
        this.showMacrosEle();
        this.#components.macrosTxtSelector.setValue(nodeResponse.query, this.isScriptSelectorType);
    }


    /**
     * Dynamically enables or disables the Traverse buttons
     * based on the position of the selected node.
     */

    handleHeaderButtons(){

        let upButton = document.getElementById("btnUp");
        let downButton = document.getElementById("btnDown");
        let undoButton = document.getElementById("btnUndo");
        let xpathButton = document.getElementById("btnListingPgSuggestXpath");

        let {nodesToTraverse, isNewNode} = this.findSiblingNodes();

        let isUndoStackEmpty = this.undoStack.length() == 0;
        Utils.disableEnableButton(undoButton, isUndoStackEmpty);

        if(this instanceof HarvesterNodeEditor){
            if(this.nodeElement.elementId==="listing_page" || this.nodeElement.elementId==="detail_page")
                Utils.hideShowButton(xpathButton, true);
            else
                Utils.hideShowButton(xpathButton, false);
        }

        let isFirstNode = true;
        let isLastNode = true;

        if(!isNewNode){
            isFirstNode = nodesToTraverse[0] ? this.nodeElement.elementId == nodesToTraverse[0].elementId : true;
            isLastNode = nodesToTraverse[0] ? this.nodeElement.elementId == nodesToTraverse.reverse()[0].elementId: true;
        }

        Utils.disableEnableButton(upButton, isFirstNode);
        Utils.disableEnableButton(downButton, isLastNode);

    }


    /**
     * Below method find the siblings Harvester nodes for any given node.
     * Used for rearranging a Harvester node.
     */

    findSiblingNodes(){ 

        let payload = this.authObj.payload.harvestorPayloadNode;

        if(this.nodeElement.category === "prepare") {
            payload = this.authObj.prepare.harvestorPrepareNode;
        }

        let nodesToTraverse =  [];
        let isNewNode = true;

        for(const key of Object.keys(payload)){
            payload[key].elementParent == this.nodeElement.elementParent && nodesToTraverse.push(payload[key]);
            payload[key].elementId === this.nodeElement.elementId && (isNewNode = false);
        }

        return {nodesToTraverse, isNewNode};
    }

    onFormEdit() {
        //Set flag to notify form is dirty
    }

    changeActionType(event) {
        this.createDynamicComponents(event.target.selectedOptions[0].innerHTML, this.nodeElement);
        this.setSelectorTypeDropdown(event.target.selectedOptions[0].innerHTML, this.nodeElement.elementSelectorType);
        this.onChangeOfFormElements('uh_static_editor_ddlSelectorType');
        this.onChangeOfFormElements('uh_editor_');
    }

    createDynamicComponents(elementType, nodeElement) {
        let div = document.getElementById("divOptionContainer");
        div.innerHTML = "";
        this.#components.dyanamicElements = ElementOptionsFactory.createElementOptions(elementType, nodeElement, "divOptionContainer", this.onSaveClick.bind(this));

        //Enable/Disable Preview
        let previewStyle = "block";
        if( elementType === MetaData.getActionTypes.APIToHTMLElement || elementType === MetaData.getActionTypes.FileToHTMLElement || elementType === MetaData.getActionTypes.BrowserToHtmlElement){
            previewStyle = "none"
        }

        document.getElementById('divLblPreview').style.display=previewStyle;
        document.getElementById('divLblCount').style.display=previewStyle;
        document.getElementById('divElePreview').style.display=previewStyle;
        document.getElementById('btnShowMore').style.display=previewStyle;        
    }

    createContainerDivs() {
        /* const tblStyle = "height:100%";
         const divLabelStyle = "display:inline; width: 155px; text-align:left; padding-top:2px; padding-left:15px;"
         const divLblCountStyle = "display:inline; width: 155px; text-align:left; padding-top:2px; padding-left:5px;color:#337ab7"
         const divElementStyle = "display:inline; width: 220px;  text-align:left; padding-top:2px; padding-left:15px"
         const divErrorMessageStyle = "display:inline; width: 100%; text-align:left; padding-top:2px; padding-left:15px;"
         const divOptionContainerStyle = "display:inline, width:100%, padding-left:15px"
         const rowStyle = "margin-top: 12px; width: 100%";
         const firstRow = "margin-top: 12px; width: 100%; ";
         const colStyle = "display:inline; width: 25%; min-width: 350px; margin-left: 25px";
         const colStyle2X = "display:inline; width: 25%; min-width: 350px; margin-left: 0px;";
         const colOptionsStyle = "width: 100%; "; */

        const tblStyle = "height:100%";
        const divLabelStyle = "display: inline-block; padding:10px;"
        const divLblCountStyle = "display:inline; width: 155px; text-align:left; padding-top:2px; padding-left:5px;color:#337ab7"
        const divElementStyle = "display:inline; margin-left: -3%; "
        const divErrorMessageStyle = "display:inline; width: 100%; text-align:left; padding-top:2px; padding-left:15px;"
        const divOptionContainerStyle = "display:inline, width:100%, padding-left:15px"
        const rowStyle = "";
        const firstRow = "";
        const colStyle = "display:inline; width: 25%; min-width: 350px; margin-left: 25px";
        const colStyle2X = "display:inline; width: 25%; min-width: 350px; margin-left: 10px;";
        const colOptionsStyle = "width: 100%; ";
        // my custom css style goes here
        const classRow = "margin-top:20px";
        const classCol = "display: inline-block;";
        const classColEle = "display: inline-block;";
        const classSelectorScript = "display: inline-block; max-width: 70em; min-width: 70em; margin-bottom: 1em;";
        const exportIcon =  "display: inline-block;margin-left:25px";
        const pointAndClick = "display: inline-block;margin-left: 25px;"
        const showMoreButtonStyle = "display:inline-block;margin-left: 20px;margin-top: 0px; padding-top: 10px padding-top:2px; padding-left:65px;";
        const divImageStyle = "width: 100%;  height: 100%;  top: 0;  left: 0;  position: fixed;  display: none;  opacity: 0.7;  background-color: #fff;  z-index: 99;  text-align: center;";
        const editorHeader = ";border-bottom: 2px solid rgb(0 0 0 / 25%); padding-bottom:15px;width:90%";
        const classSeparator = "display: inline-block; font-size: 25px;";
        const classFullscreen = "position: relative; top: -157px; left: 797px; z-index: 2;"
        const classIconContainer = "display: inline-block ; position: absolute; margin-left: 5px;";
        const classExitFullscreen = "position: fixed; top: 5px; right: 15px; z-index: 10;"
        const classMacros = this.isMacrosPresent ? "display: inline-block" : "display:none"

        /*
        let tblObj = {
            attr : {style : tblStyle} ,
            id : "tblEditorMain",
            rows: [
                {
                    attr: {style: firstRow},
                    col : [
                         { attr: {style: colStyle2X} , divs: [{ attr: {style: divLabelStyle, id: "divIconSelector"}}, 
                         {attr:  { style: divElementStyle, id: "divIconSave"}}]} ,
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblNodeId"} }, 
                         {attr: { style: divElementStyle, id: "divEleNodeId"}}] },
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblSelectorType"} }, 
                         {attr: { style: divElementStyle, id: "divEleSelectorType"}}]},
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblSelector"}}, 
                         {attr:  { style: divElementStyle, id: "divEleSelector"}}]}                         
                                                                         
                         
                    ]
                },
                {
                    attr: {style: rowStyle}, 
                    col : [
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblActionType"} },
                          {attr: { style: divElementStyle, id: "divEleActionType"}}] },                         
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblDocumentType"} }, 
                         {attr: { style: divElementStyle, id: "divEleDocumentType"}}]},
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblPersist"}}, 
                         {attr:  { style: divElementStyle, id: "divElePersist"}}]},
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblParentNode"} }, 
                         {attr: { style: divElementStyle, id: "divEleParentNode"}}] }
                    ]
                },
                {
                    attr: {style: ''},
                    col : [                         
                         { attr: {style: colOptionsStyle} , divs: [{ attr: {style: divOptionContainerStyle, id: "divOptionContainer"} }]}                        
                    ]
                },
                {
                    attr: {style: rowStyle},
                    col: [                        
                        {attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblPreview"}}, 
                        {attr:  { style: divElementStyle, id: "divElePreview"}},
                        {attr: {style: divLblCountStyle, id: "divLblCount"}}]},                         
                        {attr: {style: colStyle}, divs: [{attr: {style: divErrorMessageStyle, id: "divLblErrorMessage"}}] }
                    ]
                }

            ]
        }
        */

        let tblObj = {
            attr: { style: tblStyle },
            id: "tblEditorMain",
            rows: [
                {
                    attr: { style: classRow + editorHeader},
                    col: [
                        {
                            attr: { style: classCol }, divs: [{ attr: { style: pointAndClick, id: "divIconSelector" } },
                            { attr: { style: exportIcon, id: "divIconSave" } },
                            { attr: { style: classColEle, id: "divIconValidate" } },
                            { attr: { style: classColEle, id: "divDebug" } },
                            { attr: { style: classSeparator, id: "divSeparator" } },
                            { attr: { style: classColEle, id: "divMoveUp" } },
                            { attr: { style: classColEle, id: "divMoveDown" } },
                            { attr: { style: classColEle, id: "divUndo" } }],
                            
                        },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblErrorMessage" } }] },
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblNodeId" } }, { attr: { style: classColEle, id: "divEleNodeId" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblSelectorType" } }, { attr: { style: classColEle, id: "divEleSelectorType" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblSelectorContextOn"}}, {attr: {style: classColEle, id: "divEleSelectorContextOn"}}] },
                        { attr: { style: colStyle2X }, divs: [{ attr: { style: classCol, id: "divValidateScript" } }], },
                        { attr: { style: colStyle2X }, divs: [{ attr: { style: classMacros, id: "divPreview" } }], },
                        { attr: { style: colStyle2X }, divs: [{ attr: { style: classCol, id: "divBtnXpathSuggestor" } }], }

                    ]
                },
                {
                    attr: { style: classRow },
                    col: [                        
                        { attr: { style: colStyle }, divs: [
                            { attr: { style: classCol, id: "divLblSelector" } }, 
                            { attr: { style: classSelectorScript, id: "divEleSelector" } },
                            { attr: { style: classIconContainer, id: "divIconContainer" } },
                        ] }
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                        {
                            attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblActionType" } },
                            { attr: { style: classColEle, id: "divEleActionType" } }]
                        },                       
                        {
                            attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblParentNode" } },
                            { attr: { style: classColEle, id: "divEleParentNode" } }]
                        }
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                        { attr: { style: colOptionsStyle }, divs: [{ attr: { style: divOptionContainerStyle, id: "divOptionContainer" } }] }
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                        {
                            attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblPreview" } },
                            { attr: { style: classColEle, id: "divElePreview" } },
                            { attr: { style: divLblCountStyle, id: "divLblCount" } }]
                        }
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                        { attr: { style: colStyle }, divs: [{ attr: { style: showMoreButtonStyle, id: "divIconShowMore" } }] },                       
                        { attr: { style: colStyle }, divs: [{ attr: { style: divImageStyle, id: "divLoading" } }] }
                    ]
                }

            ]
        }

        let divMain = this.createTable(tblObj);

        this.mountContainerToParent(divMain);
    }

    createEligibleParentsList(harvestorNodes, nodeElement) {

        let selectedElement = nodeElement.elementId;
        let elementParentsList = [];        
        if (harvestorNodes && harvestorNodes.length) {
            for (let i in harvestorNodes) {
                let element = harvestorNodes[i].elementId;
                let elementParent = harvestorNodes[i].elementParent;
                elementParentsList.push({ 'element': element, 'elementParent': elementParent });
            }

            let childrenElemNamesList = [];
            childrenElemNamesList = this.getNestedChildrenNames(elementParentsList, selectedElement, childrenElemNamesList);
            let validParents = this.fetchValidParentsList(elementParentsList, childrenElemNamesList, selectedElement);

            return validParents;
        }
    }

    getAuthRootNodeDataBasedOnCategory(authScriptObject, nodeElement){
        if( nodeElement && nodeElement.category && nodeElement.category == "prepare" ){
            return authScriptObject.prepare.harvestorPrepareNode;
        };

        return authScriptObject.payload.harvestorPayloadNode;
    }

    getNestedChildrenNames(elementParentsList, parent, childrenElemNamesList) {
        for (let i in elementParentsList) {
            if (elementParentsList[i].elementParent == parent) {
                var children = this.getNestedChildrenNames(elementParentsList, elementParentsList[i].element, childrenElemNamesList)
                if (children.length) {
                    elementParentsList[i].children = children;
                }
                childrenElemNamesList.push(elementParentsList[i].element);
            }
        }
        return childrenElemNamesList;
    }

    
    fetchValidParentsList(elementParentsList, childrenElemNamesList, selectedElement) {
        // adding selected element to the children list so as to remove it from the valid Parents list
        childrenElemNamesList.push(selectedElement);
        let validParentObjElements = elementParentsList.filter(function (item) {
            return !childrenElemNamesList.includes(item.element);
        });

        // reducing the valid list of element parent object to only list of valid parent name
        let validParentElemNames = validParentObjElements.reduce(function (validParentElemNames, item) {
            validParentElemNames.push(item.element);
            return validParentElemNames;
        }, []);
        // adding root as valid parent
        validParentElemNames.push("root");
        return validParentElemNames;
    }

   
    toggleDisplayMessage(elementVal, errMessage) {

        if (!elementVal) {
            // show errorMessage	
            let message = errMessage;
            let style = "color: red; width: 100%;";
            document.getElementById('lblErrorMessage').setAttribute('style', style);
            document.getElementById('lblErrorMessage').innerText = message;
            this.isValidEditor = false;
            return false;

        } else {
            let style = "color: red; width: 100%; display: none;";
            document.getElementById('lblErrorMessage').setAttribute('style', style);
            this.isValidEditor = true;
            return true;
        }
    }   

}