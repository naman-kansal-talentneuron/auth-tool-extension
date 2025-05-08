import HarvestElement from "./HarvestElementBase.js";

export default class SelectElement extends HarvestElement {

    constructor(elementId, elementType, elementSelector, elementSelectorType, elementParent, elementPersist, elementOptions, elementDocumentType, elementSelect, extractorObj, crcObj) {

        super(elementId, elementType, elementSelector, elementSelectorType, elementParent, elementPersist, elementOptions, elementDocumentType, crcObj);
        this.elementSelect = elementSelect;

        this.createElement(extractorObj);
    }

    createElement(extractorObj) {
        if (this.elementSelect) {
            this.addSelect(this.elementSelect);
        }
        if (this.elementDocumentType) {
            super.addDocument(extractorObj);
        }
    }

    addSelect(elementSelect) {
        this.elementSelect = elementSelect;
    }

}