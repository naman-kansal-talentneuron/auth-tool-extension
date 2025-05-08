import ListingDocumentType from "./ListingDocumentType.js";
import JobDocumentType from "./JobDocumentType.js";
import DefaultDocumentType from "./default-document-type.js";

export default class DocumentFactory {

    createDocument(documentType, extractorObj) {

        switch (documentType) {

            case "listing":
                return new ListingDocumentType(documentType, extractorObj);

            case "job":
                return new JobDocumentType(documentType, extractorObj);
            // Creating documenttype for new-child-mission in prepare harvestor node
            case "new-child-mission":
                return null; 
            
            default :
                return new DefaultDocumentType(documentType, extractorObj);

        }
    }
}