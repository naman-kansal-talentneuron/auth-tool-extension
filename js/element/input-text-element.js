import HarvestElement from "./HarvestElementBase.js";

export default class InputTextElement extends HarvestElement {
    constructor(elementId, elementType, elementSelector, elementSelectorType, elementParent, elementPersist, elementOptions, elementDocumentType, elementText, extractorObj,crcObj) {

        super(elementId, elementType, elementSelector, elementSelectorType, elementParent, elementPersist, elementOptions, elementDocumentType, crcObj);
        this.elementText = elementText;

        this.createElement(extractorObj);
    }

    createElement(extractorObj) {

        if (this.elementText) {
            this.addText(this.elementText);
        }

        if (this.elementDocumentType) {
            super.addDocument(extractorObj);
        }

    }

    addText(elementText) {
        this.elementText = elementText;
    }
}