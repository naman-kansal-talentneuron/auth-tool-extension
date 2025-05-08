import {blockList} from './Full_BlockListDomain.js';
export default class MetaData {
    static XPATH_SELECTOR_FAMILY = ["xpath","xmlxpath", "xmlxpathselector"];

    static ANNOTATABLE_ELEMENTS_LIST = ["css","css.innerhtml","xpath.innerhtml",...this.XPATH_SELECTOR_FAMILY];
    
    static get getActionTypes() {
        return {
            // Action type and Display name
            BasicElement : "Basic Element",
            SelectElement : "Select Element",
            ClickElement : "Click Element",
            LinkElement : "Link Element",
            InputTextElement : "Input Text Element",
            ScrollDownElement: "Scroll Down Element",
            ScriptElement : "Script Element",
            WaitingElement: "Waiting Element",
            FocusElement : "Focus Element",
            KeyboardEvent: "Keyboard Event",
            MouseEvent: "Mouse Event",
            APIToHTMLElement : "API To HTML Element",
            FileToHTMLElement : "File To HTML Element",
            ParamElement: "Param Element",
            BrowserToHtmlElement: "Browser To HTML Element",
            DownloadPdfElement: "Download Pdf Element"
        }

    }

    static get getPrepareDocumentType() {
        return {
            "new-child-mission" : "New Child Mission"
        }

    }

    static get getPrepareDocumentTypes(){
        return {
            "new-child-mission" : "New Child Mission",
        }
    }
    static get getDocumentTypes() {
        return {
            'listing' : "Listing",
            'job' : "Job",            
            'product-listing' : "Product Listing",            
            'category-listing' : "Category Listing",
            'population' : "Population",
            'directory' : "Directory",      
            'product' : "Product",           
            'review' : "Review",
            'details' : "Details",
            'features' : "Features",
            'pricing' : "Pricing",
            'salary' : "Salary"
        }
    }
    static get getBoolean() {
        return {
            true : "True",
            false: "False"
        }
    }

    static get getHeadlessOptions(){
        return{
            true : "True",
            false: "False",
            shell: "Shell"
        
        }
    }
    static get getResponseFileTypes() {
        return {
            pdf: "PDF",
            docx : "DOCX",
            rtf: "RTF"
        }
    }

    static get getContentTypes(){
        return {
            json : "application/json",
            text : "text/plain"
        }
    }

    //Added xml xpath mode for Selectortype
    static get getSelectorTypes() {
        return {
            css : "CSS",
            xpath : "X-Path",
            script: "Script",
            provided: "Provided",
            keyboard: "Keyboard",
            mouse: "Mouse"
        }

    }

    static get getFingerPrintType(){
        return {
            "no-fingerprint":"no-fingerprint",
            apify:"apify",
            tn:"tn"

        }
    }

    static get getApiSelectorTypes() {
        return {
            get: "Get",
            post: "Post"
        }

    }

    static get getEnvironmentList() {
        return {
            prod: "Production",
            qa: "QA"
        }
    }

    static get getResourceTypes(){
        return {
            image: "image",
            stylesheet: "stylesheet",
            script:"script",
            font:"font",
            media:"media",
            video:"video",
            xhr: "xhr - in ajax request",
            document: "document - page request"
        }
    }

    static getDebuggerEnvUrl() {
        return [{name: "Prod", value : "http://tn-uh-dbguty.tnuh.aws.talentneuron.com", isReadOnly: true},
                {name: "QA", value : "http://tn-uh-dbguty.tnuhqa.aws.talentneuron.com", isReadOnly: true},
                {name: "Custom", value : "http://tn-uh-dbguty.tnuh.aws.talentneuron.com", isReadOnly: false}]
    }

    static getPythonEvaluatorUrl(isDefault){   
        if(isDefault) 
        {
            return  "http://tn-uh-pyserver.tnuh.aws.talentneuron.com/";
        }
        else{
            return [{name: "Prod", value : "http://tn-uh-pyserver.tnuh.aws.talentneuron.com/"},
            {name: "QA", value : "http://tn-uh-pyserver.tnuhqa.aws.talentneuron.com/"}]
        }   

    }

