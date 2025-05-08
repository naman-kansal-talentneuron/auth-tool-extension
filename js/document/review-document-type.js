import DocumentTypeBase from "./DocumentTypeBase.js";
import Job from "../extract/Job.js";
import DocumentObj from "../harvest/DocumentObj.js";

export default class ReviewDocumentType extends DocumentTypeBase {

    constructor(documentType, extractorObj)  {
        super(documentType);
        this.document = document;
        this.createDocument(extractorObj);
    }

    createDocument(extractorData) {      

        if(extractorData.review) {            
            let reviewData = extractorData["review"];
            let job = new Job();
            let reviewDocument = super.createListingDocument(reviewData, "", job);
            if( reviewDocument && reviewDocument.fieldArr){
                reviewDocument = reviewDocument.fieldArr;
            }
            let doc = new DocumentObj(this.documentType, reviewDocument);
            this.document = doc;
        } else {
            this.document = extractorData.document;
        }

    }
}