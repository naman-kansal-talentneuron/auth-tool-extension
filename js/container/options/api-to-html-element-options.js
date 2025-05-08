import ElementOptionsBase from "./element-options-base.js";
import APIHtmlElement from "../../element/APIHtmlElement.js";
import FileHTMLElement from "../../element/FileHTMLElement.js";
import KeyValueList from "../../component/keyvalue-list.js";
import TextArea from "../../component/text-area.js";
import DropDown from "../../component/drop-down.js";
import MetaData from "../../config/meta-data.js";
import TextBox from '../../component/text-box.js';
import Utils from "../../utils.js";
import APIRequestUtil from "../../helper/api-request-util.js";
import HTTPStatusCodes from "../../helper/api-status-code.js";
import CheckBox from "../../component/check-box.js";

export default class APIToHTMLElementOptions extends ElementOptionsBase {
    
    #components = {};

    constructor(nodeElement,parentElement,onSaveCallback,elementType) {
        super(parentElement);
        this.previousNodeElement = nodeElement;
        this.onSaveCallback = onSaveCallback;
        this.elementType = elementType;
        this.isApiElement = (elementType == MetaData.getActionTypes.APIToHTMLElement || elementType ==  MetaData.getActionTypes.BrowserToHtmlElement);
        if(!this.isApiElement){
            this.placeHolder = "Enter complete DOCX/PDF/RTF url to convert to HTML or direct HTML file";
            this.nodeElement = new FileHTMLElement(nodeElement.elementId, 'ParamElement', nodeElement.elementSelector, nodeElement.elementSelectorType, 
            nodeElement.elementParent, undefined, nodeElement.elementOptions, undefined,
              nodeElement.document, nodeElement.elementCRCFields, nodeElement.apiHtmlURL, nodeElement.contentType, nodeElement.useFileUrlDebug, nodeElement.proxy);    
            this.constructProxyDDOptions();

        } else {
            this.placeHolder = "Enter HTML url";
            this.nodeElement = new APIHtmlElement(nodeElement.elementId, 'ParamElement', nodeElement.elementSelector, nodeElement.elementSelectorType, 
            nodeElement.elementParent, undefined, nodeElement.elementOptions, undefined,
              nodeElement.document, nodeElement.elementCRCFields, nodeElement.apiHtmlURL, nodeElement.contentType);
        }
        this.nodeElement.elementOptions = Utils.setDefaultPageRetryElementOptions(this.nodeElement.elementOptions);
        this.renderOptions();
        this.apiRequestUtil = new APIRequestUtil();

    }
    renderOptions() {
        this.createContainerDiv(); 
        this.createComponents();
    }

