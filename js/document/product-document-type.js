import DocumentTypeBase from "./DocumentTypeBase.js";
import Job from "../extract/Job.js";
import DocumentObj from "../harvest/DocumentObj.js";

export default class ProductDocumentType extends DocumentTypeBase {

    constructor(documentType, extractorObj)  {
        super(documentType);
        this.document = document;
        this.createDocument(extractorObj);
    }

    createDocument(extractorData) {      

        if(extractorData.product) {            
            let productData = extractorData["product"];
            let job = new Job();
            let productDocument = super.createListingDocument(productData, "", job);
            if( productDocument && productDocument.fieldArr){
                productDocument = productDocument.fieldArr;
            }
            let doc = new DocumentObj(this.documentType, productDocument);
            this.document = doc;
        } else {
            this.document = extractorData.document;
        }

    }
}