import DocumentTypeBase from "./DocumentTypeBase.js";
import Job from "../extract/Job.js";
import DocumentObj from "../harvest/DocumentObj.js";

export default class JobNavigationDocumentType extends DocumentTypeBase {

    constructor(documentType, extractorObj)  {
        super(documentType);
        this.document = document;
        this.createDocument(extractorObj);
    }

    createDocument(extractorData) {      

        if(extractorData["job-navigation"]) {            
            let jobNavData = extractorData["job-navigation"];
            let job = new Job();
            let jobNavDocument = super.createListingDocument(jobNavData, "", job);
            let doc = new DocumentObj(this.documentType, jobNavDocument);
            this.document = doc;
        } else {
            this.document = extractorData.document;
        }

    }
}