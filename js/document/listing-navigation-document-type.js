import DocumentTypeBase from "./DocumentTypeBase.js";
import Job from "../extract/Job.js";
import DocumentObj from "../harvest/DocumentObj.js";

export default class ListingNavigationDocumentType extends DocumentTypeBase {

    constructor(documentType, extractorObj)  {
        super(documentType);
        this.document = document;
        this.createDocument(extractorObj);
    }

    createDocument(extractorData) {      

        if(extractorData["listing-navigation"]) {            
            let listingNavData = extractorData["listing-navigation"];
            let job = new Job();
            let listingNavDocument = super.createListingDocument(listingNavData, "", job);
            let doc = new DocumentObj(this.documentType, listingNavDocument);
            this.document = doc;
        } else {
            this.document = extractorData.document;
        }

    }
}