
export default class DocumentTypeBase {
        
    constructor(documentType) {
        this.documentType = documentType;
    }

    createDocument() {
        // abstract method, do nothing        
    }

    createListingDocument(listingData, parentKeyName, jobListing) {  

        for (let property in listingData) {
            
            if (listingData.hasOwnProperty(property)) {

                if( this.hasFieldProperty(listingData[property])){
                    jobListing.addField(  property, listingData[property]["mode"], listingData[property]["value"]);
                }
                else if (typeof listingData[property] == "object") {
                    parentKeyName = property;

                    let parent = jobListing.addFields( parentKeyName);

                    this.createListingDocument(listingData[property], parentKeyName, parent);                    
                }
            }
            else{
                console.log( 'No Data');
            }
        }
        
        return jobListing;
    }


    hasFieldProperty( listingData){
        return listingData["mode"] && listingData["value"];
    }

    addDocument(document) {
        this.document = document;
    }
}