    onSaveChanges() {
        
        let options = {};

        options = {
            ...(this.#components.ignoreHeaders.val != "") && { ignoreHeaders: this.#components.ignoreHeaders.val.split(',') },
            ...(this.#components.ignoreCookies.val != "") && { ignoreCookies: this.#components.ignoreCookies.val.split(',') },
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

        this.nodeElement.contentType = this.#components.contentType.selectedItem;

        let isValidJson = true;

        if(this.nodeElement.contentType === "text" || this.nodeElement.contentType === undefined ) {

            isValidJson = false;
            options.data = this.#components.txtData.val.trim() != ""  ? this.#components.txtData.val : undefined;

        } else if(this.nodeElement.contentType === "json" || this.nodeElement.contentType === undefined) {
            try{
                //Set value only if exists
                if( this.#components.txtData.val.trim().length){
                    let postData = JSON.parse(this.#components.txtData.val);
                    options.data = postData;
                }
            }catch{
                console.log( "Invalid Json PostData");
                if( this.#components.txtData.val.trim().length){
                    isValidJson = false;
                }
                options.data = this.nodeElement.elementOptions && this.nodeElement.elementOptions.data ? this.nodeElement.elementOptions.data.trim() != "" ? this.nodeElement.elementOptions.data : undefined : undefined;
            }
        }


        this.showError(isValidJson);

        options.inheritPageHeaders = this.#components.inheritPageHeaders.selectedItem !== undefined 
                                        ? JSON.parse(this.#components.inheritPageHeaders.selectedItem) : undefined;
        options.inheritPageCookies = this.#components.inheritPageCookies.selectedItem !== undefined 
                                        ? JSON.parse(this.#components.inheritPageCookies.selectedItem) : undefined;
        
        options.headers = Utils.getEmptyCheckAndReturn(this.#components.lstKeyValueHeader.getOptionsAsObject());
        options.cookies = Utils.getEmptyCheckAndReturn( this.#components.lstKeyValueCookie.getOptionsAsObject());

        if(!this.isApiElement){
            this.nodeElement.useFileUrlDebug = this.#components.useFileUrl.selectedItem === undefined ? false : this.#components.useFileUrl.selectedItem;
            options.responseFileType = this.#components.responseFileType != undefined ? this.#components.responseFileType.selectedItem : undefined;
            this._constructProxyData();
            this._handleFileURLInput();
        }
        if(this.#components.txtUserName.val.trim() != ""){
            options.auth = {};
            options.auth.username = this.#components.txtUserName.val;
            if(this.#components.txtPassWord.val.trim() != ""){
                options.auth.password = this.#components.txtPassWord.val;
            }
        }

        this.nodeElement.apiHtmlURL = this.#components.htmlPath.val;
        this.nodeElement.elementOptions = options;
        return this.nodeElement;
    }

    /**
     * Builds Host and port data with respect to the proxy selected.
     */
    _constructProxyData(){

        if(this.#components.proxy.selectedItem === ''){
            this.nodeElement.proxy = undefined;
        } else {
            this.nodeElement.proxy = this.#components.proxyMap.get(this.#components.proxy.selectedItem);
        }
    }


    /**
     * Enables or disables the URL input based on the checkbox selection.
     */
    _handleFileURLInput(){
        this.nodeElement.useFileUrlDebug ? this.#components.htmlPath.element.classList.remove("read-only") : this.#components.htmlPath.element.classList.add("read-only");
        this.handleApplyClick();
    }

    showError(isValidJson) {        
        let style = this.nodeElement.contentType === "json" ? isValidJson ? "color: red; display: none;" : "color: red;  " : "color: red; display: none;" ;
        document.getElementById('lblDataErrorMessage').setAttribute('style',style);              
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
    
    /**
     * adds pre-defined user agent and content-type to headers
     */
    addUserAgentOrContentTypeOption = () => {
        const chosenOption = document.getElementById('userAgentContentTypeDropdown').value;

        const [key, value] = chosenOption.split('|');
        const existingHeaders = this.#components.lstKeyValueHeader.getOptions();

        if(!existingHeaders.map(i => i.key.toLowerCase()).includes(key.toLowerCase())) {
            this.#components.lstKeyValueHeader.addToKeyValueList(key, value);
        } else {
            this.#components.lstKeyValueHeader.updateValueByKey(key, value);
        }
    }

    createComponents() {

        const lblStyle = "width: 110px;  font-weight: 550";
        const userAgentContentTypeLabelStyle = "margin-left: 15px; margin-bottom: 20px; margin-top: 20px; font-weight: 550";
        const lblStyle2 = "width: 85px;  font-weight: 550";
        const lblStyle3 = "width: 30px;  font-weight: 550";
        const lblAccordion = "display: inline-flex; width: 45px; font-weight: 550;align-items: center; margin-top: 10px;" 
        const lblAccordion1 = "display: inline-flex; width: 110px; font-weight: 550; margin: 17px 6px 0px 39px;" 
        const lblStyleSmallParent = "width: 85px;  font-weight: 550";
        const lblErrorMessage= "color: red; display:none";
        const btnStyle  = "position: relative; bottom: 9px; margin-left: 25px; display : inline-block;"
        const addBtnStyle  = "position: relative; margin-left: 25px; display : inline-block;"
        const btnStyleMiddle1  = "position: relative; bottom: 7px; margin-left: 264px; display : inline-block;"
        const btnStyleMiddle  = "display : inline-block;height: 24px; margin: 13px 29px 0px 59px;"

        this.createLabel('divLblKeyValueOptions', {style: lblStyleSmallParent, id: 'lblKeyValueOptions'}, 'Options :');


        this.createLabel('divLblInheritPageHeaders', {style:lblStyle, id : 'lblInheritPageHeaders'}, 'Inherit Page Headers');                            
        this.#components.inheritPageHeaders = new DropDown('divEleInheritPageHeaders', 'uh_editor_inheritHeaders', MetaData.getBoolean,
            Utils.convertBooleanToString(this.nodeElement.elementOptions.inheritPageHeaders));

        this.createLabel('divLblIgnorePageHeaders', {style:lblStyle, id : 'lblIgnorePageHeaders'}, 'Ignore Page Headers');
        this.#components.ignoreHeaders = new TextBox('divEleIgnorePageHeaders', 'uh_editor_ignoreHeader','', 
            this.nodeElement.elementOptions && this.nodeElement.elementOptions.ignoreHeaders ?
            this.nodeElement.elementOptions.ignoreHeaders.join(','): '', 'Enter comma separated values');
        document.getElementById("uh_editor_ignoreHeader").setAttribute('size', '50');    

        this.createLabel('divLblInheritPageCookies', {style:lblStyle, id : 'lblInheritPageCookies'}, 'Inherit Page Cookies');                            
        this.#components.inheritPageCookies = new DropDown('divEleInheritPageCookies', 'uh_editor_inheritCookies', MetaData.getBoolean,
            Utils.convertBooleanToString(this.nodeElement.elementOptions.inheritPageCookies));

        this.createLabel('divLblIgnorePageCookies', {style:lblStyle, id : 'lblIgnorePageCookies'}, 'Ignore Page Cookies');
        this.#components.ignoreCookies = new TextBox('divEleIgnorePageCookies', 'uh_editor_ignoreCookies','', 
            this.nodeElement.elementOptions && this.nodeElement.elementOptions.ignoreCookies ?
            this.nodeElement.elementOptions.ignoreCookies.join(','): '', 'Enter comma separated values');
        document.getElementById("uh_editor_ignoreCookies").setAttribute('size', '50');    

        this.createLabel('divLblHeaderAdditional', {style: lblStyle, id: 'lblHeaderAdditional'}, 'Additional Headers');
        this.#components.lstKeyValueHeader = new KeyValueList('divEleKeyValueHeader','param_keyValueHeader', '', Utils.getKeyValues(this.nodeElement.elementOptions, 'headers'),this.onSaveCallback.bind(this));

        this.createLabel('divLblKeyValueCookie', {style: lblStyle, id: 'lblKeyValueCookie'}, 'Additional Cookies');
        this.#components.lstKeyValueCookie = new KeyValueList('divEleKeyValuCookie','param_keyValueCookie', '',Utils.getKeyValues(this.nodeElement.elementOptions, 'cookies'),this.onSaveCallback.bind(this));

        this.createLabel('divLblKeyValueAuth', {style: lblStyleSmallParent, id: 'lblKeyValueAuth'}, 'Auth');

        this.createLabel('divLbltxtUsername', {style: lblStyleSmallParent, id: 'lbltxtUsername'}, 'Username');

        this.#components.txtUserName = new TextArea('divLbltxtUsername','uh_username', 'toolinput',
            this.nodeElement.elementOptions && this.nodeElement.elementOptions.auth && this.nodeElement.elementOptions.auth.username ? this.nodeElement.elementOptions.auth.username : "", "Enter Username",1,20,
            this.onSaveChanges.bind(this) ,null,null, this.onSaveCallback.bind(this));

       this.createLabel('divLbltxtPassword', {style: lblStyleSmallParent, id: 'lbltxtPassword'}, 'Password');
        
       this.#components.txtPassWord = new TextArea('divLbltxtPassword','uh_password', 'toolinput',
            this.nodeElement.elementOptions && this.nodeElement.elementOptions.auth && this.nodeElement.elementOptions.auth.password ? this.nodeElement.elementOptions.auth.password : "", "Enter Password",1,20,
            this.onSaveChanges.bind(this) ,null,null, this.onSaveCallback.bind(this));

       this.#components.htmlPath = new TextArea('divEleHtmlPath','divEleHtmlPathT', 'toolinput',
                this.nodeElement.apiHtmlURL ? this.nodeElement.apiHtmlURL : '', this.placeHolder,2,90,
                this.onSaveChanges.bind(this) ,null,null, this.onSaveCallback.bind(this));

        this.createButton('divEleHtmlPath', {style: btnStyle, id: 'btnIconSave' }, 'Load HTML File', { "click": this.onApplyClick.bind(this) });
        let htmlUrlInput = document.getElementById("divEleHtmlPathT");
        this.handleApplyClick();
        htmlUrlInput.addEventListener("keyup", this.handleApplyClick);

        this.createLabel('divLblRetry', {style:lblStyle3,id: 'lblRetry'}, 'Retry');
        this.#components.txtRetry= new TextBox('divEleRetry', 'uh_editor_txtRetry', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.retry? this.nodeElement.elementOptions.retry : '' ,'',null,null,null,null,'number');
       
        this.createLabel('divLblRetryDelayInMs', {style:lblStyle,id: 'lblRetryDelayInMs'}, 'Retry Delay In Ms');
        this.#components.txtRetryDelayInMs= new TextBox('divEleRetryDelayInMs', 'uh_editor_txtRetryDelayInMs', '', this.nodeElement.elementOptions && this.nodeElement.elementOptions.retryDelayInMs? this.nodeElement.elementOptions.retryDelayInMs : '' ,'',null,null,null,null,'number');

        this.createLabel('divLblPageRetryEnabled', {style:lblStyle, id: 'lblPageRetryEnabled' }, 'Page Retry Enabled');
        this.#components.pageRetryEnabled = new DropDown('divElePageRetryEnabled', 'uh_editor_pageRetryEnabled', MetaData.getBoolean,Utils.convertBooleanToString(this.nodeElement.elementOptions.pageRetryEnabled),this.disableRetryOptions.bind(this));
        
        this.createLabel('userAgentContentTypeDropdownLabel', {style:userAgentContentTypeLabelStyle, id: 'userAgentContentTypeDropdownLabel' }, 'User-Agent / Content-Type');

        this.#components['User-Agent/Content-Type'] = new DropDown(
                'divUserAgentContentTypeDropdown', 
                'userAgentContentTypeDropdown', 
                MetaData.getDefaultUserAgentAndContentType, 
                '',
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                false
        );

        this.createButton('divUserAgentContentTypeAdd', { style: addBtnStyle, id: 'btnUserAgentContentTypeAdd' }, '+',{"click": this.addUserAgentOrContentTypeOption });
        
        // Alters the API or FILE to html specific options based on the selection input.
       if(this.isApiElement){
            this.createButton('divValidateApiBtn', {style: btnStyleMiddle1, id: 'btnApiRequest' }, 'Validate API', { "click": this.onApiRequestClick.bind(this) });
            this.createLabel('divLblHtmlPath', {style: lblStyleSmallParent, id: 'divLblHtmlPath'}, 'HTML URL');

       } else {

            this.createLabel('divLblResponseFileType', {style: lblStyle, id: 'divLblResponseFileType'}, 'Response File Type');
            this.#components.responseFileType = new DropDown('divResponseFileType', 'uh_editor_responseFileType', MetaData.getResponseFileTypes,
            this.nodeElement.elementOptions.responseFileType === undefined ? "" : this.nodeElement.elementOptions.responseFileType, this.onSaveChanges.bind(this));

            this.createAccordion("divDebugOptions", {id:'divParentAccordion'}, "File Debug Options ", "accordion-content", true);

            this.createLabel('accordion-content', {style: lblAccordion, id: 'divLblProxy', class:"grid-item"}, 'Proxy');
            this.#components.proxy = new DropDown('accordion-content', 'uh_editor_divProxyOption', this.#components.proxyOptions,
                this.nodeElement.proxy === undefined ? "" : this.#components.selectedProxy, this.onSaveChanges.bind(this), "grid-item");

            this.createButton('accordion-content', {style: btnStyleMiddle, id: 'btnApiRequest'}, 'Convert to HTML File', { "click": this.onFetchFileRequest.bind(this) });

            this.createLabel('accordion-content', {style: lblAccordion1, id: 'divLblDebugFileUrl', class:"grid-item"}, 'Debug with File URL');
            this.#components.useFileUrl = new CheckBox('accordion-content', 'uh_editor_divDebugFileUrl',
                    this.nodeElement.useFileUrlDebug === undefined ? false : this.nodeElement.useFileUrlDebug, this.onSaveChanges.bind(this), null, "grid-item");

            this.createLabel('divLblHtmlPath', {style: lblStyleSmallParent, id: 'divLblHtmlPath'}, 'FILE URL');
            this._handleFileURLInput();
       }

       
       this.createLabel('divLblKeyValueData', {style: lblStyleSmallParent, id: 'lblKeyValueData'}, 'Data');
   
