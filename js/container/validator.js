import MetaData from "../config/meta-data.js";
import ShowErrDialog from '../component/showError-dialog.js'

export default class SourceDataValidator {

  validateData(authScriptObject) {

    // iterate payload nodes and create lists of - CRCFields, Extractor - listing nodes, Extractor - job nodes
    let extractorListingNodesList = [];
    let extractorJobNodesList = [];
    let extractorListingTopLevelNodesError = [];
    let isHarvesterDocumentTypeExits = false;
    let payload = authScriptObject.payload.harvestorPayloadNode;
    let prepare = authScriptObject.prepare.harvestorPrepareNode;

    //Harvester & CRC
    let validCrcList = Object.keys(MetaData.getMasterCRCFields);
    let crcFieldsErrors = { invalidfields: [], emptyfieldvalues: [] };
    let harvesterHierarchyErrors = [];
    let harvesterInvalidFields = [];
    if (payload && payload.length > 0) {

      for (let i = 0; i < payload.length; i++) {

        if( !payload[i].isvalid){
          harvesterInvalidFields.push( payload[i].elementId)
        }
        
        if (payload[i].elementDocumentType !== undefined && payload[i].document != undefined && payload[i].document.document != undefined && payload[i].elementDocumentType === "listing") {
          let document = payload[i].document.document.documentDetails;

          isHarvesterDocumentTypeExits = true;
          this.getExtractorNestedFields(document, extractorListingNodesList);
          this.getErrorsOnExtractorNestedFields(document, extractorListingTopLevelNodesError);
        }

        else if (payload[i].elementDocumentType !== undefined && payload[i].document != undefined && payload[i].document.document != undefined && payload[i].elementDocumentType === "job") {
          let document = payload[i].document.document.documentDetails;
          isHarvesterDocumentTypeExits = true;
          this.getExtractorNestedFields(document, extractorJobNodesList);
        }

        //Hierachy
        let hierachyData = MetaData.getHierarchyValidationData[payload[i].elementId];
        if( hierachyData && hierachyData != payload[i].elementParent){
          harvesterHierarchyErrors.push( `${payload[i].elementId} harvester mapped to wrong parent. Set Parent as ${hierachyData}`)
        }
        

        if (payload[i].elementCRCFields && payload[i].elementCRCFields.crcFieldsArr.length > 0) {
          let crcNodeName = payload[i].elementCRCFields.document;
          let crcFields = payload[i].elementCRCFields.crcFieldsArr;
          for (var j = 0; j < crcFields.length; j++) {

            //Validate CRC valid Fields Meta Data
            if (validCrcList.indexOf(crcFields[j].fieldName) === -1) {
              crcFieldsErrors.invalidfields.push(crcNodeName + " :: " + crcFields[j].fieldName);
            }

            //Validate Empty Values Fields
            if (!crcFields[j].fieldSelector || !crcFields[j].fieldSelectorType) {
              crcFieldsErrors.emptyfieldvalues.push(crcNodeName + " :: " + crcFields[j].fieldName);
            }
          }
        }
      }
    }

    let validExtractorList = Object.keys(MetaData.getMasterExtractorFields);
    let specificListingDocTypeExtrFields = Object.keys(MetaData.getSpecificListingDocTypeExtrFields);
    let consolidatedValidExtrFields = validExtractorList.concat(specificListingDocTypeExtrFields);

    let diffExtractorFields = [];
    let extractorConsolidatedList = extractorListingNodesList.concat(extractorJobNodesList);

    extractorConsolidatedList = extractorConsolidatedList.filter((item, index) => extractorConsolidatedList.indexOf(item) === index);

    // below differnece in the list of extractor fields need to be shown as Warning
    if (extractorConsolidatedList && extractorConsolidatedList.length > 0) {
      diffExtractorFields = extractorConsolidatedList.filter(x => !x.startsWith("$") && consolidatedValidExtrFields.indexOf(x) === -1);
    }

    // create a list of mandaory Listing Doc type extractor fields which are not in the script to be shown as error
    let mandatoryListingDocTypeExtrFields = Object.keys(MetaData.getMandatoryListingDocTypeExtrFields);
    let diffMandatoryListingDocTypeExtrFields = [];
    if (extractorListingNodesList && extractorListingNodesList.length > 0) {
      diffMandatoryListingDocTypeExtrFields = mandatoryListingDocTypeExtrFields.filter(x => extractorListingNodesList.indexOf(x) === -1);
    }


    // create a list of mandaory extractor fields which are not in the script to be shown as error
    let mandatoryExtrFieldsList = Object.keys(MetaData.getMandatoryExtractorFields);
    let diffExtractorMandatoryFields = [];
    if (extractorConsolidatedList && extractorConsolidatedList.length > 0) {
      diffExtractorMandatoryFields = mandatoryExtrFieldsList.filter(x => extractorConsolidatedList.indexOf(x) === -1);
    }

    // create a list of fields which are should be part of Listing Doc type but is present in Job Doc Type    
    let diffSpecificListingDocTypeExtrFields = [];
    if (extractorJobNodesList && extractorJobNodesList.length > 0) {
      diffSpecificListingDocTypeExtrFields = extractorJobNodesList.filter(x => specificListingDocTypeExtrFields.indexOf(x) != -1);
    }

    let harvesterError = { error: {}, warning: {} };
    let extractorError = { error: {}, warning: {} };

    this.appendErrorData(extractorError.error, "Missing mandatory fields", diffExtractorMandatoryFields);
    this.appendErrorData(extractorError.error, "Missing mandatory Listing Document type fields", diffMandatoryListingDocTypeExtrFields);
    this.appendErrorData(extractorError.error, "Other Errors", extractorListingTopLevelNodesError.length ? extractorListingTopLevelNodesError.join(". <br>") : "");
    this.appendErrorData(extractorError.warning, "Additional fields", diffExtractorFields);
    this.appendErrorData(extractorError.warning, "Fields not part of Extractor Listing Document Type", diffSpecificListingDocTypeExtrFields);
    
    this.appendErrorData(harvesterError.error, "Missing Harvester mandatory values", harvesterInvalidFields.join(", "));
    this.appendErrorData(harvesterError.error, "Missing mandatory options", isHarvesterDocumentTypeExits ? "" : "Atleast One Harvester with Document Type to be configure")
    this.appendErrorData(harvesterError.warning, "Additional CRC fields", crcFieldsErrors.invalidfields.join(', '));
    this.appendErrorData(harvesterError.warning, "Missing mandatory CRC fields values", crcFieldsErrors.emptyfieldvalues.join(', '));
    this.appendErrorData(harvesterError.warning, "Invalid Parent", harvesterHierarchyErrors.join(', '));
    let parentDialogEle = this.prepareDialogElement( null, "validatorcontainer", "");
    let isErrorExists = false;
    if( Object.keys(harvesterError.error).length || Object.keys(harvesterError.warning).length){
      let harvestorEle = this.prepareDialogElement( parentDialogEle, "harvestor", "Harvester");
      this.prepareDialogElement( harvestorEle, "error", this.getDialogBoxMessageData(harvesterError.error, "Error"));
      this.prepareDialogElement( harvestorEle, "warning", this.getDialogBoxMessageData(harvesterError.warning, "Warning"));
      isErrorExists = true;
    }

    if( Object.keys(extractorError.error).length || Object.keys(extractorError.warning).length){
      let extractorEle = this.prepareDialogElement( parentDialogEle, "extractor", "Extractor");
      this.prepareDialogElement( extractorEle, "error", this.getDialogBoxMessageData(extractorError.error, "Error"));
      this.prepareDialogElement( extractorEle, "warning", this.getDialogBoxMessageData(extractorError.warning, "Warning"));
      isErrorExists = true;
    }

    if( !isErrorExists){
      this.prepareDialogElement( parentDialogEle, "success", "All Looks Good. No issues identified.")
    }

    let dialogRenderBodyCallback = () =>{
      return parentDialogEle; 
    }

    const dialogBox = new ShowErrDialog({
      okButtonText: "OK",
      errorText: " ",
      warningText: " ",
      renderHtmlCallBack : dialogRenderBodyCallback
    }, this.clickNo.bind(this));
    dialogBox.confirm();
  }

