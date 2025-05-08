import DocumentTypeBase from "./DocumentTypeBase.js";
import Job from "../extract/Job.js";
import DocumentObj from "../harvest/DocumentObj.js";

export default class DirectoryDocumentType extends DocumentTypeBase {

    constructor(documentType, extractorObj)  {
        super(documentType);
        this.document = document;
        this.createDocument(extractorObj);
    }

    createDocument(extractorData) {      

        if(extractorData.directory) {            
            let directoryData = extractorData["directory"];
            let job = new Job();
            let directoryDocument = super.createListingDocument(directoryData, "", job);
            let doc = new DocumentObj(this.documentType, directoryDocument);
            this.document = doc;
        } else {
            this.document = extractorData.document;
        }

    }
}