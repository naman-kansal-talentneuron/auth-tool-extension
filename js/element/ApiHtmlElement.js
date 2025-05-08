import HarvestElement from "./HarvestElementBase.js";
import Utils from "../utils.js";

export default class APIHtmlElement extends HarvestElement {
    constructor(elementId, elementType, elementSelector, elementSelectorType, elementParent, 
        elementPersist, elementOptions, elementDocumentType, extractorObj, crcObj, apiHtmlURL, contentType) {

        super(elementId, elementType, elementSelector, elementSelectorType, elementParent, 
            elementPersist, elementOptions, elementDocumentType, crcObj);
        this.elementOptions = elementOptions?elementOptions:[];
        this.apiHtmlURL = apiHtmlURL ? apiHtmlURL : "";
        this.contentType = contentType;
        // Redirects the browser tab to URL provided at HTML URL. 
        // Ignored if provided path is same as current path or empty.
        Utils.checkAndRedirect(apiHtmlURL);

     }

}