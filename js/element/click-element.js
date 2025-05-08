import HarvestElement from "./HarvestElementBase.js";

export default class ClickElement extends HarvestElement {
    constructor(elementId, elementType, elementSelector, elementSelectorType, elementParent, elementPersist, elementOptions, elementDocumentType, elementMultiple, elementMaxIteration, elementFetchType, elementChildFirst, extractorObj,crcObj) {

        super(elementId, elementType, elementSelector, elementSelectorType, elementParent, elementPersist, elementOptions, elementDocumentType,crcObj);

        this.elementMultiple = elementMultiple;
        this.elementMaxIteration = elementMaxIteration;
        this.elementFetchType = elementFetchType;
        this.elementChildFirst = elementChildFirst;

        this.createElement(extractorObj);
    }

    createElement(extractorObj) {


        if (this.elementMultiple) {
            super.addMultiple(this.elementMultiple, this.elementMaxIteration);
        }
        if (this.elementFetchType) {
            super.addFetchType(this.elementFetchType);
        }
        if (this.elementChildFirst) {
            super.addChildFirst(this.elementChildFirst);
        }
        if (this.elementDocumentType) {
            super.addDocument(extractorObj);
        }

    }
}