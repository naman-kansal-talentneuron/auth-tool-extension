import DocumentTypeBase from "./DocumentTypeBase.js";
import Job from "../extract/Job.js";
import DocumentObj from "../harvest/DocumentObj.js";

export default class DefaultDocumentType extends DocumentTypeBase {

    constructor(documentType, extractorObj)  {
        super(documentType);
        this.document = document;
        this.createDocument(extractorObj);
    }

    createDocument(extractorData) {      

        if(extractorData && extractorData[this.documentType]) {            
            let detailsDoc = extractorData[this.documentType];
            let job = new Job();
            let detailsDocument = super.createListingDocument(detailsDoc, "", job);
            if( detailsDocument && detailsDocument.fieldArr){
                detailsDocument = detailsDocument.fieldArr;
            }
            
            let doc = new DocumentObj(this.documentType, detailsDocument);
            this.document = doc;
        } else if(extractorData){
            this.document = extractorData.document;
        }

    }
}