import DocumentTypeBase from "./DocumentTypeBase.js";
import Job from "../extract/Job.js";
import DocumentObj from "../harvest/DocumentObj.js";

export default class PopulationDocumentType extends DocumentTypeBase {

    constructor(documentType, extractorObj)  {
        super(documentType);
        this.document = document;
        this.createDocument(extractorObj);
    }

    createDocument(extractorData) {      

        if(extractorData.population) {            
            let populationData = extractorData["population"];
            let job = new Job();
            let populationDocument = super.createListingDocument(populationData, "", job);
            let doc = new DocumentObj(this.documentType, populationDocument);
            this.document = doc;
        } else {
            this.document = extractorData.document;
        }

    }
}