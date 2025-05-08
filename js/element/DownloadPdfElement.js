import HarvestElement from "./HarvestElementBase.js";
import OnComplete from "../harvest/OnComplete.js";

export default class DownloadPdfElement extends HarvestElement {
    constructor(elementId, elementType, elementSelector, elementSelectorType, elementParent, elementPersist, elementOptions, elementDocumentType,
         elementMultiple, elementMaxIteration, elementFetchType, extractorObj, crcObj, elementOnComplete, elementPersistWithData) {

        super(elementId, elementType, elementSelector, elementSelectorType, elementParent, elementPersist, elementOptions, elementDocumentType,crcObj);
        this.elementMultiple = elementMultiple;
        this.elementMaxIteration = elementMaxIteration;
        this.elementFetchType = elementFetchType;
        this.elementOnComplete = elementOnComplete;
        this.elementPersistWithData = elementPersistWithData;
        this.createElement(extractorObj);
    }

    createElement(extractorObj) {

        if (this.elementDocumentType) {           
            super.addDocument(extractorObj);
        }

        if (this.elementMultiple) {
            super.addMultiple(this.elementMultiple, this.elementMaxIteration);
        }   

        if (this.elementOnComplete && this.elementOnComplete.goBack ) {
            let onCompleteObj = new OnComplete(this.elementOnComplete.goBack);
            this.addOnComplete(onCompleteObj);
        }

    }

    addOnComplete(onComplete) {
        this.elementOnComplete = onComplete != undefined &&  onComplete.goBack != undefined ? onComplete: undefined;
    }
}