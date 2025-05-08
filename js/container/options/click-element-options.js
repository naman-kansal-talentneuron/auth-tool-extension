import ElementOptionsBase from "./element-options-base.js";
import ClickElement from '../../element/click-element.js';
import DropDown from '../../component/drop-down.js';
import TextBox from '../../component/text-box.js';
import MetaData from "../../config/meta-data.js";
import Utils from "../../utils.js";

export default class ClickElementOptions extends ElementOptionsBase {

    #components = {
        ddlMultiple : null,
        ddlFetchType : null,
        ddlChildFirst: null
    };

    constructor(nodeElement,parentElement) {
        super(parentElement);        
        this.previousNodeElement = nodeElement;
        this.nodeElement = new ClickElement(nodeElement.id, 'ClickElement', nodeElement.elementSelector, nodeElement.elementSelectorType, 
            nodeElement.elementParent, nodeElement.elementPersist,nodeElement.elementOptions, undefined,
            nodeElement.elementMultiple, nodeElement.elementMaxIteration, nodeElement.elementFetchType, nodeElement.elementChildFirst, nodeElement.document,nodeElement.elementCRCFields); 
        
        if(this.nodeElement.elementOptions){
            (typeof this.nodeElement.elementOptions == "string") && (this.nodeElement.elementOptions = JSON.parse(this.nodeElement.elementOptions));
        }
        
        this.renderOptions();
    }

    onSaveChanges(){
        this.nodeElement.elementFetchType = this.#components.ddlFetchType.selectedItem == undefined? undefined : (this.#components.ddlFetchType.selectedItem);
        this.nodeElement.elementChildFirst = this.#components.ddlChildFirst.selectedItem == undefined?undefined: (this.#components.ddlChildFirst.selectedItem == "true");         
        this.nodeElement.elementMultiple = this.#components.ddlMultiple.selectedItem == undefined?undefined: ( this.#components.ddlMultiple.selectedItem == "true");
        //Set Max Iteration  only if Multiple is set
        this.nodeElement.elementMaxIteration = this.nodeElement.elementMultiple && this.#components.txtMaxIteration.val != "" ? parseInt(this.#components.txtMaxIteration.val) : undefined;
       
        let options = {
            ...(this.#components.txtWaitUntil.selectedItem != undefined) && 
                    { waitUntil: this.#components.txtWaitUntil.selectedItem.length == 0 ? undefined : this.#components.txtWaitUntil.selectedItem},
            ...(this.#components.txtDelay.val != "") && { delay: parseInt(this.#components.txtDelay.val) },
            ...(this.#components.txtTimeout.val != "") && { timeout: parseInt(this.#components.txtTimeout.val) } ,
            ...(this.#components.ddlButton.selectedItem) && {button :this.#components.ddlButton.selectedItem },
            ...(this.#components.filterEnabled.selectedItem != undefined) &&
                    { filterEnabled: this.nodeElement.elementOptions && this.#components.filterEnabled.selectedItem == undefined ? undefined: (this.#components.filterEnabled.selectedItem == "true")}
        };
        this.nodeElement.elementOptions = (Object.keys(options).length > 0) ? options : undefined;       
        return this.nodeElement;
    }

    renderOptions() {
        this.createContainerDiv();
        this.createComponents();
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

    createContainerDiv() {
        const tblStyle = "height:100%";
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
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblMultiple"} }, {attr: { style: classColEle, id: "divEleMultiple"}}] },                         
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblMaxIteration"} }, {attr: { style: classColEle, id: "divEleMaxIteration"}}] },
                    ]
                },
                {
                    attr: {style: classRow},
                    col : [
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblFetchtype"} }, {attr: { style: classColEle, id: "divEleFetchType"}}]},                                                  
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblChildFirst"} }, {attr: { style: classColEle, id: "divEleChildFirst"}}]}
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
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblButton"} }, {attr: { style: classColEle1, id: "divEleButton"}}]}
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
    createComponents() {
        const lblStyle = "width: 85px;  font-weight: 550";        
        const lblStyleSmall = "width: 45px;  font-weight: 550";        
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

        this.createLabel('divLblChildFirst', {style:lblStyle, id : 'lblChildFirst'}, 'Child First');                            
        this.#components.ddlChildFirst = new DropDown('divEleChildFirst', 'uh_editor_ddlChildFirst', MetaData.getBoolean, Utils.convertBooleanToString(this.nodeElement.elementChildFirst));  
        // render Options
        
        this.createLabel('divLblWaitUntil', {style:lblStyle, id: 'lblWaitUntil' }, 'Options    (Wait Until)');
        this.#components.txtWaitUntil = new DropDown('divEleWaitUntil', 'uh_editor_txtWaitUntil',MetaData.getOptionsWaitUntil,
                this.nodeElement.elementOptions && this.nodeElement.elementOptions.waitUntil ? this.nodeElement.elementOptions.waitUntil: '', '',null,null,null,true);
        
        
        this.createLabel('divLblDelay', {style:lblStyle,id: 'lblDelay'}, 'Options (Delay)');
        this.#components.txtDelay = new TextBox('divEleDelay', 'uh_editor_txtDelay', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.delay? this.nodeElement.elementOptions.delay : '' ,'',null,null,null,null,'number');

        this.createLabel('divLblTimeout', {style:lblStyle,id: 'lblTimeout'}, 'Options (Timeout)');
        this.#components.txtTimeout = new TextBox('divEleTimeout', 'uh_editor_txtTimeout', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.timeout? this.nodeElement.elementOptions.timeout : '' ,'',null,null,null,null,'number');

        this.createLabel('divLblButton', {style:lblStyleSmall, id : 'lblButton'}, 'Options (Button)');                            
        this.#components.ddlButton = new DropDown('divEleButton', 'uh_editor_ddlButton', MetaData.getClickEventButtonOptions,  this.nodeElement.elementOptions && this.nodeElement.elementOptions.button ? this.nodeElement.elementOptions.button : '');    
        
        // Filter enabled
        this.createLabel('divLblFilterEnabled', { style: lblStyle, id: 'lblFilterEnabled'}, 'Filter Enabled ');
        this.#components.filterEnabled = new DropDown('divEleFilterEnabled', 'uh_editor_filterEnabled', MetaData.getBoolean, this.nodeElement.elementOptions && this.nodeElement.elementOptions.filterEnabled != undefined ? Utils.convertBooleanToString(this.nodeElement.elementOptions.filterEnabled): undefined);
        
    }    

}