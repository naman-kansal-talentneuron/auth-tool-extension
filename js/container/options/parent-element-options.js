import ElementOptionsBase from "./element-options-base.js";
import DropDown from "../../component/drop-down.js";
import MetaData from "../../config/meta-data.js";
import TextBox from '../../component/text-box.js';
import Utils from "../../utils.js";

export default class ParentElementOptions extends ElementOptionsBase {


    #components = {

    };


    constructor(nodeElement,parentElement, onSaveCallBack) {
        super(parentElement);
        this.nodeElement = nodeElement;
        this.onSaveCallBack = onSaveCallBack;
        if(this.nodeElement.elementOptions){
            (typeof this.nodeElement.elementOptions == "string") && (this.nodeElement.elementOptions = JSON.parse(this.nodeElement.elementOptions));
        }
        this.nodeElement.elementOptions = Utils.setDefaultPageRetryElementOptions(this.nodeElement.elementOptions);
        this.nodeElement.elementOptions = Utils.setDefaultElementOptions(this.nodeElement.elementOptions);

        this.renderOptions();
        
    }

    renderOptions() {
        this.createContainerDiv();
        this.createComponents();
    }

    onSaveChanges(){
        let options = {
            //Link Element
            ...(this.#components.txtWaitUntil.selectedItem != undefined) && 
                    { waitUntil: this.#components.txtWaitUntil.selectedItem.length == 0 ? undefined : this.#components.txtWaitUntil.selectedItem},
            ...(this.#components.txtDelay.val != "") && { delay: parseInt(this.#components.txtDelay.val) },
            ...(this.#components.txtTimeout.val != "") && { timeout: parseInt(this.#components.txtTimeout.val) },
            ...(this.#components.txtReferer.val != "") && {referer: this.#components.txtReferer.val},
            ...(this.#components.txtUserAgent.val != "") && {userAgent: this.#components.txtUserAgent.val},

            //Click Element:
            ...(this.#components.txtMaxIteration.val) && {maxIteration : parseInt(this.#components.txtMaxIteration.val)},

            ...(this.#components.isCRCLoopDetectionEnabled.selectedItem != undefined) &&
             {isCRCLoopDetectionEnabled : this.#components.isCRCLoopDetectionEnabled.selectedItem.length == 0 ? undefined : JSON.parse(this.#components.isCRCLoopDetectionEnabled.selectedItem)},
            ...(this.#components.consCRCDuplicateLimit.val) && {consCRCDuplicateLimit : parseInt(this.#components.consCRCDuplicateLimit.val)},
            ...(this.#components.isPrepareLoopDetectionEnabled.selectedItem != undefined) &&
             {isPrepareLoopDetectionEnabled : this.#components.isPrepareLoopDetectionEnabled.selectedItem.length == 0 ? undefined : JSON.parse(this.#components.isPrepareLoopDetectionEnabled.selectedItem)},
            ...(this.#components.consCMDuplicateLimit.val) && {consCMDuplicateLimit : parseInt(this.#components.consCMDuplicateLimit.val)},
            ...(this.#components.idleHarvestingTimeoutMin.val) && {idleHarvestingTimeoutMin : parseInt(this.#components.idleHarvestingTimeoutMin.val)},
            
        };
        
        if(this.#components.ddlPageRetryEnabled.selectedItem === "true") {
            options={
             ...options,
            ...{pageRetryEnabled:true },
            ...(this.#components.txtRetryDelayInMs.val!="")&&{retryDelayInMs:parseInt(this.#components.txtRetryDelayInMs.val)},
            ...(this.#components.txtRetry.val!="")&&{retry:parseInt(this.#components.txtRetry.val)},  
        
        }
    }
         options.filterEnabled = this.#components.filterEnabled.selectedItem !== undefined ? JSON.parse(this.#components.filterEnabled.selectedItem) : undefined;
        options.clearData = this.#components.ddlClearData.selectedItem === undefined? undefined : (this.#components.ddlClearData.selectedItem == "true");  

        options.filterEnabled && (options.filter = {
            ...(this.#components.inheritDefault.selectedItem != undefined && this.#components.inheritDefault.selectedItem != "Select" ) && 
                        {inheritDefault: JSON.parse(this.#components.inheritDefault.selectedItem) },
            ...(this.#components.resourceTypes.selectedItem != undefined) && 
                        {resourceTypes : this.#components.resourceTypes.selectedItem.length == 0 ? undefined : (this.#components.resourceTypes.selectedItem)},
            ...(this.#components.blockListPath.val != "") && {blockListPath : this.#components.blockListPath.val.split(',')},
            ...(this.#components.blocklistDomain.val != "") && {blocklistDomain : this.#components.blocklistDomain.val.split(',')},
            ...(this.#components.whiteList.val != "") && {whitelist : this.#components.whiteList.val.split(',')}
        })

        options.filter && (options.filter = Utils.getEmptyCheckAndReturn(options.filter));

        options.isEnabledWebSecurity = this.#components.ddlEnabledWebSecurity.selectedItem == undefined ? undefined : 
                JSON.parse(this.#components.ddlEnabledWebSecurity.selectedItem == "true");  

        options.puppeteerExtra = this.#components.ddlPuppeteerExtra.selectedItem == undefined ? undefined :
                JSON.parse(this.#components.ddlPuppeteerExtra.selectedItem == "true");
        
        options.fingerprint = this.#components.ddlFingerPrint.selectedItem == undefined ? undefined : this.#components.ddlFingerPrint.selectedItem;
        options.browser = this.#components.ddlBrowser.selectedItem == undefined ? undefined : this.#components.ddlBrowser.selectedItem;

        options.isEnableAllChromeFeatures = this.#components.ddlEnableAllChromeFeatures.selectedItem == undefined ? undefined : 
        JSON.parse(this.#components.ddlEnableAllChromeFeatures.selectedItem == "true");

        options.isEnabledOptimization = this.#components.ddlEnabledOptimization.selectedItem == undefined ? undefined : 
        JSON.parse(this.#components.ddlEnabledOptimization.selectedItem == "true");

        options.isEnabledBackgroundNetworking = this.#components.ddlEnabledBackgroundNetworking.selectedItem == undefined ? undefined : 
        JSON.parse(this.#components.ddlEnabledBackgroundNetworking.selectedItem == "true")


        this.nodeElement.elementOptions = (Object.keys(options).length > 0) ? options : undefined; 
        return this.nodeElement.elementOptions;
    }


    disableRetryOptions(){
        let isDisabled = (this.#components.ddlPageRetryEnabled.selectedItem) === "true" ? false : true;
               
            Array.of(this.#components.txtRetry,this.#components.txtRetryDelayInMs)
                    .forEach((e) => {
                        isDisabled && (e.element.value = "");
                        isDisabled && (e.val != undefined ? (e.val = "") : e.selectedItem != undefined ? (e.selectedItem = "") : "");
                        e.element.disabled = isDisabled;
                        isDisabled ? e.element.classList.add("read-only") : e.element.classList.remove("read-only");
                    });
    }
    
    disableFilterOptions(){
        let isDisabled = (this.#components.filterEnabled.selectedItem && JSON.parse(this.#components.filterEnabled.selectedItem)) === true ? false : true;
        Array.of(this.#components.resourceTypes, this.#components.blockListPath, this.#components.whiteList,
            this.#components.blocklistDomain, this.#components.inheritDefault)
            .forEach((e) => {
                isDisabled && (e.element.value = "");
                isDisabled && (e.val != undefined ? (e.val = "") : e.selectedItem != undefined ? (e.selectedItem = "") : "");
                e.element.disabled = isDisabled;
                isDisabled ? e.element.classList.add("read-only") : e.element.classList.remove("read-only");
            });

        if(isDisabled) {
            this.#components.inheritDefault.element.value = this.#components.inheritDefault.selectedItem = "Select";
            Utils.disableEnableButton(document.getElementById('lblDefaultDomains'), true);
        }
        else{
            Utils.disableEnableButton(document.getElementById('lblDefaultDomains'), false);
        }
    }

    createComponents() {
        const lblStyle = "width: 85px;  font-weight: 550; padding-top:10px; margin-bottom:0px; ";
        const lblStyleEna = "width: 90px;  font-weight: 550; padding-top:10px; margin-bottom:0px; ";
        const lblStyleAcc = "width: 100px;  font-weight: 550; padding-top:10px; margin-bottom:0px";
        const lblHeaderStyle = "font-size:14px; padding-top:10px; magin-bottom:0px";
        const autoFillbtnStyle = "margin-left: 5px;display: inline-block;height: min-content; width: fit-content;margin-top: 9px;background-color: #4095c6;";

        this.createLabel('divLblWaitUntil', { style: lblStyle, id: 'lblWaitUntil' }, 'Options    (Wait Until)');
        this.#components.txtWaitUntil = new DropDown('divEleWaitUntil', 'uh_editor_txtWaitUntil', MetaData.getOptionsWaitUntil,
            this.nodeElement.elementOptions && this.nodeElement.elementOptions.waitUntil ? this.nodeElement.elementOptions.waitUntil : '', '', null, null, null, true);

        this.createLabel('divLblDelay', { style: lblStyle, id: 'lblDelay' }, 'Options (Delay)');
        this.#components.txtDelay = new TextBox('divEleDelay', 'uh_editor_txtDelay', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.delay ? this.nodeElement.elementOptions.delay : '', '', null, null, null, null, 'number');

        this.createLabel('divLblReferer', { style: lblStyle, id: 'lblReferer' }, 'Options (Referer)');
        this.#components.txtReferer = new TextBox('divEleReferer', 'uh_editor_txtReferer', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.referer ? this.nodeElement.elementOptions.referer : '', '', null, null, null, null, '');

        this.createLabel('divLblUserAgent', { style: lblStyle, id: 'lblUserAgent' }, 'Options (User Agent)');
        this.#components.txtUserAgent = new TextBox('divEleUserAgent', 'uh_editor_txtUserAgent', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.userAgent ? this.nodeElement.elementOptions.userAgent : '', '', null, null, null, null, '');

        this.createLabel('divLblTimeout', { style: lblStyle, id: 'lblTimeout' }, 'Options (Timeout)');
        this.#components.txtTimeout = new TextBox('divEleTimeout', 'uh_editor_txtTimeout', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.timeout ? this.nodeElement.elementOptions.timeout : '', '', null, null, null, null, 'number');

        this.createLabel('divLblMaxIteration', { style: lblStyle, id: 'lblMaxIteration' }, 'Max Iteration');
        this.#components.txtMaxIteration = new TextBox('divEleMaxIteration', 'uh_editor_txtMaxIteration', '', this.nodeElement.elementOptions.maxIteration ? this.nodeElement.elementOptions.maxIteration : '', '', null, null, null, null, 'number');

        this.createLabel('divLblEnabledWebSecurity', { style: lblStyle, id: 'lblEnabledWebSecurity' }, 'IsEnabled WebSecurity');
        this.#components.ddlEnabledWebSecurity = new DropDown('divEleEnabledWebSecurity', 'uh_editor_ddlEnabledWebSecurity', MetaData.getBoolean, Utils.convertBooleanToString(this.nodeElement.elementOptions.isEnabledWebSecurity), null);

        this.createLabel('divLblClearData', { style: lblStyle, id: 'lblClearData' }, 'Clear Data');
        this.#components.ddlClearData = new DropDown('divEleClearData', 'uh_editor_ddlClearData', MetaData.getBoolean, Utils.convertBooleanToString(this.nodeElement.elementOptions.clearData), null);

        this.createLabel('divLblRetry', {style:lblStyle,id: 'lblRetry'}, 'Options (Retry)');
        this.#components.txtRetry= new TextBox('divEleRetry', 'uh_editor_txtRetry', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.retry? this.nodeElement.elementOptions.retry : '' ,'',null,null,null,null,'number');
       
        this.createLabel('divLblRetryDelayInMs', {style:lblStyle,id: 'lblRetryDelayInMs'}, 'Options (Retry Delay In Ms)');
        this.#components.txtRetryDelayInMs= new TextBox('divEleRetryDelayInMs', 'uh_editor_txtRetryDelayInMs', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.retryDelayInMs? this.nodeElement.elementOptions.retryDelayInMs : '' ,'',null,null,null,null,'number');

        this.createLabel('divLblPageRetryEnabled', {style:lblStyle, id: 'lblPageRetryEnabled' }, 'Options (Page Retry Enabled)');
        this.#components.ddlPageRetryEnabled = new DropDown('divElePageRetryEnabled', 'uh_editor_pageRetryEnabled', MetaData.getBoolean,Utils.convertBooleanToString(this.nodeElement.elementOptions.pageRetryEnabled),this.disableRetryOptions.bind(this));
        
        this.createLabel('divLblPuppeteerExtra', { style: lblStyle, id: 'lblPuppeteerExtra' }, 'Puppeteer Extra');
        this.#components.ddlPuppeteerExtra = new DropDown('divElePuppeteerExtra', 'uh_editor_ddlPuppeteerExtra', MetaData.getBoolean, Utils.convertBooleanToString(this.nodeElement.elementOptions.puppeteerExtra), null);
        

        this.createLabel('divLblFingerPrint', { style: lblStyle, id: 'lblFingerPrint' }, 'Finger Print');
        this.#components.ddlFingerPrint = new DropDown('divEleFingerPrint', 'uh_editor_ddlFingerPrint', MetaData.getFingerPrintType, this.nodeElement.elementOptions.fingerprint, null);
        // Loop detection option changes

        this.createLabel('divLblBrowser', { style: lblStyle, id: 'lblBrowser' }, 'Browser');
        this.#components.ddlBrowser = new DropDown('divEleBrowser', 'uh_editor_ddlBrowser', MetaData.getBrowserTypes, this.nodeElement.elementOptions.browser, null);

        this.createLabel('divLblEnableAllChromeFeatures', { style: lblStyleEna, id: 'lblEnableAllChromeFeatures' }, 'IsEnableAll ChromeFeatures');
        this.#components.ddlEnableAllChromeFeatures = new DropDown('divEleEnableAllChromeFeatures', 'uh_editor_ddlEnableAllChromeFeatures', MetaData.getBoolean, Utils.convertBooleanToString(this.nodeElement.elementOptions.isEnableAllChromeFeatures), null);

        this.createLabel('divLblEnabledOptimization', { style: lblStyle, id: 'lblEnabledOptimization' }, 'IsEnabled Optimization');
        this.#components.ddlEnabledOptimization = new DropDown('divEleEnabledOptimization', 'uh_editor_ddlEnabledOptimization', MetaData.getBoolean, Utils.convertBooleanToString(this.nodeElement.elementOptions.isEnabledOptimization), null);

        this.createLabel('divLblEnabledBackgroundNetworking', { style: lblStyle, id: 'lblEnabledBackgroundNetworking' }, 'IsEnabled Background Networking');
        this.#components.ddlEnabledBackgroundNetworking = new DropDown('divEleEnabledBackgroundNetworking', 'uh_editor_ddlEnabledBackgroundNetworking', MetaData.getBoolean, Utils.convertBooleanToString(this.nodeElement.elementOptions.isEnabledBackgroundNetworking), null);
        
        this.createAccordion("divLblLoopDetection", { id: 'divParentAccordion' }, "Loop Detection configuration", "accordion-content");

        this.createLabel('accordion-content', { style: lblStyleAcc, id: 'lblIsCRCLoop', class: "grid-item" }, 'CRC Loop Detection Enabled');
        this.#components.isCRCLoopDetectionEnabled = new DropDown('accordion-content', 'uh_editor_isCRCLoop', MetaData.getBoolean,
            Utils.convertBooleanToString(this.nodeElement.elementOptions.isCRCLoopDetectionEnabled), this.disableFilterOptions.bind(this))

        this.createLabel('accordion-content', { style: lblStyleAcc, id: 'lblConsCRCDup', class: "grid-item" }, 'cons CRC Duplicate Limit');
        this.#components.consCRCDuplicateLimit = new TextBox('accordion-content', 'uh_editor_consCRCDup', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.consCRCDuplicateLimit ? this.nodeElement.elementOptions.consCRCDuplicateLimit : '', '', null, null, null, null, 'number');

        this.createLabel('accordion-content', { style: lblStyleAcc, id: 'lblIsPrepareLoop', class: "grid-item" }, 'Prepare Loop Detection Enabled');
        this.#components.isPrepareLoopDetectionEnabled = new DropDown('accordion-content', 'uh_editor_isPrepareLoop', MetaData.getBoolean,
            Utils.convertBooleanToString(this.nodeElement.elementOptions.isPrepareLoopDetectionEnabled), this.disableFilterOptions.bind(this))

        this.createLabel('accordion-content', { style: lblStyleAcc, id: 'lblConsCMDuplicate', class: "grid-item" }, 'cons CM Duplicate Limit');
        this.#components.consCMDuplicateLimit = new TextBox('accordion-content', 'uh_editor_consCMDuplicate', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.consCMDuplicateLimit ? this.nodeElement.elementOptions.consCMDuplicateLimit : '', '', null, null, null, null, 'number');

        this.createLabel('accordion-content', { style: lblStyleAcc, id: 'lblIdleHarvesting', class: "grid-item" }, 'Idle Harvesting Timeout Min');
        this.#components.idleHarvestingTimeoutMin = new TextBox('accordion-content', 'uh_editor_idleHarvesting', '', this.nodeElement.elementOptions.idleHarvestingTimeoutMin ? this.nodeElement.elementOptions.idleHarvestingTimeoutMin : '', '', null, null, null, null, 'number');

        this.createAccordion("divLblFilterOptions", { id: 'divParentAccordion2' }, "Filter Options", "accordion-filter");

        // Filter enabled
        this.createLabel('accordion-filter', { style: lblStyle, id: 'lblFilterEnabled', class: "grid-item" }, 'Filter Enabled');
        this.#components.filterEnabled = new DropDown('accordion-filter', 'uh_editor_filterEnabled', MetaData.getBoolean, Utils.convertBooleanToString(this.nodeElement.elementOptions.filterEnabled), this.disableFilterOptions.bind(this))

        // Inherit default
        this.createLabel('accordion-filter', { style: lblStyle, id: 'lblInheritDefault', class: "grid-item" }, 'Inherit Default');
        this.#components.inheritDefault = new DropDown('accordion-filter', 'uh_editor_InheritDefault', MetaData.getBoolean, (this.nodeElement.elementOptions.filter && this.nodeElement.elementOptions.filter.inheritDefault != undefined) ? Utils.convertBooleanToString(this.nodeElement.elementOptions.filter.inheritDefault) : "")

        // Block list path
        this.createLabel('accordion-filter', { style: lblStyle, id: 'lblBlockListPath', class: "grid-item" }, 'Block List Path');
        this.#components.blockListPath = new TextBox('accordion-filter', 'uh_editor_txtBlockListPath', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.filter && this.nodeElement.elementOptions.filter.blockListPath
            ? this.nodeElement.elementOptions.filter.blockListPath.join(',') : '', '', null, null, null, null, '');
        
        // WhiteList
        this.createLabel('accordion-filter', { style: lblStyle, id: 'lblWhiteList', class: "grid-item" }, 'White List');
        this.#components.whiteList = new TextBox('accordion-filter', 'uh_editor_txtWhiteList', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.filter && this.nodeElement.elementOptions.filter.whitelist
            ? this.nodeElement.elementOptions.filter.whitelist.join(',') : '', '', null, null, null, null, '');
        
        // Block list Domain
        this.createLabel('accordion-filter', { style: lblStyle, id: 'lblBlockListDomain', class: "grid-item" }, 'Block List Domain');
        this.#components.blocklistDomain = new TextBox('accordion-filter', 'uh_editor_txtBlockListDomain', '', 
            this.nodeElement.elementOptions && this.nodeElement.elementOptions.filter && this.nodeElement.elementOptions.filter.blockListDomain ? this.nodeElement.elementOptions.filter.blockListDomain.join(',') :
            this.nodeElement.elementOptions && this.nodeElement.elementOptions.filter && this.nodeElement.elementOptions.filter.blocklistDomain ? this.nodeElement.elementOptions.filter.blocklistDomain.join(',') : '',
            '', null, null, null, null, '');

        // Block list default values checkbox
        this.createButton('accordion-filter', { style:autoFillbtnStyle, id: 'lblDefaultDomains', class: "grid-item" }, 'Autofill', { "click": this.setBlockDomainWithDefaultset.bind(this) });
        
        //empty label to fill the space for grid
        this.createLabel('accordion-filter', { style: lblStyle, id: 'lblEmptyLabel', class: "grid-item" }, '  ');
        
        // Resource Types
        this.createLabel('accordion-filter', { style: lblStyle, id: 'lblResourceTypes', class: "grid-item" }, 'Resource Types');
        this.#components.resourceTypes = new DropDown('accordion-filter', 'uh_editor_ddlResourceTypes', MetaData.getResourceTypes, this.nodeElement.elementOptions && this.nodeElement.elementOptions.filter && this.nodeElement.elementOptions.filter.resourceTypes
            ? this.nodeElement.elementOptions.filter.resourceTypes : "", null, null, null, null, true);

        this.disableRetryOptions();
        this.disableFilterOptions();
       
    }

    setBlockDomainWithDefaultset() {
        let blocklistDomainVal = this.#components.blocklistDomain.val;  
        let userValues = '';
        if (blocklistDomainVal !== '') {
            blocklistDomainVal = blocklistDomainVal.split(',');
            let preDefineDomains = MetaData.getDefaultList;             
            for (let i = 0; i < blocklistDomainVal.length; i++) {
                if (!preDefineDomains.includes(blocklistDomainVal[i])) {
                    userValues = userValues + blocklistDomainVal[i] + ',';
                }
            }

            this.#components.blocklistDomain.setValue( userValues + MetaData.getDefaultList.join(','));
        }
        else {
            this.#components.blocklistDomain.setValue( MetaData.getDefaultList.join(','));
        }

        //save
       this.onSaveCallBack();

    }

    createContainerDiv() {
        const tblStyle = "height:100%";
        const colStyle = "display:inline; width: 25%; min-width: 350px; margin-left: 25px";
        const colStyle2 = "display:inline; width: 25%; min-width: 350px; margin-left: 20px";
        const classRow = "margin-top:20px";
        const classCol = "display: inline-block;";
        const classColFullWidth = "display: inline-block; width: 98%";
        const classColEle = "display: inline-block;margin-left: auto;";

        let tblObj = {
            attr: { style: tblStyle },
            id: "tblEditorSub",
            rows: [
                {
                    attr: { style: classRow },
                    col: [
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblWaitUntil" } }, { attr: { style: classColEle, id: "divEleWaitUntil" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblDelay" } }, { attr: { style: classColEle, id: "divEleDelay" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblTimeout" } }, { attr: { style: classColEle, id: "divEleTimeout" } }] }
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblReferer" } }, { attr: { style: classColEle, id: "divEleReferer" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblUserAgent" } }, { attr: { style: classColEle, id: "divEleUserAgent" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblClearData" } }, { attr: { style: classColEle, id: "divEleClearData" } }] },
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblPageRetryEnabled" } }, { attr: { style: classColEle, id: "divElePageRetryEnabled" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblRetryDelayInMs" } }, { attr: { style: classColEle, id: "divEleRetryDelayInMs" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblRetry" } }, { attr: { style: classColEle, id: "divEleRetry" } }] },
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblMaxIteration" } }, { attr: { style: classColEle, id: "divEleMaxIteration" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblEnabledWebSecurity" } }, { attr: { style: classColEle, id: "divEleEnabledWebSecurity" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblPuppeteerExtra" } }, { attr: { style: classColEle, id: "divElePuppeteerExtra" } }] },
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblFingerPrint" } }, { attr: { style: classColEle, id: "divEleFingerPrint" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblBrowser" } }, { attr: { style: classColEle, id: "divEleBrowser" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblEnableAllChromeFeatures" } }, { attr: { style: classColEle, id: "divEleEnableAllChromeFeatures" } }] },
                   
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblEnabledOptimization" } }, { attr: { style: classColEle, id: "divEleEnabledOptimization" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblEnabledBackgroundNetworking" } }, { attr: { style: classColEle, id: "divEleEnabledBackgroundNetworking" } }] },
                               
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                        { attr: { style: colStyle2 }, divs: [{ attr: { style: classColFullWidth, id: "divLblFilterOptions" } }] },
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                        { attr: { style: colStyle2 }, divs: [{ attr: { style: classColFullWidth, id: "divLblLoopDetection" } }] },
                    ]
                },
                {
                    attr: {style: classRow},
                    col : [             
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblFilterEnabled"} }, {attr: { style: classColEle, id: "divEleFilterEnabled"}}]},
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblInheritDefault"} }, {attr: { style: classColEle, id: "divEleInheritDefault"}}]}      
                    ]
                },
                {   
                    attr: {style: classRow},
                    col : [                   
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblResourceTypes"} }, {attr: { style: classColEle, id: "divEleResourceTypes"}}]},
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblBlockListPath"} }, {attr: { style: classColEle, id: "divEleBlockListPath"}}]}
                    ]
                },
                {
                    attr: {style: classRow},
                    col : [                   
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblBlockListDomain"} }, {attr: { style: classColEle, id: "divEleBlockListDomain"}}]},
                         { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblWhiteList"} }, {attr: { style: classColEle, id: "divEleWhiteList"}}]},
                    ]
                }
            ]
        }
        let divSub = this.createTable(tblObj);

        this.mountContainerToParent(divSub);

    }
}