import DocumentTypeBase from "./DocumentTypeBase.js";
import Job from "../extract/Job.js";
import DocumentObj from "../harvest/DocumentObj.js";

export default class CategoryListingDocumentType extends DocumentTypeBase {

    constructor(documentType, extractorObj)  {
        super(documentType);
        this.document = document;
        this.createDocument(extractorObj);
    }

    createDocument(extractorData) {      

        if(extractorData["category-listing"]) {            
            let categoryListingData = extractorData["category-listing"];
            let job = new Job();
            let categoryListingDocument = super.createListingDocument(categoryListingData, "", job);
            let doc = new DocumentObj(this.documentType, categoryListingDocument);
            this.document = doc;
        } else {
            this.document = extractorData.document;
        }

    }
}