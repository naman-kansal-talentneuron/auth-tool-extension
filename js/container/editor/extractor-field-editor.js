import Field from "../../extract/Field.js";
import BaseEditor from "./base-editor.js";
import TextBox from "../../component/text-box.js"
import DropDown from "../../component/drop-down.js";
import MetaData from "../../config/meta-data.js";
import TextArea from "../../component/text-area.js";
import Utils from '../../utils.js';
import StackUtil from "../../helper/stack-util.js";
import ExtractorExpParser from "../../preview/extractor-exp-parser.js";
import ExpressionProgressModal from "../../preview/expression-progress-modal.js"
import ShowErrDialog from '../../component/showError-dialog.js';
import APIRequestUtil from "../../helper/api-request-util.js";
export default class ExtractorFieldEditor extends BaseEditor {

    #components = {
        txtField: null,
        ddlMode: null,
        txtValue: null,
        txtPreview: null,
        trimmedPreviewTxt: null,
        showMoreloader: false
    }


    constructor(parentElement, field, authobj, onSaveCallback, onExportCallBack, togglePointAndClickClick, onSelectorChangeCallback, onValidateCallBack,navTreeUpdateCallBack, onTraverseCallBack, onDebugCallBack, onTransformCallBack) {
        
        super(parentElement,navTreeUpdateCallBack);
        this.field = field;
        this.onSaveCallback = onSaveCallback;
        this.onExportCallBack = onExportCallBack;
        this.onDebugCallBack = onDebugCallBack;
        this.onTraverseCallBack = onTraverseCallBack;
        this.onTransformCallBack = onTransformCallBack;
        this.parentElement = parentElement;
        this.onSelectorChangeCallback = onSelectorChangeCallback;
        this.togglePointAndClickClick = togglePointAndClickClick;
        this.pointAndClickActive = false;
        this.authObj = authobj;
        this.onValidateCallBack = onValidateCallBack;
		this.fieldParentNode = field.parent;                
        this.lstExtractorFiledNames = this.getListOfExtractorField(this.fieldParentNode);        
        field.parent = null; // Clear parent value to null
        this.undoStack = new StackUtil();
        this.populateEditor();
        this.toggleBtnPointAndClick();
        this.togglePointAndClickClick('Remove');
        this.onTxtSelectorChange();
        this.handleHeaderButtons();
        Utils.displayWarning(this.field.fieldValue.trim(),this.field.fieldMode);
        // Initiate Undo stack with original Value.
        this.undoStack.push(this.field);

        //Expression Validator
        this.ExpressionProgressModal = new ExpressionProgressModal(authobj, this.setPreviewForExpression.bind(this));
        this.apiRequestUtil = new APIRequestUtil();

    }


    populateEditor() {

        if (this.validateInputNodeElement()) {
            this.field = new Field('', '', '');
        }

        if(this.field.fieldName.charAt(0) === '$' && !this.getExtractorParentsExtractorFields().some(el => el.fieldName === this.field.fieldName.substring(1))) {
            this.doTransform = true;
        }
        this.createContainerDivs();
        this.createComponents();
        this.onChangeOfFormElements();

    }

    /**
     * Dynamically enable or disables the preview button based on selector type changes.
     */
    checkIfExpression() {
        this.isExpression = this.field.fieldMode == "expn"|| this.field.fieldMode == "expn.xpath";

        if(this.isExpression){
            document.getElementById("divExpValidate").style.display = "inline-block";
        } else {
            document.getElementById("divExpValidate").style.display = "none";
        }
       
        let content = this.field.fieldValue;
        if (content!=undefined && (content.length!=0 || content.replaceAll(' ','').length!=0) && (this.field.fieldMode == 'css' || this.field.fieldMode == 'xpath')){
            Utils.disableEnableButton(document.getElementById('btnSuggestXpath'), false);
        }
        else{
            Utils.disableEnableButton(document.getElementById('btnSuggestXpath'), true);
        }
    }

    validateInputNodeElement() {
        return this.field == null
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

    onUndoClick(){

        this.field = this.undoStack.pop();
        this.populateEditor();
        this.handleHeaderButtons();

        this.onSaveCallback(this.fieldParentNode, this.field.index, this.field);
    }

    onSaveClick() {

        if (!this.validateEditor()) {
            // event.preventDefault();
            return false;
        }

        this.showAutoSaved();

        this.field.fieldName = this.#components.txtField.val;
        //To lowercase
        if( this.field.fieldName.toLowerCase() === "__selector"){
            this.field.fieldName = this.#components.txtField.val.toLowerCase();     
            this.#components.txtField.setValue( this.field.fieldName);     
        }
        this.field.fieldMode = this.#components.ddlMode.selectedItem;
        this.field.fieldValue = (this.#components.txtValue.val) && this.#components.txtValue.val.replace(/\r?\n|\r/g, "");
        this.field["IsValidSelector"] = !this.isBroken;

        Utils.displayWarning(this.field.fieldValue.trim(),this.field.fieldMode);
        //Validate Field Name to check as per UH Extractor Schema
        this.ValidateFieldName();

        this.onSaveCallback( this.fieldParentNode, this.field.index, this.field);
        if( this.field.fieldName.toLowerCase() === "__selector"){
            this.field.index =0;
        }

        // For UNDO functionality.
        this.undoStack.push(this.field);
        this.handleHeaderButtons();

        this.hideAutosaved();
        this.checkIfExpression();

    }
    validateEditor(isTransform = false) {

        let extractorFields = this.getExtractorParentsExtractorFields();

        if( !extractorFields || extractorFields.length < 1){
            return true;
        }

        let fieldName = isTransform ? this.field.fieldName.substring(1) 
                                    : this.#components.txtField.val.toLowerCase();
        let errorFields = extractorFields.filter( item => (item.fieldName.toLowerCase() === fieldName) && 
                                (item.index != this.field.index ));
        
        if( errorFields && errorFields.length){
            this.#components.txtField.setValue( this.field.fieldName);
            this.showDialogMessage( "Already Extractor Field  '" + fieldName + "' Exists in Parent Node" , null);
            return false;
        };        
        
        return true;
    }

    getExtractorParentsExtractorFields(){

        let extractorFields = [];

        if (this.fieldParentNode.isgroup && this.fieldParentNode.fields && this.fieldParentNode.fields.length) {
            extractorFields = this.fieldParentNode.fields;
        } else if ( this.fieldParentNode.document 
                    && this.fieldParentNode.document.document
                    && this.fieldParentNode.document.document.documentDetails) {
            //create or update extractor to Harvestor parent .
            extractorFields = this.fieldParentNode.document.document.documentDetails;
        }

        return extractorFields;
    }

    //Validate the Field Name as per Extractor Scehma 
    ValidateFieldName(){

        this.field.isvalid = false;
        this.field.error = "";
        
        //Validate the Field is outside Extractor Group
        if( this.fieldParentNode.isgroup){
            let topLevelExtractorFields = MetaData.getListingExtractorTopLevelFields; 
            let validatorFields  = topLevelExtractorFields.filter( item => item.name === this.field.fieldName);
            if( validatorFields && validatorFields.length){
                this.field.isvalid = false;
                this.field.error = validatorFields[0].error;
            }
        }
    }

    onPointAndClick(event) {      
        let pointAndClick = this.pointAndClickActive ? "Remove" : "Add";
        if (this.togglePointAndClickClick) {
            this.togglePointAndClickClick(pointAndClick, event, this);
            this.pointAndClickActive = !this.pointAndClickActive;
            //document.getElementById('btnAnnotate').setAttribute('style', 'border: 1px solid blue');
        }
        this.toggleBtnPointAndClick();
    }


    toggleBtnPointAndClick() {
        let style = this.pointAndClickActive ? 'margin-right:20px; background-color: #DCEDFF; font-weight:700' : 'margin-right:20px;';
        let cursorStyle = this.pointAndClickActive ? 'cursor: grab; cursor: -webkit-grab;' : 'cursor: default';
        this.setAttributes(document.getElementById('btnAnnotate'), { 'style': style });
        document.querySelector('body').setAttribute('style', cursorStyle);
    }

    /**
     * When we use the point and click element, the content script sends an array of objects of size 3. This array of
     * objects contains the name of the message content (which is 'updateDataInUHDevTool'), the CSS class of the selected 
     * HTML element and the absolute XPATH of the selected HTML Element. This object is sent from getSetInspectionData
     * present in UH_DevTool_Function_Def.js module.
     * @param {any} selectedItem - Array of objects of size 3 like this [{content: '...'}, {content: '...'}, {content: '...'}]
     */
    setSelector(selectedItem) {    
        if (['css', 'css.innerhtml'].includes(this.#components.ddlMode.selectedItem)) {
            this.field.fieldValue = selectedItem[1].content;
        }

        const xpathElements = [...MetaData.XPATH_SELECTOR_FAMILY, 'xpath.innerhtml'];
        
        if (xpathElements.includes(this.#components.ddlMode.selectedItem)) {
            this.field.fieldValue = selectedItem[2].content;
        }

        this.pointAndClickActive = false;
        this.#components.txtValue.setValue(this.field.fieldValue);
        this.toggleBtnPointAndClick();
        this.onTxtSelectorChange();
    }

    onChangeOfFormElements() {

        var inputs = document.querySelectorAll('[id^=uh_editor_]');
        var i = 0;
        for (i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('change', this.onSaveClick.bind(this));
        }
    }

    setPreview(ele, cnt) {
        if (ele === "body" || ele === "//body") {
            ele = "The preview content can't be displayed as the selector is a 'body' which may have a huge content";
        }

        this.#components.txtPreview.setValue(ele);

        if (document.getElementById('txtPreview').value != undefined && this.#components.showMoreloader) {
            document.getElementById('divLoading').style.display = "none";
            this.#components.showMoreloader = false;
        }
        
        if (ele.endsWith("...Click on Show More button to view more")) {
            Utils.disableEnableButton(document.getElementById('btnShowMore'), false);
            Utils.disableEnableButton(document.getElementById('btnSuggestXpath'), false);
            this.#components.trimmedPreviewTxt = ele;
        } else {
            Utils.disableEnableButton(document.getElementById('btnShowMore'), true);
            // Utils.disableEnableButton(document.getElementById('btnSuggestXpath'), false);
        }       
        
        document.getElementById('lblSelectedItemCount').innerHTML = "(" + cnt + ")";
    }

    setPreviewForExpression(expResponse) {
        let prevMessage = expResponse.response[0] == "\"" ? expResponse.response.slice(1, -1) : expResponse.response;

        if (expResponse.iserror) {
            prevMessage = 'Error -' + expResponse.response;
        }

        this.#components.txtPreview.setValue(prevMessage);
        this.#components.trimmedPreviewTxt = prevMessage;
        this.showOrHideElementNotExists(!expResponse.iserror, 'No matching element to highlight in this page for given (Selector-Selector type)');
        
    }

    showOrHideElementNotExists(elementExists, message) {
        this.isBroken = !elementExists;
        let style = this.isBroken ? "color: red;" : "color: red;display: none;";
        document.getElementById('lblErrorMessage').setAttribute('style', style);
        document.getElementById('lblErrorMessage').innerText = message;
        if(this.isBroken)
        {
            Utils.disableEnableButton(document.getElementById('btnSuggestXpath'), true);
        }

    }

    annotationOnComplete(length) {
        this.showOrHideElementNotExists(length > 0, 'No matching element to highlight in this page for given (Selector-Selector type)');
        // this.showOrHideElementDetails(ele);        
    }

    validateExpression(selector) {

        try {

            if (selector.split("$[").length == 1) {
                return;
            }


            let _variable = Utils.getSubstring( selector, "$['", "']");

            let inValidFields = "";
            _variable.forEach(ele => {
                if (this.lstExtractorFiledNames.indexOf('$' + ele) < 0 && !this.isValidHParam(ele)) {
                    inValidFields =  inValidFields.concat(ele, ", ");
                    //this.showOrHideElementNotExists(false, ele + ' is not defined');
                }
            });

            if (inValidFields == "") {
                this.showOrHideElementNotExists(true, ' ');
            }

            if (inValidFields) {
                this.showOrHideElementNotExists(false, inValidFields + ' is not defined');
            }

            return inValidFields == "";

        } catch (e) {
            this.showOrHideElementNotExists(false, selector + ' is not a valid Expression');
            return;
        }


    }

    isValidHParam(ele) {

        let staticHparams = this.authObj['params'];

        let validHarvestorOutParams = Object.values(MetaData.getValidHarvestorOutParam);

        if (ele.indexOf("hparams") >= 0) {
            let hParamName = ele.substr(ele.indexOf('.') + 1);            

            // check if hparams.<something> is a valid static param
            if (hParamName && staticHparams && staticHparams[hParamName]) {

                return true;

            } else if (hParamName && validHarvestorOutParams.includes(hParamName)) {

                return true;

            }
            // check if hparam.<something> is a valid dynamic param present in prepare section 
            else if (hParamName && this.isDynamicParam(hParamName)) {
                return true;


            } // check if hparam@ is a valid dynamic param present in prepare section 

            else {
                return false;
            }


        }
        else {
            return false;
        }
        
    }

    isDynamicParam(harvestorParam) {

        // find that in auth object, the provided input - 'harvestorParam' is present in Param elemnent type which has persist is true       

        let dynamicParams = [];

        if(this.authObj.prepare && this.authObj.prepare.harvestorPrepareNode && this.authObj.prepare.harvestorPrepareNode.length > 0  ) {

            let prepareNodes = this.authObj.prepare.harvestorPrepareNode;

            for(let i=0; i < prepareNodes.length; i++) {

                if(prepareNodes[i].elementType == "ParamElement" && prepareNodes[i].elementPersist === true)  {

                    let elementValues = prepareNodes[i].elementValues;
                    if(elementValues && elementValues.length > 0) {
                        for(let j=0; j < elementValues.length; j++ ) {
                            dynamicParams.push(elementValues[j].key);
                        }
                    }
                }
            }
        }

        if (dynamicParams && dynamicParams.length > 0 && dynamicParams.includes(harvestorParam)) {

            return true;
        }

        else {
            return false;
        }
    }

    onTraverseClick(event){
        this.onTraverseCallBack(event.srcElement.innerHTML, this.fieldParentNode, this.field.index, "Extractor");
    }

    fetchAllExtractorFields( parentNode, currentNode){

        let fieldNames = [];

        let fieldGroups =  parentNode.fields.filter( field => field.isgroup);
        if( fieldGroups.length ){
            fieldGroups.forEach( groupsubfeilds => {
                fieldNames.push( ...this.fetchAllExtractorFields( groupsubfeilds, currentNode));
            });           
        }
        
        let currentFieldNames =  parentNode.fields.filter( field => !field.isgroup).map( mapFields =>{
            return mapFields.fieldName;
        });

        fieldNames.push( ...currentFieldNames);

        return fieldNames;
    }

    getListOfExtractorField(parentNode) {

        let arrFields = [];
        let documentType = null;
        //Parent as Harvestor
        if( parentNode.document != undefined && parentNode.document.document != undefined && !parentNode.isgroup){    
            documentType = parentNode.elementDocumentType;
        }else{           
            documentType = parentNode.documentType;
        }

         //Get all Extractor of all its above level Nested Parent Level.To retrive of its complete list of Extractor Fields of its and its parent level
         this.authObj.payload.harvestorPayloadNode.forEach( node =>{
            if( node.elementDocumentType && node.document && node.document.document && node.document.document.documentDetails){
                arrFields.push( ...this.fetchAllExtractorFields( { fields : node.document.document.documentDetails}, parentNode));
            }
        });
        
        return arrFields;
    }

    //Added xmlxpath to track mode selector change
    onTxtSelectorChange(event) {
        this.showOrHideElementNotExists(true);

        if (this.#components.ddlMode.selectedItem == "expn" || this.#components.ddlMode.selectedItem == "expn.xpath" || this.#components.ddlMode.selectedItem == "expn.css") {
            this.validateExpression(this.#components.txtValue.val);
            return;
        }
        
        let value = this.#components.txtValue.val;
        let mode = '';
        if (MetaData.XPATH_SELECTOR_FAMILY.includes(this.#components.ddlMode.selectedItem)) {
            mode = this.#components.ddlMode.selectedItem;
            if(value.includes("|")){
                 value = value.split('|').map((v)=> {
                            return this.getParentxPathSelectorValue() + v
                        }).join('|')
            } else{
                value = this.getParentxPathSelectorValue() + value;
            }      
            //Set Annotation xPath Value relative to __selector extractor value
        }
        else if (this.#components.ddlMode.selectedItem == 'css') {
            mode = 'css';
        } else if (this.#components.ddlMode.selectedItem == 'css.innerhtml') {
            mode = 'css.innerhtml';
        }
        else if (this.#components.ddlMode.selectedItem == 'xpath.innerhtml') {
            mode = 'xpath.innerhtml';
            //Set Annotation xPath Value relative to __selector extractor value
            value = this.getParentxPathSelectorValue() + value;
        }

        if (this.#components.ddlMode.selectedItem == 'css' || this.#components.ddlMode.selectedItem == 'xpath') {
            let disableSuggest = (value.length==0 || value.replaceAll(' ','').length==0) ? true : false;
            Utils.disableEnableButton(document.getElementById('btnSuggestXpath'), disableSuggest);
        }
        else{
            Utils.disableEnableButton(document.getElementById('btnSuggestXpath'), true);
        }
        
        this.#components.trimmedPreviewTxt = "";
        this.onSelectorChangeCallback( value, mode, false);

    }
    
    getParentxPathSelectorValue(){

        let xPathSelectorValue = "";

        if( this.field.index == 0){
            return xPathSelectorValue;
        }

        let extractorFields = this.getExtractorParentsExtractorFields();
        
        if( extractorFields && extractorFields.length){
            let selectorFields = extractorFields.filter( field => field.fieldName.toLowerCase() === "__selector" 
                            && ([...MetaData.XPATH_SELECTOR_FAMILY, "xpath.innerhtml"].includes(field.fieldMode)));
            if( selectorFields && selectorFields.length){
                xPathSelectorValue = selectorFields[0].fieldValue;
            }
        }

        return xPathSelectorValue;
    }

    onClickShowMorePreview() {
        document.getElementById('divLoading').style.display = "block";
        this.#components.showMoreloader = true;

        if (MetaData.isAnnotatableSelectorType(this.#components.ddlMode.selectedItem)) {
            let value = this.#components.txtValue.val;
            (this.#components.ddlMode.selectedItem.includes('xpath')) && (value = this.getParentxPathSelectorValue() + value)
            this.onSelectorChangeCallback(value, this.#components.ddlMode.selectedItem, false, true);
        }
    }

    onClickXPATHSuggestor()
    {    
        document.getElementById('divLoading').style.display = "block";
        
        //this.#components.showMoreloader = true;
        let value = this.#components.txtValue.val;
        (this.#components.ddlMode.selectedItem.includes('xpath')) && (value = this.getParentxPathSelectorValue() + value)
        this.onSelectorChangeCallback(value, this.#components.ddlMode.selectedItem, false, true,"listing_rows"); 
    }

    getHarvestorMatchedExtractorFields(child) {

        let extractorList = [];
        let expParams = [];
        let parser = new ExtractorExpParser(this.authObj);
        
        //Fetch the Node data only at node level by Ignoring remanining Harvestor Nodes
        this.authObj.payload.harvestorPayloadNode.forEach( node =>{
            if( node.elementDocumentType && node.document && node.document.document && node.document.document.documentDetails){ 

                //Lookp the Nodes to fetch the selected extractor node parent hierachy
                if( expParams == null || !expParams.variables || !expParams.variables.length){     
                    try{
                        expParams = parser.getExpressionVariables( JSON.parse(JSON.stringify( node.document.document.documentDetails)), child , extractorList);    
                        return false;
                    }
                    catch(e){
                        this.handleParserError(e);
                        return false
                    }
                }         
            }
        });

        return expParams;
    }

    handleParserError(error){
        
        let dialogRenderBodyCallback = () => {
            let errorContainer = document.createElement("div");
            let errorBlock = document.createElement("div");
            let errorTitle = document.createElement("div");
            errorBlock.innerHTML = error;
            errorTitle.innerHTML = "<div style='color:red; font-weight:bold; display:flex; justify-content: center; padding: 0 0 10px 0';> Expression Evaluation Failed </div>";
            errorContainer.appendChild(errorTitle);
            errorContainer.appendChild(errorBlock);
            return errorContainer;
        }

        let dialogBox = new ShowErrDialog({
            okButtonText: "",
            errorText: "",
            warningText: " ",
            renderHtmlCallBack : dialogRenderBodyCallback,
            registerButtonGroupObject : [{name:"Close", isAutoClose: true}]
        });
        dialogBox.confirm();
    }

    onClickExpValidate(){   

        let expValidatorNodes = this.getHarvestorMatchedExtractorFields(this.field);
         
        expValidatorNodes != null && expValidatorNodes != [] && this.ExpressionProgressModal.evaluate(expValidatorNodes);

    }

    onFocusOutTextArea() {
        this.#components.trimmedPreviewTxt != "" && this.#components.txtPreview.setValue(this.#components.trimmedPreviewTxt);
        let isShowMoreEnabled = this.#components.trimmedPreviewTxt.endsWith("...Click on Show More button to view more");
        Utils.disableEnableButton(document.getElementById('btnShowMore'), !isShowMoreEnabled);
        Utils.disableEnableButton(document.getElementById('btnSuggestXpath'), !isShowMoreEnabled);
    }

    createComponents() {
        const lblStyle = "width: 25px;  font-weight: 550";
        const lblStyleSmall = "width: 45px;  font-weight: 550";
        const btnStyle = "margin-right:20px";
        const lblErrorMessage = "color: red; display:none";
        const lblWarnMessage = "color: orange; display: none";

        const imageStyle = "top: 200px;left: 240px;z-index: 100; box-shadow:0 0 0 0";

        this.createLabel('divLblFieldName', { style: lblStyleSmall, id: 'lblFieldName' }, 'Name *');
        
        this.#components.txtField = new TextBox('divEleFieldName', 'uh_editor_txtFeildName', null, this.field.fieldName ? this.field.fieldName : "", "",
            this.onNodeIDChange.bind(this), null);
        this.createLabel('divLblMode', { style: lblStyleSmall, id: 'lblMode' }, 'Mode *');
        this.#components.ddlMode = new DropDown('divEleMode', 'uh_editor_ddlFieldMode', MetaData.getExtractorModes, this.field.fieldMode, this.onTxtSelectorChange.bind(this), null, null, true);

        this.createLabel('divLblSelector', { style: lblStyleSmall, id: 'lblSelector' }, 'Value *');
        this.#components.txtValue = new TextArea('divEleSelector', 'uh_editor_txtSelector', 'toolinput', this.field.fieldValue ? this.field.fieldValue : '', '', 5, 100, null, null, null, this.onTxtSelectorChange.bind(this), null, true);

        this.createButton('divIconSelector', { style: btnStyle, id: 'btnAnnotate' }, 'X', { "click": this.onPointAndClick.bind(this) });
        // this.createButton('divIconSave', {style: btnStyle, id:'btnSave'},'Save', {"click": this.onSaveClick.bind(this)});
        this.createButton('divIconSave', { style: btnStyle, id: 'btnExport' }, 'Export', { "click": this.onExportClick.bind(this) });
        this.createButton('divIconValidate', { style: btnStyle, id: 'btnValidate' }, 'Validate', { "click": this.onValidateClick.bind(this) });
        this.createLabel('divSeparator', { style: lblStyle, id: 'lblSeparator' }, '|');

        this.createButton('divMoveUp', { style: btnStyle, id: 'btnUp' }, 'Up',  { "click": this.onTraverseClick.bind(this) });
        this.createButton('divMoveDown', { style: btnStyle, id: 'btnDown' }, 'Down',  { "click": this.onTraverseClick.bind(this) });
        this.createLabel('divLblErrorMessage', { style: lblErrorMessage, id: 'lblErrorMessage' }, '')
        this.createLabel('divLblWarnMessage', {style: lblWarnMessage, id: 'lblWarnMessage' },'')
        this.createButton('divUndo', { style: btnStyle, id: 'btnUndo' }, 'Undo',  { "click": this.onUndoClick.bind(this) });
        this.createLabel('divLblPreview', { style: lblStyleSmall, id: 'lblSelector' }, 'Preview');
        
        this.#components.txtPreview = new TextArea('divElePreview', 'txtPreview', 'toolinput', '', '', '5', '100', null, this.onFocusOutTextArea.bind(this), null, null, '');
        this.createButton('divDebug', {style: btnStyle, id:'btnDebug'},'Debug', {"click": this.onDebugClick.bind(this)});

        this.createLabel('divLblCount', { style: lblStyleSmall, id: 'lblSelectedItemCount' }, '(0)');
         
        this.createButton('divIconShowMore', { style: btnStyle, id: 'btnShowMore', disabled: "disabled" }, 'Show More', { "click": this.onClickShowMorePreview.bind(this) });
        this.createButton('divIconShowMore', { style: btnStyle, id: 'btnSuggestXpath' }, 'Suggest', { "click": this.onClickXPATHSuggestor.bind(this) });
        this.createButton('divExpValidate', { style: btnStyle, id: 'btnValidateExp' }, 'Preview', { "click": this.onClickExpValidate.bind(this) });
        this.checkIfExpression();
        this.createImage("divLoading", "loading-image", imageStyle, "../../js/container/editor/loader.gif", "Loading..");

        if(this.doTransform) this.createButton('divTransform', { style: "", id: 'btnTransform' }, 'Transform', { "click": this.onTransformClick.bind(this) });
    }

    /**
     * @description :: Invokes the call back to create a new transformed node.
     * @params : parent, target index, new node name.
     */
     onTransformClick() {
        if(this.validateEditor(true)) {
            this.onTransformCallBack(this.fieldParentNode, this.field.index + 1, this.field.fieldName.substring(1));
        }
    }

    handleHeaderButtons(){

        let upButton = document.getElementById("btnUp");
        let downButton = document.getElementById("btnDown");
        let undoButton = document.getElementById("btnUndo");
        let xpathButton = document.getElementById("btnSuggestXpath");

        let isUndoStackEmpty = this.undoStack.length() == 0;
        Utils.disableEnableButton(undoButton, isUndoStackEmpty);

        let isFirstNode = true;
        let isLastNode = true;

        if(this.field.index <= (this.getExtractorParentsExtractorFields().length -1)){
            if (this.fieldParentNode.isgroup) {
                if (this.fieldParentNode.fields[0].fieldName === '__selector' && this.field.fieldName === '__selector'){
                    // Traverse buttons will be disabled.
                    Utils.hideShowButton(xpathButton,true);
                } else {
                    isFirstNode = this.fieldParentNode.fields[0].fieldName === '__selector' ? this.field.index == 1 : this.field.index == 0;
                    isLastNode = this.field.index == this.fieldParentNode.fields.length - 1;
                    Utils.hideShowButton(xpathButton,false);
                }
            } else if (this.fieldParentNode.document != null && this.fieldParentNode.document.document != null) {
                if (this.fieldParentNode.document.document.documentDetails[0].fieldName === '__selector' && this.field.fieldName === '__selector'){
                    // Traverse buttons will be disabled.
                    Utils.hideShowButton(xpathButton,true);
                } else {
                    isFirstNode = this.fieldParentNode.document.document.documentDetails[0].fieldName === '__selector' ? this.field.index == 1 : this.field.index == 0;
                    isLastNode  = this.field.index == this.fieldParentNode.document.document.documentDetails.length - 1
                    Utils.hideShowButton(xpathButton,false);
                }
            }
        }

        Utils.disableEnableButton(upButton, isFirstNode);
        Utils.disableEnableButton(downButton, isLastNode);
        
        // if (this.fieldParentNode.fields != undefined && this.fieldParentNode.fields[0].fieldName === '__selector' && this.field.fieldName === '__selector'){
        //     Utils.hideShowButton(xpathButton,true);
        // } 
        // else{
        //     Utils.hideShowButton(xpathButton,false);

        // }      
    
    }


    createContainerDivs() {
        const tblStyle = "height:100%";
        const divLabelStyle = "display:inline; width: 155px; text-align:left; padding-top:2px; padding-left:15px;"
        const divElementStyle = "display:inline; width: 220px;  text-align:left; padding-top:2px; padding-left:15px"
        const divOptionContainerStyle = "display:inline, width:100%, padding-left:15px"
        const rowStyle = "margin-top: 12px";
        const firstRow = "margin-top: 28px";
        const colStyle = "display:inline; width: 25%; min-width: 350px; margin-left: 25px";
        const colStyle2X = "display:inline; width: 25%; min-width: 350px; margin-left: 0px";
        const colOptionsStyle = "width: 100%; ";
        const divErrorMessageStyle = "display:inline; width: 100%; text-align:left; padding-top:2px; padding-left:15px;"
        const divLblCountStyle = "display:inline; width: 155px; text-align:left; padding-top:2px; padding-left:5px;color:#337ab7"
        const classSeparator = "display: inline-block; font-size: 25px;";

        const classRow = "margin-top:20px";
        const classCol = "display: inline-block;";
        const classColEle = "display: inline-block;margin-left: auto;";
        const pointAndClick = "display: inline-block;margin-left: 25px;"

        const showMoreButtonStyle = "display:inline-block;margin-left: 20px;margin-top: 0px; padding-top: 10px padding-top:2px; padding-left:65px;";
        const divImageStyle = "width: 100%;  height: 100%;  top: 0;  left: 0;  position: fixed;  display: none;  opacity: 0.7;  background-color: #fff;  z-index: 99;  text-align: center;";
        const editorHeader = ";border-bottom: 2px solid rgb(0 0 0 / 25%); padding-bottom:15px;width:90%";
        /*
        let tblObj = {
            attr : {style : tblStyle} ,
            id : "tblEditorMain",
            rows: [
                {
                    attr: {style: firstRow},
                    col : [
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblFieldName"} }, {attr: { style: divElementStyle, id: "divEleFieldName"}}] },
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblMode"} }, {attr: { style: divElementStyle, id: "divEleMode"}}]},
                         { attr: {style: colStyle} , divs: [{ attr: {style: divLabelStyle, id: "divLblSelector"}}, {attr:  { style: divElementStyle, id: "divEleSelector"}}]},
                         { attr: {style: colStyle2X} , divs: [{ attr: {style: divLabelStyle, id: "divIconSelector"}}, {attr:  { style: divElementStyle, id: "divIconSave"}}]}
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
            attr: { style: tblStyle },
            id: "tblEditorMain",
            rows: [
                {
                    attr: { style: classRow  + editorHeader},
                    col: [

                        { attr: { style: colStyle2X }, divs: [{ attr: { style: pointAndClick, id: "divIconSelector" } }, { attr: { style: classColEle, id: "divIconSave" } },                        
                        { attr: { style: classColEle, id: "divIconValidate" } },{ attr: { style: classColEle, id: "divDebug" } },
                        { attr: { style: classSeparator, id: "divSeparator" } },
                        { attr: { style: classColEle, id: "divMoveUp" } },
                        { attr: { style: classColEle, id: "divMoveDown" } },
                        { attr: { style: classColEle, id: "divUndo" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblErrorMessage" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblWarnMessage" } }] }
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblFieldName" } }, 
                        { attr: { style: classColEle, id: "divEleFieldName" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblMode" } }, 
                        { attr: { style: classColEle, id: "divEleMode" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divTransform" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classColEle, id: "divExpValidate" } }] }
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblSelector" } }, { attr: { style: classColEle, id: "divEleSelector" } }] }
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                        {
                            attr: { style: colStyle }, divs: [                                 
                                { attr: { style: classCol, id: "divLblPreview" } }, 
                                { attr: { style: classColEle, id: "divElePreview" } },
                                { attr: { style: divLblCountStyle, id: "divLblCount" } }
                            ]
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
}