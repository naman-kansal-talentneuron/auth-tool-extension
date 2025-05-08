import TextBox from "../../component/text-box.js";
import DropDown from "../../component/drop-down.js";
import InputTextElement from "../../element/input-text-element.js";
import ElementOptionsBase from "./element-options-base.js";
import MetaData from "../../config/meta-data.js";
import Utils from "../../utils.js";

export default class InputtextElementOptions extends ElementOptionsBase {
    #components = {
        txtText : null
    }

    constructor(nodeElement, parentElement) {
        super(parentElement);
        this.previousNodeElement = nodeElement;
        this.nodeElement = new InputTextElement(nodeElement.elementId, 'InputTextElement', nodeElement.elementSelector,
            nodeElement.elementSelectorType, nodeElement.elementParent, nodeElement.elementPersist, nodeElement.elementOptions,
            undefined, nodeElement.elementText, nodeElement.document,nodeElement.elementCRCFields); 

        if(this.nodeElement.elementOptions){
            (typeof this.nodeElement.elementOptions == "string") && (this.nodeElement.elementOptions = JSON.parse(this.nodeElement.elementOptions));
        }
            
        this.renderOptions();
    }

    renderOptions() {        
        this.createContainerDiv();
        this.createComponents();        
    }

    onSaveChanges(nodeElement) {
        this.nodeElement.elementText = (this.#components.txtText.val != '') ? this.#components.txtText.val : undefined;
        let options = {
            ...(this.#components.txtWaitUntil.selectedItem != undefined) && 
                    { waitUntil: this.#components.txtWaitUntil.selectedItem.length == 0 ? undefined : this.#components.txtWaitUntil.selectedItem},
            ...(this.#components.txtDelay.val != "") && { delay: parseInt(this.#components.txtDelay.val) },
            ...(this.#components.txtTimeout.val != "") && { timeout: parseInt(this.#components.txtTimeout.val) },
            ...(this.#components.filterEnabled.selectedItem != undefined) &&
                    { filterEnabled: this.nodeElement.elementOptions && this.#components.filterEnabled.selectedItem == undefined ? undefined: (this.#components.filterEnabled.selectedItem == "true")}
        };
        this.nodeElement.elementOptions = (Object.keys(options).length > 0) ? options : undefined; 
        return this.nodeElement;

    }
    createComponents() {
        const lblStyle = "width: 85px;  font-weight: 550";
        const lblStyleText = "width: 25px;  font-weight: 550";
        const lblReq = "width: 5px;  font-weight: 550 ; color:red";
        const lblErrorMessageReq = "color: red; display:none";        
        this.createLabel('divLblText', {style:lblStyleText, id: 'lblText' }, 'Text');
        this.createLabel('divLblText', { style: lblReq, id: 'lblTextRequired' }, '*');
        this.createLabel('divLblErrorMessageReq', { style: lblErrorMessageReq, id: 'lblErrorMessageReq' }, '');
        this.#components.txtText = new TextBox('divEleText', 'uh_editor_txtText','', this.nodeElement.elementText? this.nodeElement.elementText :'' ,'')
        

        this.createLabel('divLblWaitUntil', {style:lblStyle, id: 'lblWaitUntil' }, 'Options    (Wait Until)');
        this.#components.txtWaitUntil = new DropDown('divEleWaitUntil', 'uh_editor_txtWaitUntil',MetaData.getOptionsWaitUntil,
                this.nodeElement.elementOptions && this.nodeElement.elementOptions.waitUntil ? this.nodeElement.elementOptions.waitUntil: '', '',null,null,null,true);
        
        this.createLabel('divLblDelay', {style:lblStyle,id: 'lblDelay'}, 'Options (Delay)');
        this.#components.txtDelay = new TextBox('divEleDelay', 'uh_editor_txtDelay', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.delay? this.nodeElement.elementOptions.delay : '' ,'',null,null,null,null,'number');

        this.createLabel('divLblTimeout', {style:lblStyle,id: 'lblTimeout'}, 'Options (Timeout)');
        this.#components.txtTimeout = new TextBox('divEleTimeout', 'uh_editor_txtTimeout', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.timeout? this.nodeElement.elementOptions.timeout : '' ,'',null,null,null,null,'number');
        // Filter enabled
        this.createLabel('divLblFilterEnabled', { style: lblStyle, id: 'lblFilterEnabled'}, 'Filter Enabled');
        this.#components.filterEnabled = new DropDown('divEleFilterEnabled', 'uh_editor_filterEnabled', MetaData.getBoolean, this.nodeElement.elementOptions && this.nodeElement.elementOptions.filterEnabled != undefined ? Utils.convertBooleanToString(this.nodeElement.elementOptions.filterEnabled): undefined);
    }
    createContainerDiv(){
        const tblStyle = "height: 100%";
        const divLabelStyle = "display:inline; width: 155px; text-align:left; padding-top:2px; padding-left:15px;"
        const divElementStyle = "display:inline; width: 220px;  text-align:left; padding-top:2px; padding-left:15px"
        const rowStyle = "margin-top: 12px";
        const colStyle = "display:inline; width: 25%; min-width: 350px; margin-left: 25px";

        const classRow="margin-top:20px";
        const classCol="display: inline-block;";
        const classColEle="display: inline-block;margin-left: auto;";
        const  classColEleText = "display: inline-block;margin-left: 55px;";

        let tblObj = {
            attr : {style : tblStyle} ,
            id : "tblEditorSub",
            rows: [
                {
                    attr: {style: classRow},
                    col : [                         
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblText"} }, {attr: { style: classColEleText, id: "divEleText"}}]},
                         { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblErrorMessageReq" } }] }                         
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
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblFilterEnabled"} }, {attr: { style: classColEle, id: "divEleFilterEnabled"}}]},
                        ]
                },
            ]
            }
            let divSub = this.createTable(tblObj);

            this.mountContainerToParent(divSub);  
 

    }
}