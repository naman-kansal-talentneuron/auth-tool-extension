import HarvestElement from "./HarvestElementBase.js";


export default class ParamElement extends HarvestElement {
    constructor(elementId, elementType, elementSelector, elementSelectorType, elementParent, elementPersist, elementOptions, elementDocumentType, extractorObj, crcObj, elementValues) {

        super(elementId, elementType, elementSelector, elementSelectorType, elementParent, elementPersist, elementOptions, elementDocumentType,crcObj);
        this.elementValues = elementValues?elementValues:[];
     }

}