import DocumentTypeBase from "./DocumentTypeBase.js";
import Job from "../extract/Job.js";
import DocumentObj from "../harvest/DocumentObj.js";

export default class JobDocumentType extends DocumentTypeBase {

    constructor(documentType, extractorObj)  {
        super(documentType);
        this.document;
        this.createDocument(extractorObj);
    }

    createDocument(extractorData) {      

        if(extractorData && extractorData.job) {            
            let jobData = extractorData["job"];
            let job = new Job();
            let jobDocument = super.createListingDocument(jobData, "", job);
            if( jobDocument && jobDocument.fieldArr){
                jobDocument = jobDocument.fieldArr;
            }
            
            let doc = new DocumentObj(this.documentType, jobDocument);
            this.document = doc;
        } else if(extractorData){
            this.document = extractorData.document;
        }

    }
}