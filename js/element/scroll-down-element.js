import HarvestElement from "./HarvestElementBase.js";
import Options from "../harvest/options.js";

export default class ScrollDownElement extends HarvestElement {

    constructor(elementId, elementType, elementSelector, elementSelectorType, elementParent, elementPersist, elementOptions, elementDocumentType, extractorObj,crcObj) {

        super(elementId, elementType, elementSelector, elementSelectorType, elementParent, elementPersist, elementOptions, elementDocumentType, crcObj);

        this.createElement(extractorObj);
    }

    createElement(extractorObj) {   
      
        if (this.elementDocumentType) {
            super.addDocument(extractorObj);
        }
    }
}