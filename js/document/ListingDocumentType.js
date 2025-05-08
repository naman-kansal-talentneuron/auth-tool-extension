import DocumentTypeBase from "./DocumentTypeBase.js";
import JobListing from "../extract/JobListing.js";
import DocumentObj from "../harvest/DocumentObj.js";
import Fields from "../extract/Fields.js";

export default class ListingDocumentType extends DocumentTypeBase {

    constructor(documentType, extractorObj) {

        super(documentType);        
        this.createDocument(extractorObj);
    }

    createDocument(extractorData) {                

        if(extractorData && extractorData.listing) {
            let jobListingData = extractorData["listing"];
            let jobListing = new JobListing();

            let jobListingDocument = super.createListingDocument(jobListingData, "root", jobListing);

            if( jobListingDocument && jobListingDocument.fieldArr){
                jobListingDocument = jobListingDocument.fieldArr;
            }
            let doc = new DocumentObj(this.documentType, jobListingDocument);
            this.document = doc;     
        } else if (extractorData) {
            this.document = extractorData.document;     
        }
        
    }
}