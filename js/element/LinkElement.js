import HarvestElement from "./HarvestElementBase.js";
import OnComplete from "../harvest/OnComplete.js";


export default class LinkElement extends HarvestElement {
    constructor(elementId, elementType, elementSelector, elementSelectorType, elementParent, elementPersist, elementOptions, elementDocumentType, elementNewTab, elementOnComplete, extractorObj, crcObj) {

        super(elementId, elementType, elementSelector, elementSelectorType, elementParent, elementPersist, elementOptions, elementDocumentType,crcObj);
        this.elementNewTab = elementNewTab;
        this.elementOnComplete = elementOnComplete;

        this.createElement(extractorObj);
    }

    createElement(extractorObj) {


        if (this.elementNewTab) {
            this.addNewTab(this.elementNewTab);
        }
        if (this.elementOnComplete && this.elementOnComplete.goBack ) {
            let onCompleteObj = new OnComplete(this.elementOnComplete.goBack);
            this.addOnComplete(onCompleteObj);
        }

        if (this.elementDocumentType) {
            super.addDocument(extractorObj);
        }
    }

    addNewTab(isNewTab) {
        this.isNewTab = isNewTab;
    }
    addOnComplete(onComplete) {
        this.elementOnComplete = onComplete != undefined &&  onComplete.goBack != undefined ? onComplete: undefined;
    }

}
