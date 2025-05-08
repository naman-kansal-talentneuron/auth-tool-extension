import TextBox from "../../component/text-box.js";
import DropDown from "../../component/drop-down.js";
import MouseElement from "../../element/mouse-event.js";
import ElementOptionsBase from "./element-options-base.js";
import MetaData from "../../config/meta-data.js";
import Utils from "../../utils.js";

export default class MouseeventElementOptions extends ElementOptionsBase {
    #components = {
        txtX : null,
        txtY : null
  
    }

    constructor(nodeElement, parentElement) {
        super(parentElement);
        this.previousNodeElement = nodeElement;
        this.nodeElement = new MouseElement(nodeElement.elementId, 'MouseElement', nodeElement.elementSelector,
            nodeElement.elementSelectorType, nodeElement.elementParent, nodeElement.elementPersist, nodeElement.elementOptions,
            undefined, nodeElement.document,nodeElement.elementCRCFields); 

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
        let options = {
            ...(this.#components.txtWaitUntil.selectedItem != undefined) && 
                    { waitUntil: this.#components.txtWaitUntil.selectedItem.length == 0 ? undefined : this.#components.txtWaitUntil.selectedItem},
            ...(this.#components.txtDelay.val != "") && { delay: parseInt(this.#components.txtDelay.val) },
            ...(this.#components.txtTimeout.val != "") && { timeout: parseInt(this.#components.txtTimeout.val) },
            ...(this.#components.txtX.val != "") && {x : parseInt(this.#components.txtX.val) },
            ...(this.#components.txtY.val != "") && {y: parseInt(this.#components.txtY.val) },
            ...(this.#components.filterEnabled.selectedItem != undefined) &&
                    { filterEnabled: this.nodeElement.elementOptions && this.#components.filterEnabled.selectedItem == undefined ? undefined: (this.#components.filterEnabled.selectedItem == "true")}
        }
        this.nodeElement.elementOptions = (Object.keys(options).length > 0) ? options : undefined; 
        return this.nodeElement;

    }
    createComponents() {
        const lblStyle = "width: 85px;  font-weight: 550";                
        const lblStyleSmall = "width: 45px;  font-weight: 550";        
        

        this.createLabel('divLblX', {style:lblStyle, id: 'lblX' }, 'Options (X)');
        this.#components.txtX = new TextBox('divEleX', 'uh_editor_txtX','', this.nodeElement.elementOptions && this.nodeElement.elementOptions.x? this.nodeElement.elementOptions.x :'' ,'', null, null, null,null, 'number')
        
        this.createLabel('divLblY', {style:lblStyle, id: 'lbly' }, 'Options (Y)');
        this.#components.txtY = new TextBox('divEleY', 'uh_editor_txty','', this.nodeElement.elementOptions && this.nodeElement.elementOptions.y? this.nodeElement.elementOptions.y :'' ,'', null, null, null, null, 'number')

        this.createLabel('divLblWaitUntil', {style:lblStyle, id: 'lblWaitUntil' }, 'Options    (Wait Until)');
        this.#components.txtWaitUntil = new DropDown('divEleWaitUntil', 'uh_editor_txtWaitUntil',MetaData.getOptionsWaitUntil,
                this.nodeElement.elementOptions && this.nodeElement.elementOptions.waitUntil ? this.nodeElement.elementOptions.waitUntil: '', '',null,null,null,true);
        
        this.createLabel('divLblDelay', {style:lblStyleSmall,id: 'lblDelay'}, 'Options (Delay)');
        this.#components.txtDelay = new TextBox('divEleDelay', 'uh_editor_txtDelay', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.delay? this.nodeElement.elementOptions.delay : '' ,'', null, null, null, null, 'number');

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
        const colOptionsStyle = "width: 100%; margin-left: 25px";

        const classRow="margin-top:20px";
        const classCol="display: inline-block;";
        const classColEle="display: inline-block;margin-left: auto;";
        const classColEle1="display: inline-block;margin-left: 40px;";

        let tblObj = {
            attr : {style : tblStyle} ,
            id : "tblEditorSub",
            rows: [
                {
                    attr: {style: classRow},
                    col : [
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblX"} }, {attr: { style: classColEle, id: "divEleX"}}]},
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblY"} }, {attr: { style: classColEle, id: "divEleY"}}]}                        
                    ]
                },
                {
                    attr: {style: classRow},
                    col : [                       
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblWaitUntil"} }, {attr: { style: classColEle, id: "divEleWaitUntil"}}]},
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblDelay"} }, {attr: { style: classColEle1, id: "divEleDelay"}}]},
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