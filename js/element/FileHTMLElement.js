import HarvestElement from "./HarvestElementBase.js";
import Utils from "../utils.js";

export default class FileHTMLElement extends HarvestElement {
    constructor(elementId, elementType, elementSelector, elementSelectorType, elementParent, 
        elementPersist, elementOptions, elementDocumentType, extractorObj, crcObj, apiHtmlURL, contentType, useFileUrlDebug, proxy) {

        super(elementId, elementType, elementSelector, elementSelectorType, elementParent, 
            elementPersist, elementOptions, elementDocumentType, crcObj);
        this.elementOptions = elementOptions?elementOptions:[];
        this.apiHtmlURL = apiHtmlURL ? apiHtmlURL : "";
        this.contentType = contentType;
        this.useFileUrlDebug = useFileUrlDebug ? useFileUrlDebug : false;
        this.proxy = proxy;
     }

}