  prepareDialogElement( parentEle, className, content){
    const elementDiv = document.createElement("div");
    elementDiv.innerHTML = content ? content : "";

    if( className){
      elementDiv.classList.add( className);
    }

    if( parentEle){
      parentEle.appendChild( elementDiv);
    }

    return elementDiv;
  }

  appendErrorData(errorObject, key, value) {
    if (value && value.length) {
      errorObject[key] = value;
    }
  }

  getDialogBoxMessageData(dataObj, typeName) {

    let errorMessage = typeName + " : <br>";

    if (!dataObj || !Object.keys(dataObj).length) {
      return "";//errorMessage + "&ensp;&ensp; N/A";
    }

    let counter = 1;
    for (let key in dataObj) {
      errorMessage += "&ensp;&ensp;" + counter + ". " + key + "<br> &ensp;&ensp;&emsp;" + dataObj[key] + "<br>";
      counter++;
    }

    return errorMessage;
  }

  //   Validator Methods   //
  getExtractorNestedFields(extractorFields, fieldCollections) {

    if (fieldCollections == null) {
      fieldCollections = [];
    }

    extractorFields.forEach(item => {
      if (item.isgroup) {
        fieldCollections.concat(this.getExtractorNestedFields(item.fields, fieldCollections));
      }
      else {
        fieldCollections.push(item.fieldName);
      }
    })
  }

  getErrorsOnExtractorNestedFields(extractorFields, fieldCollections) {

    if (fieldCollections == null) {
      fieldCollections = [];
    }

    let that = this;
    extractorFields.forEach(item => {
      if (item.isgroup) {
        fieldCollections.concat(that.getErrorsOnExtractorNestedFields(item.fields, fieldCollections));
      }
      else if (!item.isvalid && item.error && item.error.length) {
        //Collect the Extractor Filed Error Message
        fieldCollections.push(item.error);
      }
    })
  }

  clickNo() {
    // console.log("No clicked");
    return false;
  }

}