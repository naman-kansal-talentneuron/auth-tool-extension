import DocumentTypeBase from "./DocumentTypeBase.js";
import Job from "../extract/Job.js";
import DocumentObj from "../harvest/DocumentObj.js";

export default class ProductListingDocumentType extends DocumentTypeBase {

    constructor(documentType, extractorObj)  {
        super(documentType);
        this.document = document;
        this.createDocument(extractorObj);
    }

    createDocument(extractorData) {      

        if(extractorData["product-listing"]) {            
            let productListingData = extractorData["product-listing"];
            let job = new Job();
            let prodListingDocument = super.createListingDocument(productListingData, "", job);
            if( prodListingDocument && prodListingDocument.fieldArr){
                prodListingDocument = prodListingDocument.fieldArr;
            }           
            let doc = new DocumentObj(this.documentType, prodListingDocument);
            this.document = doc;
        } else {
            this.document = extractorData.document;
        }

    }
}