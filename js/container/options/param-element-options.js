import ElementOptionsBase from "./element-options-base.js";
import ParamElement from "../../element/ParamElement.js";
import DropDown from "../../component/drop-down.js";
import MetaData from "../../config/meta-data.js";
import KeyValueList from "../../component/keyvalue-list.js";
import Utils from "../../utils.js";

export default class ParamElementOptions extends ElementOptionsBase {
    
    #components = {
        ddlMultiple : null,
        ddlFetchType : null,
        ddlDocumentType : null
    };

    constructor(nodeElement,parentElement,onSaveCallback) {
        super(parentElement);        
        this.showOrHideOptinalFields(false);
        this.previousNodeElement = nodeElement;
        this.onSaveCallback = onSaveCallback;
        this.nodeElement = new ParamElement(nodeElement.elementId, 'ParamElement', nodeElement.elementSelector, nodeElement.elementSelectorType, 
                    nodeElement.elementParent, nodeElement.elementPersist, nodeElement.elementOptions,nodeElement.elementDocumentType,
                      nodeElement.document, nodeElement.elementCRCFields, nodeElement.elementValues);        
        
        this.renderOptions();
    }

     

    renderOptions() {
        this.createContainerDiv(); 
        this.createComponents();    
    }

    onSaveChanges() {
        //update changes of Dynamic element values
        this.nodeElement.elementDocumentType = this.#components.ddlDocumentType.selectedItem == undefined ? undefined : this.#components.ddlDocumentType.selectedItem;
        this.nodeElement.elementPersist = this.#components.ddlDocumentType.selectedItem == undefined ? undefined : true;        
        this.nodeElement.elementValues = this.#components.lstKeyValue.getOptions();
        let options = {
            ...(this.#components.filterEnabled.selectedItem != undefined) &&
                    { filterEnabled: this.nodeElement.elementOptions && this.#components.filterEnabled.selectedItem == undefined ? undefined: (this.#components.filterEnabled.selectedItem == "true")}
        }
        this.nodeElement.elementOptions = (Object.keys(options).length > 0) ? options : undefined; 
        return this.nodeElement;
    }

    createComponents() {
        const lblStyle = "width: 85px;  font-weight: 550";        
        const lblStyleSmallParent = "width: 85px;  font-weight: 550";

        this.createLabel('divLblDocumentType', {style:lblStyle, id : 'lblDocumentType'}, 'Document Type');
        this.#components.ddlDocumentType = new DropDown('divEleDocumentType', 'uh_editor_ddlDocumentType', MetaData.getPrepareDocumentTypes ,this.nodeElement.elementDocumentType);  
        // Filter enabled
        this.createLabel('divLblFilterEnabled', { style: lblStyle, id: 'lblFilterEnabled'}, 'Filter Enabled');
        this.#components.filterEnabled = new DropDown('divEleFilterEnabled', 'uh_editor_filterEnabled', MetaData.getBoolean, this.nodeElement.elementOptions && this.nodeElement.elementOptions.filterEnabled != undefined ? Utils.convertBooleanToString(this.nodeElement.elementOptions.filterEnabled): undefined);       

        this.createLabel('divLblKeyValue', {style: lblStyleSmallParent, id: 'lblKeyValue'}, 'Key Value');
        this.#components.lstKeyValue = new KeyValueList('divEleKeyValue','param_keyValue', '',this.nodeElement.elementValues,this.onSaveCallback.bind(this));

    } 


    createContainerDiv() {
        const tblStyle = "height:100%";
        const divLabelStyle = "display:inline; width: 155px; text-align:left; padding-top:2px; padding-left:15px;"
        const divElementStyle = "display:inline; width: 220px;  text-align:left; padding-top:2px; padding-left:15px"
        const rowStyle = "margin-top: 12px";
        const colStyle = "display:inline; width: 25%; min-width: 350px; margin-left: 25px";        
        const colOptionsStyle = "width: 100%;";
        const classKeyValueList = "display: inline-block;margin-left: 25px;"
        const classRow="margin-top:20px";
        const classChildRow = "margin-top:5px";
        const classCol="display: inline-block;";
        const classDocTypeCol="display: inline-block;margin-left: 500px;";
        const classColEle="display: inline-block;margin-left: auto;";

        let tblObj = {
            attr : {style : tblStyle} ,
            id : "tblEditorSub",
            rows: [
                {
                    attr: {style: classRow},
                    col : [
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblDocumentType"} }, {attr: { style: classColEle, id: "divEleDocumentType"}}]},
                    ]
                },
                {
                    attr: {style: classRow},
                    col : [                         
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblFilterEnabled"} }, {attr: { style: classColEle, id: "divEleFilterEnabled"}}]},
                        ]
                },
                {
                    attr: {style: classRow},
                    col : [
                        {attr: { style: classCol }, divs: [{ attr: { style: classKeyValueList, id: "divLblKeyValue" } }]}, 
                         
                    ]
                },
                {
                    attr: { style: classChildRow },
                    col: [
                        {
                            attr: { style: classChildRow }, divs: [{ attr: { style: classKeyValueList, id: "divEleKeyValue" } }]
                        }
                    ]
                }
            ]
            }
            let divSub = this.createTable(tblObj);

            this.mountContainerToParent(divSub);
   
    }
}