    static getEnthiranListingUrl(){
        return "http://tn-uh-dhotools-page.tnuh.aws.talentneuron.com/get_job_fields_from_listing_rows";
    }

    static getEnthiranDetailsUrl(){
        return "http://tn-uh-dhotools-page.tnuh.aws.talentneuron.com/get_job_fields_from_listing_rows";
    }

    static getEnthiranXpathSuggestor(){
        return "http://tn-uh-dhotools-page.tnuh.aws.talentneuron.com/suggest_xpaths";
    }

    static getDebuggerQaUrl(){
        return "https://tn-uh-app1.tnapp.aws.gartner.com";
    }

    static getProxyOptions(){
        return [{"label":"Nohodo","value":"g1.nohodo.com:6401", "default":true},
                {"label":"Apify","value":"groups-GRTNR@proxy.apify.com:8000"},
                {"label":"Netnut-US","value":"gw-gartner.ntnt.io:30000"},
                {"label":"LPM-Datacenter","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:24001"},
                {"label":"LPM-US","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26004"},{"label":"LPM-UK","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26005"},{"label":"LPM-India","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26006"},{"label":"LPM-China","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26007"},{"label":"LPM-Brazil","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26008"},{"label":"LPM-Argentina","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26009"},{"label":"LPM-Australia","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26010"},{"label":"LPM-Belgium","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26011"},{"label":"LPM-France","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26012"},{"label":"LPM-Germany","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26013"},{"label":"LPM-Netherlands","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26014"},{"label":"LPM-Italy","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26015"},{"label":"LPM-Japan","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26016"},{"label":"LPM-Mexico","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26017"},{"label":"LPM-Russia","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26018"},{"label":"LPM-Saudi","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26019"},{"label":"LPM-UAE","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26020"},{"label":"LPM-Singapore","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26021"},{"label":"LPM-SouthKorea","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26022"},{"label":"LPM-Sweden","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26023"},{"label":"LPM-Turkey","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26024"},{"label":"LPM-Canada","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26025"},{"label":"LPM-SouthAfrica","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26026"},{"label":"LPM-Philippines","value":"tnuh-proxy-prod-pvt-nlb.tnuh.aws.gartner.com:26027"},{"label":"NO_PROXY","value":"localhost:0"}];
    }

    static direction = Object.freeze({UP: "Up", DOWN: "Down"});

    /**
     * checks if the selector type is annotable.
     * @param {string} selectorType 
     * @returns boolean
     */
    static isAnnotatableSelectorType(selectorType) {
        return this.ANNOTATABLE_ELEMENTS_LIST.includes(selectorType);
    }

    static isExecutableSelectorType(selectorType) {
        return (selectorType === "script")
    }
    static isProvidedType(selectorType) {
        return (selectorType == "provided")
    }

    /**
     * Gets Extractor modes as an object
     */
    static get getExtractorModes(){
        return {
            "css": "CSS",
            "xpath": "X-Path",
            "css.innerhtml": "CSS InnerHTML",
            "xpath.innerhtml": "X-Path InnerHTML",
            "xmlxpath":"XML X-Path",
            "xmlxpathselector":"XML X-Path Selector",
            "expn": "Expression",
            "expn.xpath": "Expression X-Path",
            "expn.css": "Expression CSS"          
        }
    }

    static get getFetchTypes() {
        return {
            eager: "Eager",
            lazy : "Lazy"
        }
    }

    static get getBrowserTypes() {
        return {
           chrome:"chrome",
           firefox:"firefox"
        }
    }

    static get getOptionsWaitUntil() {
        return {
            domcontentloaded: "domcontentloaded",
            load:"load",
            networkidle0:"networkidle0",
            networkidle1:"networkidle1",
            networkidle2:"networkidle2",
        }
    }

    static get getLinkElementOnCompleteOptions() {

        return {
            goBack : "false"
        }
    }
    static get getScrollDownElementOptions() {
        return {
            delay : "2000" ,
            step : ""
        }
    }

