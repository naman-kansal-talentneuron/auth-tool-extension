import ElementOptionsBase from "./element-options-base.js";
import LinkElement from '../../element/LinkElement.js';
import OnComplete from '../../harvest/OnComplete.js'
import DropDown from "../../component/drop-down.js";
import MetaData from "../../config/meta-data.js";
import TextBox from '../../component/text-box.js';
import Utils from "../../utils.js";

export default class LinkElementOptions extends ElementOptionsBase {
    
        
    #components = {
        optOnComplete : null,
        ddlNewTab : null
    };


    constructor(nodeElement,parentElement) {
        super(parentElement);
        this.previousNodeElement = nodeElement;
        this.nodeElement = new LinkElement(nodeElement.id, 'LinkElement', nodeElement.elementSelector,nodeElement.elementSelectorType,
                nodeElement.elementParent, nodeElement.elementPersist,nodeElement.elementOptions, undefined,
                nodeElement.elementNewTab, nodeElement.elementOnComplete, nodeElement.document,nodeElement.elementCRCFields); 

        if(this.nodeElement.elementOptions){
            (typeof this.nodeElement.elementOptions == "string") && (this.nodeElement.elementOptions = JSON.parse(this.nodeElement.elementOptions));
        }
        this.nodeElement.elementOptions = Utils.setDefaultPageRetryElementOptions(this.nodeElement.elementOptions);
            
        this.renderOptions();
    
    }

    renderOptions() {        
        this.createContainerDiv(); 
        this.createComponents();    
    }

    onSaveChanges(){
        this.nodeElement.elementNewTab = this.#components.ddlNewTab.selectedItem == undefined ? undefined : ( this.#components.ddlNewTab.selectedItem == "true");
        let onCompleteObj = new OnComplete(this.#components.optOnComplete.selectedItem == undefined ? undefined : (this.#components.optOnComplete.selectedItem == "true"));
       
        this.nodeElement.addOnComplete(onCompleteObj);
            
                let options={}
                options = {
                   ...(this.#components.txtWaitUntil.selectedItem != undefined) && 
                           { waitUntil: this.#components.txtWaitUntil.selectedItem.length == 0 ? undefined : this.#components.txtWaitUntil.selectedItem},
                   ...(this.#components.txtDelay.val != "") && { delay: parseInt(this.#components.txtDelay.val) },
                   ...(this.#components.txtTimeout.val != "") && { timeout: parseInt(this.#components.txtTimeout.val) },
                   ...(this.#components.txtReferer.val != "") && {referer: this.#components.txtReferer.val},
                   ...(this.#components.txtUserAgent.val != "") && {userAgent: this.#components.txtUserAgent.val},
                   ...(this.#components.filterEnabled.selectedItem != undefined) &&
                           { filterEnabled: this.nodeElement.elementOptions && this.#components.filterEnabled.selectedItem == undefined ? undefined: (this.#components.filterEnabled.selectedItem == "true")}
              
                   
                }
                 
                   if(this.#components.pageRetryEnabled.selectedItem === "true") {
                       options={
                        ...options,
                        ...{pageRetryEnabled:true },
                       ...(this.#components.txtRetryDelayInMs.val!="")&&{retryDelayInMs:parseInt(this.#components.txtRetryDelayInMs.val)},
                       ...(this.#components.txtRetry.val!="")&&{retry:parseInt(this.#components.txtRetry.val)},  
                   
                   }
                }
               this.nodeElement.elementOptions = (Object.keys(options).length > 0) ? options : undefined; 
               return this.nodeElement;
            }     
    

    disableRetryOptions(){
        let isDisabled = (this.#components.pageRetryEnabled.selectedItem) === "true" ? false : true;
               
            Array.of(this.#components.txtRetry,this.#components.txtRetryDelayInMs)
                    .forEach((e) => {
                        isDisabled && (e.element.value = "");
                        isDisabled && (e.val != undefined ? (e.val = "") : e.selectedItem != undefined ? (e.selectedItem = "") : "");
                        e.element.disabled = isDisabled;
                        isDisabled ? e.element.classList.add("read-only") : e.element.classList.remove("read-only");
                    });
        
    }
    
    createComponents() {
        const lblStyle = "width: 85px;  font-weight: 550; padding-top:10px; magin-bottom:0px";        
        
        this.createLabel('divLblNewTab', {style:lblStyle, id: 'lblNewTab' }, 'Is New Tab');
        this.#components.ddlNewTab = new DropDown('divEleNewTab', 'uh_editor_ddlNewTab', MetaData.getBoolean, Utils.convertBooleanToString(this.nodeElement.elementNewTab));
        
        let selectedGoBackOption = (this.nodeElement.elementOnComplete && this.nodeElement.elementOnComplete.goBack)?this.nodeElement.elementOnComplete.goBack:'';
        this.createLabel('divLblComplete', {style:lblStyle, id : 'lblComplete'}, 'On Complete (goBack)');                            
        this.#components.optOnComplete = new DropDown('divEleOnComplete', 'uh_editor_ddlComplete', MetaData.getBoolean,Utils.convertBooleanToString(selectedGoBackOption));

        this.createLabel('divLblWaitUntil', {style:lblStyle, id: 'lblWaitUntil' }, 'Options    (Wait Until)');
        this.#components.txtWaitUntil = new DropDown('divEleWaitUntil', 'uh_editor_txtWaitUntil',MetaData.getOptionsWaitUntil,
                this.nodeElement.elementOptions && this.nodeElement.elementOptions.waitUntil ? this.nodeElement.elementOptions.waitUntil: '', '',null,null,null,true);
        
        this.createLabel('divLblDelay', {style:lblStyle,id: 'lblDelay'}, 'Options (Delay)');
        this.#components.txtDelay = new TextBox('divEleDelay', 'uh_editor_txtDelay', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.delay? this.nodeElement.elementOptions.delay : '' ,'',null,null,null,null,'number');

        this.createLabel('divLblReferer', {style:lblStyle,id: 'lblReferer'}, 'Options (Referer)');
        this.#components.txtReferer = new TextBox('divEleReferer', 'uh_editor_txtReferer', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.referer? this.nodeElement.elementOptions.referer : '' ,'',null,null,null,null,'');

        this.createLabel('divLblUserAgent', {style:lblStyle,id: 'lblUserAgent'}, 'Options (User Agent)');
        this.#components.txtUserAgent = new TextBox('divEleUserAgent', 'uh_editor_txtUserAgent', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.userAgent? this.nodeElement.elementOptions.userAgent : '' ,'',null,null,null,null,'');

        this.createLabel('divLblTimeout', {style:lblStyle,id: 'lblTimeout'}, 'Options (Timeout)');
        this.#components.txtTimeout = new TextBox('divEleTimeout', 'uh_editor_txtTimeout', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.timeout? this.nodeElement.elementOptions.timeout : '' ,'',null,null,null,null,'number');
        
        this.createLabel('divLblRetry', {style:lblStyle,id: 'lblRetry'}, 'Options (Retry)');
        this.#components.txtRetry= new TextBox('divEleRetry', 'uh_editor_txtRetry', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.retry? this.nodeElement.elementOptions.retry : '' ,'',null,null,null,null,'number');
       
        this.createLabel('divLblRetryDelayInMs', {style:lblStyle,id: 'lblRetryDelayInMs'}, 'Options (Retry Delay In Ms)');
        this.#components.txtRetryDelayInMs= new TextBox('divEleRetryDelayInMs', 'uh_editor_txtRetryDelayInMs', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.retryDelayInMs? this.nodeElement.elementOptions.retryDelayInMs : '' ,'',null,null,null,null,'number');

        this.createLabel('divLblPageRetryEnabled', {style:lblStyle, id: 'lblPageRetryEnabled' }, 'Options (Page Retry Enabled)');
        this.#components.pageRetryEnabled = new DropDown('divElePageRetryEnabled', 'uh_editor_pageRetryEnabled', MetaData.getBoolean,Utils.convertBooleanToString(this.nodeElement.elementOptions.pageRetryEnabled),this.disableRetryOptions.bind(this));
        
       
        // Filter enabled
        
        this.createLabel('divLblFilterEnabled', { style: lblStyle, id: 'lblFilterEnabled'}, 'Filter Enabled');
        this.#components.filterEnabled = new DropDown('divEleFilterEnabled', 'uh_editor_filterEnabled', MetaData.getBoolean, this.nodeElement.elementOptions && this.nodeElement.elementOptions.filterEnabled != undefined ? Utils.convertBooleanToString(this.nodeElement.elementOptions.filterEnabled): undefined);
    
      this.disableRetryOptions();
    }

    createContainerDiv() {
        const tblStyle = "height:100%";
        const divLabelStyle = "display:inline; width: 155px; text-align:left; padding-top:2px; padding-left:15px;"
        const divElementStyle = "display:inline; width: 220px;  text-align:left; padding-top:2px; padding-left:15px"
        const rowStyle = "margin-bottom: -2px";
        const colStyle = "display:inline; width: 25%; min-width: 350px; margin-left: 25px";        
        const colOptionsStyle = "width: 100%;";

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
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblWaitUntil"} }, {attr: { style: classColEle, id: "divEleWaitUntil"}}]},
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblDelay"} }, {attr: { style: classColEle, id: "divEleDelay"}}]},
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblTimeout"} }, {attr: { style: classColEle, id: "divEleTimeout"}}]}
                    ]
                },
                {
                    attr: {style: classRow},
                    col : [
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblReferer"} }, {attr: { style: classColEle, id: "divEleReferer"}}]},
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblUserAgent"} }, {attr: { style: classColEle, id: "divEleUserAgent"}}]}, 
                        
     
                    ]
                },
                {
                    attr: {style: classRow},
                    col : [
                       
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblPageRetryEnabled"} }, {attr: { style: classColEle, id: "divElePageRetryEnabled"}}]},                           
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblRetryDelayInMs"} }, {attr: { style: classColEle, id: "divEleRetryDelayInMs"}}]},
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblRetry"} }, {attr: { style: classColEle, id: "divEleRetry"}}]},
                    ]
                },
                {
                    attr: {style: classRow},
                    col : [                         
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblNewTab"} }, {attr: { style: classColEle, id: "divEleNewTab"}}]},
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblComplete"} }, {attr: { style: classColEle, id: "divEleOnComplete"}}] }                         
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