       this.#components.txtData = new TextArea('divEleData','uh_editor_data', 'toolinput', this.nodeElement.elementOptions && this.nodeElement.elementOptions.data ? 
            ((this.nodeElement.contentType && this.nodeElement.contentType === "json") || typeof this.nodeElement.elementOptions.data === "object") ? 
             JSON.stringify(this.nodeElement.elementOptions.data,null,'\t') : this.nodeElement.elementOptions.data : "", "",7,90, this.onSaveChanges.bind(this) ,null,null, this.onSaveChanges.bind(this));
       
       this.createLabel('divLblDataErrorMessage', {style: lblErrorMessage, id: 'lblDataErrorMessage'},'Please enter a valid json');

       this.createLabel('divLblContentType', {style: lblStyleSmallParent, id: 'divLblContentType'}, 'Content Type');

       this.#components.contentType = new DropDown('uh_editor_contentType', 'uh_editor_contentType', MetaData.getContentTypes,
       this.nodeElement.contentType === undefined ? "text" : this.nodeElement.contentType , this.onSaveChanges.bind(this));
       // Filter enabled
       this.createLabel('divLblFilterEnabled', { style: lblStyle2, id: 'lblFilterEnabled'}, 'Filter Enabled');
       this.#components.filterEnabled = new DropDown('divEleFilterEnabled', 'uh_editor_filterEnabled', MetaData.getBoolean, this.nodeElement.elementOptions && this.nodeElement.elementOptions.filterEnabled != undefined ? Utils.convertBooleanToString(this.nodeElement.elementOptions.filterEnabled): undefined);
       
       this.disableRetryOptions();
    }

    // Prepares the proxy related data to aid selection and setting during element loading.
    constructProxyDDOptions(){
        let dropDown = {};
        this.#components.proxyMap = new Map();
        this.#components.selectedProxy = '';
        MetaData.getProxyOptions().forEach(item => {
            dropDown[item.label] = (item.label);
            let data = {
                host: item.value.split(':')[0],
                port: item.value.split(':')[1] 
            }
            this.#components.proxyMap.set(item.label, data);

            if(this.nodeElement.proxy != undefined && item.value.includes(this.nodeElement.proxy.host + ':' + this.nodeElement.proxy.port)){
                this.#components.selectedProxy = item.label;
            }
        })
        this.#components.proxyOptions = dropDown;

    }
    
    /**
     * Constructs the post data while making the fetch file request.
     * @returns constructed post data
     */
    constructPostData(){

        let options = {};

        options = this.nodeElement.elementOptions;
        options.responseFileType = this.nodeElement.elementOptions.responseFileType === undefined ? undefined : this.nodeElement.elementOptions.responseFileType;

        let data = {
            "selector": this.nodeElement.useFileUrlDebug ? this.nodeElement.apiHtmlURL.trim()  != "" ? this.nodeElement.apiHtmlURL : this.nodeElement.elementSelector : this.nodeElement.elementSelector,
            "selectorType": this.nodeElement.elementSelectorType,
            "options": options,
            "proxy":this.nodeElement.proxy
        } 
        return data;
    }    
    
    /**
     * Fetches the file from source through debug utility endpoint.
     * Displays the downloaded file in the browser active tab.
     */
    onFetchFileRequest(e){

        Utils.disableEnableButton(document.getElementById("btnApiRequest"), true)
        Utils.processingLoader(true, e);
        this.apiRequestUtil.fetch("post", MetaData.getDebuggerQaUrl() + "/convert-file", "*/*", null , JSON.stringify(this.constructPostData()), true)
            .then( (responseData) => {
            if(responseData && responseData != null) {
                var currentId;
                var _openDownloadedFile = function() {
                    chrome.downloads.search({
                        limit: 1,
                        orderBy: ["-startTime"],
                      }, function(downloadItems) {
                        Utils.processingLoader(false);
                        Utils.disableEnableButton(document.getElementById("btnApiRequest"), false);
                        chrome.tabs.update(null, { url: downloadItems[0].filename });
                      });
                }

                // Once downloaded progress changes to completed,opens the file and removes the listener.
                chrome.downloads.onChanged.addListener(function onDownloadChange({id, state}) {
                    if (id === currentId && state && state.current == 'complete') {
                        chrome.downloads.onChanged.removeListener(onDownloadChange);
                        _openDownloadedFile(); }}
                );
                            
                const a = document.createElement('a');
                const file = new Blob([responseData], {type: "text/html"});
                a.href= URL.createObjectURL(file);
                let fileName = "authtool/" + this.nodeElement.elementId + ".html";
                chrome.downloads.download({ url: URL.createObjectURL(file), filename: fileName}, id => {currentId = id;});
                URL.revokeObjectURL(a.href);
            } else {
                this.showDialogBox("Unable to fetch file. Please review inputs.");
            }
        }).catch((err) => {
            Utils.processingLoader(false);
            Utils.disableEnableButton(document.getElementById("btnApiRequest"), false)
            console.log(err);
            this.showErrorDialogBox(err)
        });
    }

    /**
     * Displays the error message from the request made for api calls. (Both fetch file and validate api calls.)
     * @param {*} err - Actual error message.
     */
    showErrorDialogBox(err){
        let errorMessage = "NA";
        if(err.response && err.status != 504){
            if(err.response.split("Error -").length > 1){
                errorMessage = err.response.split("Error -")[1].split("---")[0]
            } else if(err.response.message){
                errorMessage = err.response.message;
            } else {
                errorMessage = err.response
            }
        }
        let url;
        if(!this.isApiElement){
            url = this.nodeElement.useFileUrlDebug ? this.nodeElement.apiHtmlURL.trim() != "" ? this.nodeElement.apiHtmlURL : this.nodeElement.elementSelector : this.nodeElement.elementSelector
        }
        this.showDialogBox({
            "Error Status": err.status ? err.status : "API URL not found",
            "Error Category": HTTPStatusCodes.STATUS_DESCRIPTION["CODE_" + err.status], 
            "More Information": errorMessage,
            "URL": url
        });
    }

   
    /**
     * Dynamically enables or disables the Apply button.
     */
    handleApplyClick(){

        let htmlUrlInput = document.getElementById("divEleHtmlPathT");
        let htmlUrlInputValue = htmlUrlInput.value.trim();
        let applyButton = document.getElementById("btnIconSave");

        if(htmlUrlInputValue == "" || !htmlUrlInputValue.includes(".html") || 
            (this.nodeElement && this.nodeElement.useFileUrlDebug != undefined && !this.nodeElement.useFileUrlDebug)){
            applyButton.setAttribute("disabled", "true");
            applyButton.style.backgroundColor = "#ccc";
        } else {
            applyButton.removeAttribute("disabled");
            applyButton.style.backgroundColor = "#4eb5f1"; 
        }
    }            

    /**
     * Below method makes an API call to the input selector value.
     * Capable of adding Custom Cookies and Headers to the request.
     * Can make either GET or POST requests.
     */
    onApiRequestClick(){
        
        let metadata = this._composeMetadata();

        let isJson = this.nodeElement.contentType === "json" ? true : false;

        let response = this.apiRequestUtil.fetch(this.nodeElement.elementSelectorType,
                this.nodeElement.elementSelector, "json", metadata,
                this.#components.txtData.val == "" ? "" : this.#components.txtData.val, isJson);
        
        response.then( (responseData) => {

            if(responseData && responseData != null) {
                this.showDialogBox(responseData);
            } else {
                this.showDialogBox("API Validation completed. But no response data received.");
            }

        }).catch((err) => {
            this.showErrorDialogBox(err)
        });
    }


    _composeMetadata(){

        let metadata = {
            headers : {
                ...(this.nodeElement.elementOptions.headers),
            }, 
            cookies : {
                ...(this.nodeElement.elementOptions.cookies)
            }
        };

        return metadata;
    }

    onApplyClick(){
        var htmlUrl = this.#components.htmlPath.val;
        Utils.checkAndRedirect(htmlUrl);
        this.#components.htmlPath.val = htmlUrl;
        this.onSaveChanges();
    }


    createContainerDiv() {
        const tblStyle = "height:100%";
        const colStyle = "display:inline; width: 25%; min-width: 350px; margin-left: 25px";   
        const classCol= "display: inline-block;";
        const classColEle= "display: inline-block; margin-left: 25px;";
        const classColEle2= "display: inline-block; margin-left: auto;";
        const classKeyValueList = "display: inline-block; margin-left: 25px;"
        const classChildRow = "margin-top:5px;";
        const classChildRow2 = "margin-top:15px;";
        const colStyleFile = this.isApiElement ? "display: none" : "display:inline; width: 35%; min-width: 350px; margin-left: 25px";
        const classColEleFile = this.isApiElement ? "display: none" : "display: inline-block; margin-left: 25px;";
        const element = this.isApiElement ? "divValidateApiBtn" : "divDebugOptions";

        let tblObj = {
            attr : {style : tblStyle},
            id : "tblEditorSub",
            rows: [
                {
                    attr: {style: classChildRow2},
                    col : [                         
                        { attr: {style: colStyle} , divs: [{ attr: {style: classCol, id: "divLblFilterEnabled"} }, {attr: { style: classColEle2, id: "divEleFilterEnabled"}}]},
                        ]
                },
                {
                    attr: { style: classChildRow2 },
                    col: [
                        {attr: { style: classCol }, divs: [{ attr: { style: classKeyValueList, id: element } }]}
                        // {attr: { style: classCol }, divs: [{ attr: { style: classKeyValueList, id: "divLblDebugFileUrl" } }]}                       
                    ]
                },
                {
                    attr: { style: classChildRow },
                        col: [
                            {attr: { style: classCol }, divs: [
                                { attr: { style: colStyle, id: "divLblHtmlPath" } },
                                { attr: {style: classCol, id: "divEleHtmlPath"}}
                            ]
                            }
                        ]
                },                
                {
                    attr: { style: classChildRow2 + "font-size: 15px;" },
                    col: [
                        {attr: { style: classCol }, divs: [{ attr: { style: classKeyValueList, id: "divLblKeyValueOptions" } }]}                      
                    ]
                },
                {
                    attr: { style: classChildRow2 },
                    col: [
                        {
                            attr: { style: classChildRow2 }, divs: [
                                { attr: { style: colStyleFile, id: "divLblResponseFileType" } },
                                { attr: { style: classColEleFile, id: "divResponseFileType" } },
                                { attr: { style: colStyleFile, id: "divLblProxy" } },
                                { attr: { style: classColEleFile, id: "divProxyOption" } }
                                ]
                        },
                        {
                            attr: { style: classChildRow }, divs: [
                            { attr: { style: colStyle, id: "divLblPageRetryEnabled" } },
                            { attr: { style: classColEle, id: "divElePageRetryEnabled" } },
                            { attr: {style: colStyle ,id: "divLblRetryDelayInMs"} },
                            {attr: { style: classColEle, id: "divEleRetryDelayInMs"}},
                            { attr: { style: colStyle, id: "divLblRetry" } },
                            { attr: { style: classColEle, id: "divEleRetry" } }],
                        
                        },
                        {
                            attr: { style: classChildRow }, divs: [
                                { attr: { style: colStyle, id: "divLblInheritPageHeaders" } },
                                { attr: { style: classColEle, id: "divEleInheritPageHeaders" } },
                                { attr: { style: colStyle, id: "divLblInheritPageCookies" } },
                                { attr: { style: classColEle, id: "divEleInheritPageCookies" } }],
                            
                        },

                        {
                            attr: { style: classChildRow2 }, divs: [
                                { attr: { style: colStyle, id: "divLblIgnorePageHeaders" } },
                                { attr: { style: classColEle, id: "divEleIgnorePageHeaders" } },
                                ]
                        }
                    ]
                },
                {
                    attr: { style: classChildRow2 },
                    col: [
                        {
                            attr: { style: classCol }, divs: [
                                { attr: { style: colStyle, id: "divLblIgnorePageCookies" } },
                                { attr: { style: classColEle, id: "divEleIgnorePageCookies" }}]},
                       
                    ]
                },
               
                {
                    attr: { style: classChildRow2 },
                    col: [
                        {attr: { style: classCol }, divs: [{ attr: { style: classKeyValueList, id: "divLblHeaderAdditional" } }]},
                        {
                            attr: { style: classChildRow }, divs: [
                            { attr: { style: colStyle, id: "userAgentContentTypeDropdownLabel" } },
                            { attr: { style: classColEle, id: "divUserAgentContentTypeDropdown" } },
                            { attr: {style: colStyle ,id: "divUserAgentContentTypeAdd"} },
                           ],
                        
                        },
                        {
                            attr: { style: "" }, divs: [{ attr: { style: classKeyValueList, id: "divEleKeyValueHeader" } }]
                        }
                    ]
                },
                {
                    attr: { style: classChildRow2 },
                    col: [
                        {attr: { style: classCol }, divs: [{ attr: { style: classKeyValueList, id: "divLblKeyValueCookie" } }]},
                        {
                            attr: { style: "" }, divs: [{ attr: { style: classKeyValueList, id: "divEleKeyValuCookie" } }]
                        }
                    ]
                },
                {
                    attr: { style: classChildRow2 },
                    col: [
                        {attr: { style: classCol }, divs: [{ attr: { style: classKeyValueList, id: "divLblKeyValueAuth" } }]},
                        {
                            attr: { style: "" }, divs: [
                                { attr: { style: colStyle, id: "divLbltxtUsername" }},
                                { attr: { style: colStyle, id: "divLbltxtPassword" } }
                        ]}
                    ]
                },
                {
                    attr: { style: classChildRow2 }, 
                    col: [
                        {attr: { style: classCol }, divs: [
                            { attr: { style: classColEle, id: "divLblKeyValueData" } },
                            { attr: { style: classColEle, id: "divLblContentType" } },
                            { attr: { style: classColEle, id: "uh_editor_contentType" } }
                    ]}, 
                        {attr: {style: colStyle}, divs: [{attr: {style: classCol , id: "divLblDataErrorMessage"}}] },
                        {attr: { style: classChildRow }, divs: [{ attr: { style: classKeyValueList, id: "divEleData" } }]}                        
                    ]
                }
                
            ]
            }
            let divSub = this.createTable(tblObj);

            this.mountContainerToParent(divSub);
   
    }


}