    static get getScriptElementOptions() {
        return {
            waitUntil : "domcontentloaded"
        }
    }

    static get getEngineOptions(){
        return {
            puppeteer:"puppeteer",
            "real-browser":"real-browser"
        }
    }

    static get getWaitingElementOptions() {
        return {
            delay: "1000"
        }
    }

    static get getKeyBoardEventOptions() {
        return {
            char : "",
            key : "",
            text :""
        }
    }
    static get getMouseEventOptions() {
        return {
            x:"800",
            y:"800",
            delay:"2000"
        }
    }

    static get getClickEventButtonOptions() {
        return {
            left:"left",
            right:"right",
            middle:"middle"
        }
    }

    static get getMasterCRCFields() {
        return {
            foreign_key:"foreign_key",
            title:"title",
            location:"location",
            job_poster_id:"job_poster_id",
            company:"company",
            excerpt:"excerpt",
            crc_text:"crc_text",
            uh_crc_text:"uh_crc_text",
            url:"url"
        }
    }

    static get getMasterListingDocTypeFields() {
        return {
            foreign_key:"foreign_key",
            alternate_title:"alternate_title",
            alternate_location:"alternate_location",
            alternate_job_poster_id:"alternate_job_poster_id",
            alternate_company:"alternate_company",
            excerpt:"excerpt",
            crc_text:"crc_text"
        }
    }

    static get getMasterExtractorFields() {
        return {
            address:"address",
            benefits:"benefits",
            city:"city",           
            company:"company",
            company_type:"company_type",
            contact_info:"contact_info",
            country:"country",
            description:"description",
            education:"education",
            experience:"experience",
            job_area:"job_area",
            job_poster_id:"job_poster_id",
            job_type:"job_type",
            latitude:"latitude",
            location:"location",
            location_fallback:"location_fallback",
            longitude:"longitude",
            position_volume:"position_volume",
            posting_date:"posting_date",
            posting_type:"posting_type",
            publication:"publication",
            salary:"salary",
            state:"state",
            tags:"tags",
            title:"title",
            url:"url",
            requirements:"requirements",
            zip_code:"zip_code",
            default_country:"default_country",
            is_cancelled:"is_cancelled",
            requirements:"posting_date_Str",
            result_count:"result_count",
            __selector:"__selector" ,
            foreign_key:"foreign_key"    
        }
    }

    static get getMandatoryExtractorFields() {
        return {
            description:"description",
            location:"location",
            title:"title"
        }    
    }

    static get getListingExtractorTopLevelFields() {
        return [
             { name : "result_count", error : '"result_count" field need to be outside the "job_listing" section'}
        ] 
    }

    static get getMandatoryListingDocTypeExtrFields() {
        return {
            foreign_key:"foreign_key"
        }    
    }

    static get getSpecificListingDocTypeExtrFields() {
        return {
            alternate_title:"alternate_title",
            alternate_location:"alternate_location",
            alternate_job_poster_id:"alternate_job_poster_id",
            alternate_company:"alternate_company",
            excerpt:"excerpt",
            crc_text:"crc_text",
            listing_result_content:"listing_result_content",
            _description:"_description",
        }    
    }

    static get getValidHarvestorOutParam() {
        return {            
            at_the_rate_url : "@url"            
        }    
    }

    static get getHarvestorValidateFields() {
        return ["elementSelectorType", "elementSelector", "elementType"];
    }

    static get getHierarchyValidationData(){

        return {
            "detail_link" :  "listing_page"
        }
    }
    static get getDefaultList(){
        return blockList;
    }

    static get getFileFormat(){
        return {
            xml: "xml"
        }
    }

    static get getDefaultUserAgentAndContentType() {
        return {
            "User-Agent|Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36":"User Agent - Mozilla/5.0",
            "Content-Type|application/x-www-form-urlencoded; charset=UTF-8":"Content-Type - application/x-www",
            "Content-Type|application/json":"Content-Type - application/json"
        }
    }
}