import ElementOptionsBase from "./element-options-base.js";
import DownloadPdfElement from "../../element/DownloadPdfElement.js";
import OnComplete from '../../harvest/OnComplete.js';
import DropDown from "../../component/drop-down.js";
import TextBox from '../../component/text-box.js';
import KeyValueList from "../../component/keyvalue-list.js";
import MetaData from "../../config/meta-data.js";
import Utils from "../../utils.js";

export default class DownloadPdfElementOptions extends ElementOptionsBase {
    
    #components = {
        ddlMultiple : null,
        ddlFetchType : null,
        ddlDocumentType : null,
        optOnComplete : null
    };

    constructor(nodeElement,parentElement, onSaveCallback) {
        super(parentElement);
        this.onSaveCallback = onSaveCallback;
        this.previousNodeElement = nodeElement;
        this.nodeElement = new DownloadPdfElement(nodeElement.elementId, 'DownloadPdfElement', nodeElement.elementSelector, nodeElement.elementSelectorType, 
                    nodeElement.elementParent, nodeElement.elementPersist, nodeElement.elementOptions,nodeElement.elementDocumentType,
                     nodeElement.elementMultiple,nodeElement.elementMaxIteration,nodeElement.elementFetchType, nodeElement.document, 
                     nodeElement.elementCRCFields, nodeElement.elementOnComplete, nodeElement.elementPersistWithData);        
        this.nodeElement.setCategory(nodeElement.category);

        if(this.nodeElement.elementOptions){
            (typeof this.nodeElement.elementOptions == "string") && (this.nodeElement.elementOptions = JSON.parse(this.nodeElement.elementOptions));
        }
        
        this.renderOptions();
    }

     

    renderOptions() {
        this.createContainerDiv(); 
        this.createComponents();    
    }

    onSaveChanges() {

        this.nodeElement.category === "payload" && (this.nodeElement.elementPersistWithData = Utils.getEmptyCheckAndReturn(this.#components.persistWithData.getOptionsAsObject()));

        //update changes of Dynamic element values
        this.nodeElement.elementFetchType = this.#components.ddlFetchType.selectedItem == undefined? undefined : (this.#components.ddlFetchType.selectedItem) ;
        this.nodeElement.elementMultiple = this.#components.ddlMultiple.selectedItem == undefined? undefined : (this.#components.ddlMultiple.selectedItem == "true");  
        //Set Max Iteration  only if Multiple is set
        this.nodeElement.elementMaxIteration = this.nodeElement.elementMultiple && this.#components.txtMaxIteration.val != "" ? parseInt(this.#components.txtMaxIteration.val) : undefined;
        
        this.nodeElement.elementDocumentType = this.#components.ddlDocumentType.selectedItem == undefined ? undefined : this.#components.ddlDocumentType.selectedItem;
        this.nodeElement.elementPersist = this.#components.ddlDocumentType.selectedItem == undefined ? undefined : true;

        let onCompleteObj = new OnComplete(this.#components.optOnComplete.selectedItem == undefined ? undefined : (this.#components.optOnComplete.selectedItem == "true"));
        this.nodeElement.addOnComplete(onCompleteObj);

        let options = {};
        options = {
            ...(this.#components.txtWaitUntil.selectedItem != undefined) && 
                    { waitUntil: this.#components.txtWaitUntil.selectedItem.length == 0 ? undefined : this.#components.txtWaitUntil.selectedItem},
            ...(this.#components.txtDelay.val != "") && { delay: parseInt(this.#components.txtDelay.val) },
            ...(this.#components.txtTimeout.val != "") && { timeout: parseInt(this.#components.txtTimeout.val) },
            ...(this.#components.filterEnabled.selectedItem != undefined) &&
                    { filterEnabled: this.nodeElement.elementOptions && this.#components.filterEnabled.selectedItem == undefined ? undefined: (this.#components.filterEnabled.selectedItem == "true")}
        };
        if(this.nodeElement.category ==="payload"){
            options = {...options,
                ...(this.#components.ddlPersistFileFormat.selectedItem != undefined) && 
                    { persistFileFormat: this.nodeElement.elementOptions && this.#components.ddlPersistFileFormat.selectedItem == undefined ? undefined : (this.#components.ddlPersistFileFormat.selectedItem) },
                ...(this.#components.ddlPersistSystemFormat.selectedItem != undefined) && 
                    { persistSystemFormat: this.nodeElement.elementOptions && this.#components.ddlPersistSystemFormat.selectedItem == undefined ? undefined : (this.#components.ddlPersistSystemFormat.selectedItem == "true") },
            }
        }

        this.nodeElement.elementOptions = (Object.keys(options).length > 0) ? options : undefined;         
        return this.nodeElement;
    }

    onMultipleOptionChange(event, ddlData){

        let showMaxIteration = false;
        if( ddlData && ddlData.selectedItem && ddlData.selectedItem.toLowerCase() === 'true'){
            showMaxIteration = true;
        }

        this.#components.lblMaxIteration.style.display= showMaxIteration? "block":"none";
        this.#components.txtMaxIteration.enableControl( showMaxIteration);
        
        if( !showMaxIteration){
            this.#components.txtMaxIteration.setValue( "");
        }
    }

    /* 
        Handling the dynamic change of document to disable and enable the Persist File Format
        and Persist System Format options
    */
    onDocumentTypeChange(event, documentTypeData){
        if(this.nodeElement.category == "payload"){
        let showPersist = false;
        if(documentTypeData && documentTypeData.selectedItem && documentTypeData !== undefined){
            showPersist = true;
        }
        this.#components.lblPersistFileFormat.style.display = showPersist ? "inline-block":"none";
        this.#components.ddlPersistFileFormat.enableControl( showPersist);
        this.#components.lblPersistSystemFormat.style.display = showPersist ? "inline-block":"none";
        this.#components.ddlPersistSystemFormat.enableControl( showPersist);

        if(!showPersist){
            this.#components.ddlPersistFileFormat.selectedItem = undefined;
            this.#components.ddlPersistSystemFormat.selectedItem = undefined;
        }
        }
    }

    createComponents() {
        const lblStyle = "width: 85px;  font-weight: 550";      
        const lblStyleNoWidth = "font-weight: 550";  
        this.createLabel('divLblFetchtype', {style:lblStyle, id: 'lblFetchType' }, 'Fetch Type');
        this.#components.ddlFetchType = new DropDown('divEleFetchType', 'uh_editor_ddlFetchType', MetaData.getFetchTypes, this.nodeElement.elementFetchType);
        
        this.createLabel('divLblMultiple', {style:lblStyle, id : 'lblMultiple'}, 'Multiple');                            
        this.#components.ddlMultiple = new DropDown('divEleMultiple', 'uh_editor_ddlMultiple', MetaData.getBoolean, Utils.convertBooleanToString(this.nodeElement.elementMultiple), this.onMultipleOptionChange.bind(this));                                          

        let isMultipleOptionSet = false;        
        if( this.nodeElement.elementMultiple && this.nodeElement.elementMultiple == true){
            isMultipleOptionSet = true;
        }
        this.#components.lblMaxIteration = this.createLabel('divLblMaxIteration', {style:lblStyle + (isMultipleOptionSet? "" : " ;display : none" ) ,id: 'lblMaxIteration'}, 'Max Iteration');
        this.#components.txtMaxIteration = new TextBox('divEleMaxIteration', 'uh_editor_txtMaxIteration', '', this.nodeElement.elementMaxIteration? this.nodeElement.elementMaxIteration : '' ,'',null,null,null,null,'number');
        this.#components.txtMaxIteration.enableControl( isMultipleOptionSet);

        this.createLabel('divLblDocumentType', {style:lblStyle, id : 'lblDocumentType'}, 'Document Type');
        this.#components.ddlDocumentType = new DropDown('divEleDocumentType', 'uh_editor_ddlDocumentType', this.nodeElement.category == 'prepare'? MetaData.getPrepareDocumentType : MetaData.getDocumentTypes ,this.nodeElement.elementDocumentType, this.onDocumentTypeChange.bind(this));         
        
        this.createLabel('divLblWaitUntil', {style:lblStyle, id: 'lblWaitUntil' }, 'Options    (Wait Until)');
        this.#components.txtWaitUntil = new DropDown('divEleWaitUntil', 'uh_editor_txtWaitUntil',MetaData.getOptionsWaitUntil,
                this.nodeElement.elementOptions && this.nodeElement.elementOptions.waitUntil ? this.nodeElement.elementOptions.waitUntil: '', '',null,null,null,true);
        
        this.createLabel('divLblDelay', {style:lblStyle,id: 'lblDelay'}, 'Options (Delay)');
        this.#components.txtDelay = new TextBox('divEleDelay', 'uh_editor_txtDelay', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.delay? this.nodeElement.elementOptions.delay : '' ,'',null,null,null,null,'number');

        this.createLabel('divLblTimeout', {style:lblStyle,id: 'lblTimeout'}, 'Options (Timeout)');
        this.#components.txtTimeout = new TextBox('divEleTimeout', 'uh_editor_txtTimeout', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.timeout? this.nodeElement.elementOptions.timeout : '' ,'',null,null,null,null,'number');
               
        let selectedGoBackOption = (this.nodeElement.elementOnComplete && (this.nodeElement.elementOnComplete.goBack != undefined)) ? this.nodeElement.elementOnComplete.goBack : '';
        this.createLabel('divLblComplete', {style:lblStyle, id : 'lblComplete'}, 'On Complete (goBack)');                            
        this.#components.optOnComplete = new DropDown('divEleOnComplete', 'uh_editor_ddlComplete', MetaData.getBoolean, Utils.convertBooleanToString(selectedGoBackOption));

        // Filter enabled
        this.createLabel('divLblFilterEnabled', { style: lblStyle, id: 'lblFilterEnabled'}, 'Filter Enabled');
        this.#components.filterEnabled = new DropDown('divEleFilterEnabled', 'uh_editor_filterEnabled', MetaData.getBoolean, this.nodeElement.elementOptions && this.nodeElement.elementOptions.filterEnabled != undefined ? Utils.convertBooleanToString(this.nodeElement.elementOptions.filterEnabled): undefined);
        
        /*
            Adding the Persist File Format and Persist System Format options only for payload based on selected Document type
        */
        if(this.nodeElement.category === "payload"){
            let isDocumentTypeSet = false;
            if(this.nodeElement.elementPersist){
                isDocumentTypeSet = true;
            }
            this.#components.lblPersistFileFormat = this.createLabel('divLblPersistFileFormat', {style: lblStyle + (isDocumentTypeSet? "": ";display : none"), id: 'lblPersistFileFormat'}, 'Persist File Format');
            this.#components.ddlPersistFileFormat = new DropDown('divElePersistFileFormat', 'uh_editor_ddlPersistFileFormat', MetaData.getFileFormat, this.nodeElement.elementOptions && this.nodeElement.elementOptions.persistFileFormat ? this.nodeElement.elementOptions.persistFileFormat: undefined);
            this.#components.ddlPersistFileFormat.enableControl(isDocumentTypeSet);

            this.#components.lblPersistSystemFormat = this.createLabel('divLblPersistSystemFormat', {style: lblStyle + (isDocumentTypeSet? "": ";display : none"), id: 'lblPersistSystemFormat'}, 'Persist System Format');
            this.#components.ddlPersistSystemFormat = new DropDown('divElePersistSystemFormat', 'uh_editor_ddlPersistSystemFormat', MetaData.getBoolean,this.nodeElement.elementOptions && this.nodeElement.elementOptions.persistSystemFormat != undefined ? Utils.convertBooleanToString(this.nodeElement.elementOptions.persistSystemFormat): undefined);
            this.#components.ddlPersistSystemFormat.enableControl(isDocumentTypeSet);

            this.createLabel('divLblCustomParameter', {style: lblStyleNoWidth, id: 'lblCustomParameter'}, 'Persist with data');
            this.#components.persistWithData = new KeyValueList('divKeyValuePersistData','keyValuePersistData', '', Utils.getKeyValues(this.nodeElement, 'elementPersistWithData'), this.onSaveCallback.bind(this));
        }
    }


    createContainerDiv() {
        const tblStyle = "height:100%";
        const colStyle = "display:inline; width: 25%; min-width: 350px; margin-left: 25px";        
        const classRowWithCheck = "margin-top:20px" + (this.nodeElement.category === "payload" ? "" : "; display: none")
        const rowWithCheck = (this.nodeElement.category === "payload" ? "" : "; display: none")

        const classRow="margin-top:20px";
        const classCol="display: inline-block;";
        const classColEle="display: inline-block;margin-left: auto;";

        let tblObj = {
            attr : {style : tblStyle} ,
            id : "tblEditorSub",
            rows: [
                {
                    attr: {style: classRow},
                    col : [                         
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblDocumentType"} }, {attr: { style: classColEle, id: "divEleDocumentType"}}]},
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblMultiple"} }, {attr: { style: classColEle, id: "divEleMultiple"}}] } ,                        
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblMaxIteration"} }, {attr: { style: classColEle, id: "divEleMaxIteration"}}] }
                        ]
                },
                {
                    attr: {style: classRow},
                    col : [                         
                          { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblFetchtype"} }, {attr: { style: classColEle, id: "divEleFetchType"}}]}
                        ]
                },
                {
                    attr: {style: classRow},
                    col : [
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblWaitUntil"} }, {attr: { style: classColEle, id: "divEleWaitUntil"}}]},
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblDelay"} }, {attr: { style: classColEle, id: "divEleDelay"}}]},
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblTimeout"} }, {attr: { style: classColEle, id: "divEleTimeout"}}]}
                    ]
                },
                {
                    attr: {style: classRow},
                    col : [                         
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblComplete"} }, {attr: { style: classColEle, id: "divEleOnComplete"}}] },
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblPersistFileFormat"} }, {attr: { style: classColEle, id: "divElePersistFileFormat"}}]},
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblPersistSystemFormat"} }, {attr: { style: classColEle, id: "divElePersistSystemFormat"}}] }                         
                    ]
                },
                {
                    attr: {style: classRow},
                    col : [                         
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblFilterEnabled"} }, {attr: { style: classColEle, id: "divEleFilterEnabled"}}]},
                        ]
                },
                {
                    attr: {style: classRowWithCheck},
                    col : [                         
                          { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblCustomParameter"} }]}
                        ]
                },
                {
                    attr: {style: rowWithCheck},
                    col : [                         
                          { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divKeyValuePersistData"} }]}
                        ]
                }
            ]
            }
            let divSub = this.createTable(tblObj);

            this.mountContainerToParent(divSub);
   
    }
}