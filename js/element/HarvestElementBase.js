import DocumentFactory from "../document/DocumentFactory.js";
import CRCField from "../harvest/CRCField.js";
import CRCNode from "../harvest/CRCNode.js";
import MetaData from "../config/meta-data.js"
export default class HarvestElementBase {

    constructor(elementId, elementType, elementSelector, elementSelectorType, elementParent, elementPersist, elementOptions, elementDocumentType, objCRCFields, elementSelectorContextOn) {

        this.elementId = elementId;
        this.elementType = elementType;
        this.elementSelector = (elementSelector) && elementSelector.replace(/\r?\n|\r/g, "");
        this.elementSelectorType = elementSelectorType;
        this.elementSelectorContextOn = elementSelectorContextOn;
        this.elementParent = elementParent;
        this.elementPersist = elementPersist;
        this.elementOptions = elementOptions;
        this.elementDocumentType = elementDocumentType;
        this.elementCRCFields;
        this.addCRCFIelds(objCRCFields);
        this.category = ""; // Prepare or Payload
        this.isvalid = this.hasValidValues( this);
    }

    createElement() {
        // do nothing as this is abstract function
    }
    addCRCFIelds(objCRCFields) {
        if(objCRCFields && objCRCFields != null && objCRCFields.document && objCRCFields.fields){
            let crcFieldArray = [];
            for (let key in objCRCFields.fields) {                
                let obj = objCRCFields.fields[key];
                crcFieldArray.push(new CRCField(key,obj.selector, obj.selectorType, obj.selectorContextOn,obj.value, objCRCFields.document));                
            }            
            this.elementCRCFields = new CRCNode(objCRCFields.document, crcFieldArray);
        }else if(objCRCFields && objCRCFields != null && objCRCFields.document && objCRCFields.crcFieldsArr){
            this.elementCRCFields = objCRCFields;
        }
    }

    addDocument(extractorObj) {

        // create Document Type name
        let documentTypeName = this.elementDocumentType;

        let documentFactory = new DocumentFactory();
        let document = documentFactory.createDocument(documentTypeName,extractorObj);
        // super.addDocument(document);
        this.document = document;

    }
    addPersist(persist) {
        this.elementPersist = persist;
    }
   
    // addDocument(document) {
    //     this.document = document;
    // }
    addOptions(options) {
        this.elementOptions = options;
    }
    addMultiple(multiple, maxIteration) {
        this.multiple = multiple;

        if( multiple && maxIteration){
            this.maxIteration = maxIteration;
        }
    }
    addFetchType(fetchType) {
        this.fetchType = fetchType;
    }
    addChildFirst(childFirst) {
        this.childFirst = childFirst;
    }
    addNewTab(isNewTab) {
        this.isNewTab = isNewTab;
    }
    setCategory( category){
        this.category = category;
    }

    hasValidValues() {

        let emptyCheckvalidateFields = MetaData.getHarvestorValidateFields;

        if ( !emptyCheckvalidateFields) {
            return false;
        }

        let isValid = true;
        let fieldData =this;
        emptyCheckvalidateFields.forEach(fieldName => {
            if (!fieldData[fieldName] || !fieldData[fieldName].trim().length) {
                isValid = false;
            }
        });

        return isValid;
    }
}