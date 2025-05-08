import EditorFactory from "./editor/editor-factory.js";
import AuthScriptObjManager from "../auth-script-obj-manager.js";
import NavigationTree from '../navigationtree/NavigationTree.js'
import Utils from "../utils.js";
import AnnotateElements from "../component/annotate-elements.js";
import UHMessaging from "../component/UH_Messaging.js";
import Field from "../extract/Field.js";
import Fields from "../extract/Fields.js";
import BasicElement from "../element/BasicElement.js";
import CRCNode from "../harvest/CRCNode.js";
import CRCField from "../harvest/CRCField.js";
import ConfirmDialog from '../component/confirm-dialog.js'
import ShowErrDialog from '../component/showError-dialog.js'
import SourceDataValidator from './validator.js'
import DebuggerLauncher from '../debug-integration/debug-launcher.js'
import APIRequestUtil from "../helper/api-request-util.js";
import MetaData from "../config/meta-data.js";

export default class ProjectTab {
  constructor(path, projectName) {
    this.path = path;
    this.projectName = projectName;
    this.editorObject = null;
    this.authScriptObjManager = null;
    this.navigationTreeObj = null;
    this.annotateComponent = null;
    // this.selectedNode = null;
    UHMessaging.init(this.populateSelectedElementCallBack.bind(this), this.elementExistsForAnnotation.bind(this), this.selectedObjectPreviewCallback.bind(this),null, this.XpathSuggestorAPICallBack.bind(this));
    this.loadProjectTab();
    this.selectedNodeEle = null;
    this.sourceDataValidator = new SourceDataValidator();
    this.debuggerLauncher = new DebuggerLauncher();
    this.apiRequestUtil = new APIRequestUtil();
  }

  loadProjectTab() {


    if (!this.projectName || this.projectName == "null") {
      this.enableProjectTab(false);
      return;
    }

    this.enableProjectTab(true);

    //Step 1 Load object from file 
    this.authScriptObjManager = new AuthScriptObjManager(this.path, this.projectName);
    this.appendProjectNameToNavBar(this.authScriptObjManager.authScriptObject.source);

    //Step 2 Annotate        
    let defaultNode = this.authScriptObjManager.authScriptObject.payload.harvestorPayloadNode[0];

    let startUrl = this.authScriptObjManager.authScriptObject.startUrl;
    try {
      sessionStorage["currentTab"] == "pythonEditor" ? (sessionStorage["currentTab"] = null) : chrome.tabs.update(null, { url: startUrl }); // avoids reload of project tab from python editor.
      if (defaultNode != 'undefined' && defaultNode != null) {
        this.annotateComponent = new AnnotateElements(defaultNode.elementSelector, defaultNode.elementSelectorType, true, false, true);
        //this.editorObject = EditorFactory.createEditor("editorContainer", "StartURL", defaultNode, this.onStartURLSaveCallBack.bind(this, 0), this.onExportCallBack.bind(this),null,null);
        //this.editorObject = EditorFactory.createEditor("editorContainer", "Params", defaultNode, this.onParamsSaveCallback.bind(this, 0), this.onExportCallBack.bind(this),null,null);
        this.editorObject = EditorFactory.createEditor_v1("editorContainer", "Harvester", defaultNode, this.authScriptObjManager.authScriptObject, this.getEditorCallBackRef("Harvester"));
        //Example for CRC Node editor: this.editorObject = EditorFactory.createEditor("editorContainer", "CRCNode", defaultNode, this.onCRCNodeSaveCallBack.bind(this, 0), this.onExportCallBack.bind(this),null,null);
        // Example for CRC Field editor: this.editorObject = EditorFactory.createEditor("editorContainer", "CRCField", defaultNode, this.onCRCNodeSaveCallBack.bind(this, 0), this.onExportCallBack.bind(this), this.togglePointAndClickClick.bind(this), this.annotateElement.bind(this));
      }
    } catch (error) {
      console.log("Error while updating tabs: "+ error);
    }    
    // Step 3 Load navigation tree
    this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle, null, this.cloneNodeHandler.bind(this));

  }

  enableProjectTab(isEnable) {

    document.getElementById("empty-project").classList.add(isEnable ? "disable" : "enable");
    document.getElementById("empty-project").classList.remove(isEnable ? "enable" : "disable");

    document.getElementById("selected-project").classList.add(isEnable ? "enable" : "disable");
    document.getElementById("selected-project").classList.remove(isEnable ? "disable" : "enable");
  }

  addNodeHandler(node, type, category) {
    //Make Navigation Tree Readonly
    if (type === 'Harvester' || type === 'ExtractorGroup' || type === 'Extractor' || type === 'CRC' || type === 'CRCField' || type === 'Params') {
      this.navigationTreeObj.enableTree(false);
    }

    let errorMessage = null;
    this.selectedNodeEle = node;
    if (type === 'Harvester') {
      // Step1: get parent of new node and pass that  while creating any harvestor node,
      // if parent has extractor node then harvestor node should be added to previous parent 
      let parent = node.parentIndex === undefined || node.category === "root" || node.category === undefined ?
        'root' : (node.currentContext.document === undefined ? node.text : node.currentContext.elementId);

      let nodeElement = new BasicElement('New Harvester Node', "BasicElement", "", "", parent);
      nodeElement.setCategory(category);
      
      this.editorObject = EditorFactory.createEditor_v1("editorContainer", "Harvester", nodeElement, this.authScriptObjManager.authScriptObject, this.getEditorCallBackRef("Harvester"));
    } else if (type === 'ExtractorGroup' || type === 'Extractor') {

      // Step1: find the parent 
      let parent = node.currentContext;

      //Check Document Type is selected on parent
      let extractEnabled = parent && this.authScriptObjManager.isHarvesterEnabledForExtractor(parent);
      if (!extractEnabled) {
        errorMessage = "Please set Document Type in Harvester" + (parent ? " - '" + parent.elementId + "'" : "");
      }

      if (parent !== undefined && !errorMessage) {

        let fieldArr = this.authScriptObjManager.getExtractorParentArrObj(parent);
        // Step2: length of children: location where to put the node  
        let childIndex = fieldArr != null ? fieldArr.length : 0;

        let field = null;
        let saveCallBack = null;
        if (type === 'ExtractorGroup') {
          field = new Fields('New Extractor Group', parent, childIndex);
          //Add Default Feilds
          field.addField("__selector", "xpath", "");
          saveCallBack = this.onExtractorGroupSaveCallBack.bind(this);
        } else {
          field = new Field('New Extractor Node', 'xpath', '', parent, childIndex);
          saveCallBack = this.onExtractorSaveCallBack.bind(this);
        }

        this.editorObject = EditorFactory.createEditor("editorContainer", type, field, this.authScriptObjManager.authScriptObject, saveCallBack, this.onExportCallBack.bind(this), this.togglePointAndClickClick.bind(this), this.annotateElement.bind(this), this.onValidateCallBack.bind(this), this.navTreeUpdateCallBack.bind(this), this.onExtractorTraverseCallBack.bind(this), this.onDebugCallBack.bind(this), this.onTransformCallBack.bind(this));
      }
    } else if (type === 'CRC') {

      let parent = node.text;
      if (!this.authScriptObjManager.isCRCNodeExists(parent)) {
        let crcNode = new CRCNode('', null);
        this.editorObject = EditorFactory.createEditor("editorContainer", "CRCNode", crcNode, this.authScriptObjManager.authScriptObject, this.onCRCNodeSaveCallBack.bind(this, parent), this.onExportCallBack.bind(this), null, null, null, this.navTreeUpdateCallBack.bind(this), this.onDebugCallBack.bind(this));
      }
      else {
        errorMessage = "Already CRC Node Exists";
      }
    } else if (type === 'CRCField') {
      let parent = node.parent.text;
      let parentIndex = this.authScriptObjManager.authScriptObject.payload.harvestorPayloadNode.map(e => e.elementId).indexOf(parent);
      let crcFieldsArr = this.authScriptObjManager.authScriptObject.payload.harvestorPayloadNode[parentIndex].elementCRCFields.crcFieldsArr;
      // let childIndex = childLength - 1 > 0 ? childLength - 1 : 0;
      let childIndex = crcFieldsArr ? crcFieldsArr.length : 0;

      let crcField = new CRCField('Add CRC Field', '', 'xpath', '', 'innerText', node.currentContext);
      this.editorObject = EditorFactory.createEditor("editorContainer", "CRCField", crcField, this.getAuthManagerObj.bind(this), this.onCRCFieldSaveCallBack.bind(this, parent, childIndex), this.onExportCallBack.bind(this), this.togglePointAndClickClick.bind(this), this.annotateElement.bind(this), null, this.navTreeUpdateCallBack.bind(this), null, this.onDebugCallBack.bind(this), null);
    } else if (type === 'Params') {
      let param = {};
      this.editorObject = EditorFactory.createEditor("editorContainer", "Params", param, this.authScriptObjManager.authScriptObject, this.onParamsSaveCallback.bind(this, 0), this.onExportCallBack.bind(this), null, null, this.onValidateCallBack.bind(this), this.navTreeUpdateCallBack.bind(this),null, this.onDebugCallBack.bind(this) );
    }
    else {
      this.editorObject = EditorFactory.createEditor("editorContainer", "", null, null, null, this.onExportCallBack.bind(this), null, null, null, null, null, this.onDebugCallBack.bind(this));
    }

    if (errorMessage) {
      //Remove the Add Node Popup 
      let addNodePopup = document.getElementById('ul_cm');
      while (addNodePopup) {
        addNodePopup.remove();
        addNodePopup = document.getElementById('ul_cm');
      }

      this.navigationTreeObj.enableTree(true);
      this.showDialogBox(errorMessage, " ");

      //Recreate the Tree with new set of data
      this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle, null, this.cloneNodeHandler.bind(this));
    }
  }


  cloneNodeHandler(node, type, category) {

    if (type === 'Extractor') {

      //Make Navigation Tree Readonly
      this.navigationTreeObj.enableTree(false);
      this.selectedNodeEle = node;

      // Step1: find the parent 
      let parent = node.parent.currentContext;

      if (parent !== undefined) {

        let fieldArr = this.authScriptObjManager.getExtractorParentArrObj(parent);
        // Step2: length of children: location where to put the node  
        let childIndex = fieldArr != null ? fieldArr.length : 0;

        let field = null;
        let saveCallBack = null;

        field = new Field(node.currentContext.fieldName + '-clone', node.currentContext.fieldMode, node.currentContext.fieldValue, parent, childIndex);
        saveCallBack = this.onExtractorSaveCallBack.bind(this);

        this.editorObject = EditorFactory.createEditor("editorContainer", "Extractor", field, this.authScriptObjManager.authScriptObject, saveCallBack, this.onExportCallBack.bind(this), this.togglePointAndClickClick.bind(this), this.annotateElement.bind(this), this.onValidateCallBack.bind(this), this.navTreeUpdateCallBack.bind(this), this.onExtractorTraverseCallBack.bind(this), this.onDebugCallBack.bind(this), this.onTransformCallBack.bind(this));
        this.selectedNodeEle.selectedIndex = childIndex;
      }
    }
  }


  /**
   * @description :: Creates a new extractor node and adds it next to the caller node.
   * @param {*} parent : parent of the caller node
   * @param {*} targetIndex : index where new node will be placed.
   * @param {*} fieldName : New Field name
   */
  onTransformCallBack(parent, targetIndex, fieldName) {
    let field = new Field(fieldName, "expn", "", parent, targetIndex);
    this.editorObject = EditorFactory.createEditor("editorContainer", "Extractor", field, this.authScriptObjManager.authScriptObject, this.onExtractorSaveCallBack.bind(this), this.onExportCallBack.bind(this), this.togglePointAndClickClick.bind(this), this.annotateElement.bind(this), this.onValidateCallBack.bind(this), this.navTreeUpdateCallBack.bind(this), this.onExtractorTraverseCallBack.bind(this), this.onDebugCallBack.bind(this), this.onTransformCallBack.bind(this));
    field.parent = null; // avoids forming circular dependency while parsing the auth object.
    this.authScriptObjManager.modifyExtractorField(parent, field.index, field, true); // pushes the node to the parent to be displayed at target index.
    this.selectedNodeEle.selectedIndex = targetIndex; // Highlights the node once created.
    this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle, null, this.cloneNodeHandler.bind(this));
  }

  /**
   * @description: Pop up confirmation before deleting a node permanently.
   * @param {*} message : Information message for pop up.
   * @param {*} node : Node to be deleted.
   */
  showConfirmationDialogBox(message, node) {
    let dialogBox = new ShowErrDialog({
      okButtonText: "",
      errorText: message,
      warningText: " ",
      registerButtonGroupObject: [{ name: "Yes", isAutoClose: true, callback: this.deleteNode.bind(this, node) }, { name: "No", isAutoClose: true }]
    });

    dialogBox.confirm();
  }


  deleteNodeHandler(node, type) {
    let message = "<div style = 'color: black'> WARNING : </div>" + "<br>" + "The node will be deleted. Proceed?";
    this.showConfirmationDialogBox(message, node);
  }

  deleteNode(node) {
    node.removeChildNodes(); // Removes the child node from the navigation tree.
    this.authScriptObjManager.removeNodeFromObject(node.nodeType, node.parent.text, node.text, node);

    this.selectedNodeEle = null;
    this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle, null, this.cloneNodeHandler.bind(this));

    let rootNodeData = this.authScriptObjManager.getAuthRootNodeDataBasedOnCategory(node.category);
    let defaultNode = rootNodeData[0]; //this.authScriptObjManager.authScriptObject.payload.harvestorPayloadNode[0];
    this.editorObject = EditorFactory.createEditor_v1("editorContainer", "Harvester", defaultNode, this.authScriptObjManager.authScriptObject, this.getEditorCallBackRef("Harvester"));
  }

  onClickHandler(node, parentIndex, selectedIndex, nodeType, actualNode, selectedNode) {
    // If form is dirty the only show confirm dialog else skip
    if (this.editorObject != null && this.editorObject.isDirty) {
      this.checkDirty(this.editorObject, node, parentIndex, selectedIndex, nodeType, actualNode, selectedNode);
    } else {
      this.clickHandler(node, parentIndex, selectedIndex, nodeType, actualNode, selectedNode);
    }
  }

  clickHandler(node, parentIndex, selectedIndex, nodeType, actualNode, selectedNode1) {
    this.selectedNodeEle = actualNode;
    // highligthing the selected element
    var spans = document.getElementById('tree').getElementsByTagName('span');
    for (let i = 0; i < spans.length; i++) {
      //Skip Root Node - Prepare or Payload 
      if (spans[i].textContent != 'prepare' && spans[i].textContent != 'payload') {
        spans[i].classList.remove('node_selected');
        spans[i].classList.add('node');
      }
    }
    var span = actualNode.elementLi.getElementsByTagName("span")[0];
    if (span.textContent != 'prepare' && span.textContent != 'payload') {
      span.classList.remove('root_node');
      span.className = span.className.replace('node', 'node_selected'); //(span.className.indexOf('root_node') != -1 ? 'root_node ' : '') + 'node_selected';
    }


    // this.selectedNode = actualNode;
    // populating selected node in editor
    if (nodeType === 'Harvester') {
      let rootNodeData = this.authScriptObjManager.getAuthRootNodeDataBasedOnCategory(actualNode.category);
      let defaultNode = rootNodeData[parentIndex]; //  this.authScriptObjManager.authScriptObject.payload.harvestorPayloadNode[parentIndex];
      //this.annotateElement(node.elementSelector, node.elementSelectorType, false);
      this.editorObject = EditorFactory.createEditor_v1("editorContainer", "Harvester", defaultNode, this.authScriptObjManager.authScriptObject, this.getEditorCallBackRef("Harvester"));
    }
    else if (nodeType === 'ExtractorGroup' || nodeType === 'Extractor') {

      let parent = actualNode.parent.currentContext;

      if (!parent) {
        return;
      }

      let defaultField = null;

      if (parent.document && !parent.isgroup) {
        //Parent as Harvestor
        defaultField = parent.document.document.documentDetails[selectedIndex];
      } else {
        //Parent as Extractor Group Fields
        defaultField = parent.fields[selectedIndex];
      }

      if (defaultField) {
        defaultField.index = selectedIndex;
        defaultField.parent = parent;

        this.editorObject = EditorFactory.createEditor("editorContainer", nodeType, defaultField, this.authScriptObjManager.authScriptObject, this.onExtractorGroupSaveCallBack.bind(this), this.onExportCallBack.bind(this), this.togglePointAndClickClick.bind(this), this.annotateElement.bind(this), this.onValidateCallBack.bind(this), this.navTreeUpdateCallBack.bind(this), this.onExtractorTraverseCallBack.bind(this), this.onDebugCallBack.bind(this), this.onTransformCallBack.bind(this));
      }
    } else if (nodeType === 'CRC') {
      let obj = this.authScriptObjManager.authScriptObject.payload.harvestorPayloadNode[parentIndex];
      let defaultField = obj.elementCRCFields;

      // this.annotateElement(node.fieldValue, node.fieldMode, false);
      this.editorObject = EditorFactory.createEditor("editorContainer", "CRCNode", defaultField, this.authScriptObjManager.authScriptObject, this.onCRCNodeSaveCallBack.bind(this, obj.elementId), this.onExportCallBack.bind(this), null, null, this.onValidateCallBack.bind(this), null, null, this.onDebugCallBack.bind(this));

    } else if (nodeType === 'CRCField') {
      // this.annotateElement(node.fieldValue, node.fieldMode, false);
      let obj = this.authScriptObjManager.authScriptObject.payload.harvestorPayloadNode[parentIndex];
      let defaultField = obj.elementCRCFields.crcFieldsArr[selectedIndex];

      this.editorObject = EditorFactory.createEditor("editorContainer", "CRCField", defaultField, this.getAuthManagerObj.bind(this), this.onCRCFieldSaveCallBack.bind(this, obj.elementId, selectedIndex), this.onExportCallBack.bind(this), this.togglePointAndClickClick.bind(this), this.annotateElement.bind(this), this.onValidateCallBack.bind(this), null, null, this.onDebugCallBack.bind(this), null);
    } else if (nodeType === 'StartURL') {
      let startURL = this.authScriptObjManager.authScriptObject.startUrl;
      this.editorObject = EditorFactory.createEditor("editorContainer", "StartURL", startURL, this.authScriptObjManager.authScriptObject, this.onStartURLSaveCallBack.bind(this, 0), this.onExportCallBack.bind(this), null, null, this.onValidateCallBack.bind(this), null, null, this.onDebugCallBack.bind(this));
    } else if (nodeType === 'Params') {
      let params = this.authScriptObjManager.authScriptObject.params;
      this.editorObject = EditorFactory.createEditor("editorContainer", "Params", params, this.authScriptObjManager.authScriptObject, this.onParamsSaveCallback.bind(this, 0), this.onExportCallBack.bind(this), null, null, this.onValidateCallBack.bind(this), this.navTreeUpdateCallBack.bind(this),null, this.onDebugCallBack.bind(this));
    } else if (nodeType === 'SourceName') {
      let sourceName = this.authScriptObjManager.authScriptObject.source;
      this.editorObject = EditorFactory.createEditor("editorContainer", "SourceName", sourceName, this.authScriptObjManager.authScriptObject, this.onSourceNameSaveCallBack.bind(this, 0), this.onExportCallBack.bind(this), null, null, this.onValidateCallBack.bind(this), null, null, this.onDebugCallBack.bind(this));
    }
    else if (nodeType === 'OptionParams') {
      let options = this.authScriptObjManager.authScriptObject.options;
      this.editorObject = EditorFactory.createEditor("editorContainer", "OptionParams", options, this.authScriptObjManager.authScriptObject, this.onOptionsParamSaveCallBack.bind(this, 0), this.onExportCallBack.bind(this), null, null, this.onValidateCallBack.bind(this), null, null, this.onDebugCallBack.bind(this));
    }
    else if (nodeType === 'Settings') {
      let settings= this.authScriptObjManager.authScriptObject.settings;
      this.editorObject = EditorFactory.createEditor("editorContainer", "Settings", settings, this.authScriptObjManager.authScriptObject, this.onSettingsSaveCallBack.bind(this, 0), this.onExportCallBack.bind(this), null, null, this.onValidateCallBack.bind(this), null, null, this.onDebugCallBack.bind(this));
    }
    else {
      this.editorObject = EditorFactory.createEditor("editorContainer", "", null, null, null, this.onExportCallBack.bind(this), null, null, this.onValidateCallBack.bind(this), null, null, this.onDebugCallBack.bind(this));
    }
  }

  annotateElement(selector, selectorType, needURLUpdate, showMoreFlag, xPathSuggestorSource) {
    this.annotateComponent = new AnnotateElements(selector, selectorType, needURLUpdate, showMoreFlag, false,xPathSuggestorSource);
  }

  getEditorCallBackRef(nodeType) {

    let callBackRef = {
      onSaveCallback: null,
      onExportCallBack: this.onExportCallBack.bind(this),
      togglePointAndClickClick: this.togglePointAndClickClick.bind(this),
      onTxtSelectorChange: this.annotateElement.bind(this),
      onValidateCallBack: this.onValidateCallBack.bind(this),
      navTreeUpdateCallBack: null,
      onTraverseCallBack: null,
      onDebugCallBack: this.onDebugCallBack.bind(this),
      onTransformCallBack: null,
      getAuthManagerObj : this.getAuthManagerObj.bind(this)
    }

    if (nodeType === 'Harvester') {
      callBackRef.onSaveCallback = this.onHarvesterSaveCallBack.bind(this);
      callBackRef.onTraverseCallBack = this.onHarvesterTraverseCallBack.bind(this);
      callBackRef.navTreeUpdateCallBack = this.navTreeUpdateCallBack.bind(this);
    }

    return callBackRef;
  
  }

  getAuthManagerObj(){
    return this.authScriptObjManager;
  }

  /**
   * This function gets called by clicking the point and cut button (button present to the left of Export button).
   * @param {any} selectedElement - Array of objects of size 3 like this [{content: '...'}, {content: '...'}, {content: '...'}]
   */
  populateSelectedElementCallBack(selectedElement) {
    if (this.editorObject) {
      this.editorObject.setSelector(selectedElement);
    }
  }
  elementExistsForAnnotation(ele) {
    if (this.editorObject && this.editorObject.annotationOnComplete) {
      this.editorObject.annotationOnComplete(ele[1].content);
      this.editorObject.setPreview(ele[2].content, ele[1].content);
    }
  }
  

  XpathSuggestorAPICallBack(message)
  {   
    let listingArray=[];
    if(message[2].content.includes('&#013;&#010;&#013;&#010;')){
      listingArray = message[2].content.split('&#013;&#010;&#013;&#010;');

      if(listingArray.length > 0)
        {
          listingArray.pop();
        }
    }
    else
      listingArray.push(message[2].content);

    let base64listingArray = listingArray.map(convertToBase64);
    function convertToBase64(value) {
      return Utils.utf8ToBase64(value);
    }
   
    var inputData = {
      "page_type":message[3].content,
      "base64_pages":base64listingArray
    }

    this.postData(MetaData.getEnthiranXpathSuggestor(), inputData).then((response) => {   
      console.log(response);
      if(typeof response==="string"){
        document.getElementById('divLoading').style.display = "none"; 
        this.showDialogMessage("No XPath has been processed, the API is having some issues.",null);
      }
      else if(response!=undefined)
        this.BindExtractorGroupsAndNodes(message[3].content, response);
      else
        this.showDialogMessage("No XPath has been processed",null);

      document.getElementById('divLoading').style.display = "none";   
   });
  }

  showDialogMessage(error, warning) {
    const dialogBox = new ShowErrDialog({
        okButtonText: "OK",
        errorText: error && error.trim().length ? error : " ",
        warningText: warning && warning.trim().length ? warning : " "
    }, () => { });
    dialogBox.confirm();
   }

async postData(url = "", data = {}) {
  // Default options are marked with *
  try{
  const response = await fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached   
    headers: {
      "Content-Type": "application/json"   
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });  
  
  if (response.ok) {
      return response.json(); 
   
  }else
  {
     console.log(response);
     document.getElementById('divLoading').style.display = "none";  
     this.showDialogMessage("There was an issue in reaching Enthiran API please check the console for more information",null);
  }   
}catch (error) {
  console.log('An error occurred:', error);
  document.getElementById('divLoading').style.display = "none"; 
  this.showDialogMessage("There was an issue in reaching Enthiran API please check the console for more information",null);
  document.getElementById('divLoading').style.display = "none";  
} 
}

  BindExtractorGroupsAndNodes(pageType, nodeData){
    let editor = this.editorObject;
    if(pageType==='listing_page'){
      const current = nodeData.listing_page_xpath;
      if(current==undefined || current.listing_xpaths==undefined && current.selector_xpath==undefined){
        if(current!=undefined && current?.error!=undefined){
          this.showDialogMessage(current.error,null); 
          return;
        }
        this.showDialogMessage("No XPath has been processed",null); 
        return; }
      else if(Object.keys(current.listing_xpaths).length===0 && Object.keys(current.selector_xpath).length===0){
        console.log("Count of Fetched Listing_xpaths: "+ Object.keys(current.listing_xpaths).length);
        console.log("Count of Fetched Selector: "+ Object.keys(current.selector_xpath).length);
        this.showDialogMessage("No XPath has been processed",null); 
        return; }  
      let parent = editor.nodeElement;

      let isGroupPresent=false;
      let index=0;
      if(parent.document==undefined){
        let current = this.authScriptObjManager.authScriptObject.payload.harvestorPayloadNode
                          .findIndex(node => node.elementId==='listing_page');
        let currentAuthobj = editor.authObj.payload.harvestorPayloadNode
                          .findIndex(node => node.elementId==='listing_page');       
        this.authScriptObjManager.modifyExtractorField(parent);
        this.authScriptObjManager.authScriptObject.payload.harvestorPayloadNode[current]=parent;
        editor.authObj.payload.harvestorPayloadNode[currentAuthobj]=parent; 
      } 
      if(parent.document!=null && parent.document.document!=null){
        for(const group of parent.document.document.documentDetails){
            if(group.isgroup!=undefined && group.isgroup){

                isGroupPresent=true;

                // add extractor nodes if group already exists:
                this.BindExtractorNodes(current, group);
            }
        }     
      }
      // create new extractor group, if not exists:     
      if(!isGroupPresent){
        let group = new Fields("job_listing");
        this.BindExtractorNodes(current, group);
        if(parent.document!=undefined && parent.document.document!=undefined && parent.document.document.documentDetails!=undefined)
          index = parent.document.document.documentDetails.length;
        this.onExtractorGroupSaveCallBack(parent,index,group);
      } 
    }

    else if(pageType==='listing_rows'){
      if(nodeData==undefined || nodeData.listing_xpaths==undefined){ 
        this.showDialogMessage("No XPath has been processed",null); 
        return; }
      else if(nodeData.listing_xpaths?.error !== undefined){
        this.showDialogMessage(nodeData.listing_xpaths.error,null); 
        return; }  
      else if(Object.keys(nodeData.listing_xpaths).length==0){
        console.log("Count of Fetched Listing_xpaths: "+ Object.keys(nodeData.listing_xpaths).length);
        this.showDialogMessage("No XPath has been processed",null); 
        return; } 

        let extractorFields;
        this.setPaths(editor.fieldParentNode, extractorFields, nodeData.listing_xpaths);
    }

    else if(pageType==='posting_page'){
      if(nodeData.posting_xpaths==undefined){ 
        this.showDialogMessage("No XPath has been processed",null); 
        return; }
      else if(nodeData.posting_xpaths?.error !== undefined){
        this.showDialogMessage(nodeData.posting_xpaths.error,null); 
        return; }  
      else if(Object.keys(nodeData.posting_xpaths).length==0){
        console.log("Count of Fetched Posting_xpaths: "+ Object.keys(nodeData.posting_xpaths).length);
        this.showDialogMessage("No XPath has been processed",null); 
        return; }

        let extractorFields=[];
        let parent = editor.nodeElement;
        if(parent.document==undefined){
          let current = this.authScriptObjManager.authScriptObject.payload.harvestorPayloadNode
                            .findIndex(node => node.elementId==='detail_page');
          let currentAuthobj = editor.authObj.payload.harvestorPayloadNode
                            .findIndex(node => node.elementId==='detail_page');  
          this.authScriptObjManager.modifyExtractorField(parent);
          this.authScriptObjManager.authScriptObject.payload.harvestorPayloadNode[current]=parent;
          editor.authObj.payload.harvestorPayloadNode[currentAuthobj]=parent;
        }
        this.setPaths(parent, extractorFields, nodeData.posting_xpaths);
    }

    if (pageType === 'listing_page' && nodeData.listing_page_xpath?.listing_xpaths?.error !== undefined) {
      this.showDialogMessage(nodeData.listing_page_xpath.listing_xpaths.error, null);
    }
    this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle, null, this.cloneNodeHandler.bind(this));    
  }

  setPaths( parentNode, extractorFields, xpaths){
    for (const attribute in xpaths) {  
      if(attribute==='error'){ return; }
      if (parentNode.isgroup!=undefined && parentNode.isgroup) 
        {
          extractorFields = parentNode.fields;
        } 
        else if (parentNode.document!=undefined && (parentNode.document != null || parentNode.document.document != null))        
        { 
          // Fetch extractor fields
          extractorFields = parentNode.document.document.documentDetails;
        }

      //check for the existance of $ prefix field
      let foundField = extractorFields.find(f => f.fieldName == ("$" + attribute)); 

      if(foundField == undefined)
        {
          foundField = extractorFields.find(f => f.fieldName == (attribute));
        }
        
      if(foundField == undefined)
      {    
        const mode = attribute=='description' ? "xpath.innerhtml" : "xpath";
        let field = new Field(attribute, mode, xpaths[attribute], parentNode, extractorFields.length);
        field.parent = null; // To prevent ciruclar refference error
        this.authScriptObjManager.modifyExtractorField(parentNode, field.index, field, false); 
      } 
      else
      {
        foundField.fieldValue = xpaths[attribute];
        if(foundField.fieldMode==undefined) foundField.fieldMode="xpath";
        let foundFieldIndex = extractorFields.findIndex(f => f.fieldName == foundField.fieldName)
        this.authScriptObjManager.modifyExtractorField(parentNode, foundFieldIndex, foundField, false); 
      }             
    }
  }

  BindExtractorNodes(nodeData, parentNode)
  { 
    let extractorFields = null;
    if(nodeData.selector_xpath!=undefined){

      if (parentNode.isgroup) 
        {
          extractorFields = parentNode.fields;
        } 
        else if (parentNode.document != null || parentNode.document.document != null)        
        { 
          // Fetch extractor fields
          extractorFields = parentNode.document.document.documentDetails;
        }

      //check for the selector_path existence
      let selectorPath = extractorFields.find(f => f.fieldName == ("__selector"));
         
      if(selectorPath == undefined)
      {    
        let field = new Field("__selector", "xpath", nodeData.selector_xpath, parentNode, extractorFields.length);
        field.parent = null; // To prevent ciruclar refference error
        this.authScriptObjManager.modifyExtractorField(parentNode, field.index, field, false); 
      } 
      else
      {
        selectorPath.fieldValue = nodeData.selector_xpath;
        selectorPath.fieldMode = "xpath";
        this.authScriptObjManager.modifyExtractorField(parentNode, 0, selectorPath, false); 
      }
    }

    this.setPaths(parentNode, extractorFields, nodeData.listing_xpaths);

    // this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle, null, this.cloneNodeHandler.bind(this));    
  }

  

  selectedObjectPreviewCallback(ele, cnt) {
    if (this.editorObject) {      
      this.editorObject.setPreview(ele, cnt);
    }
  }

  togglePointAndClickClick(action, b, c) {
    if (this.annotateComponent != null && this.annotateComponent != 'undefined') {
      action == "Add" ? this.annotateComponent.appendPointAndClick() : this.annotateComponent.removePointAndClick();
    }
  }
  appendProjectNameToNavBar(name) {
    document.getElementById("sp_projectName").innerHTML = 'Project - ' + name;
  }

  onExportCallBack(e) {
    //Add Loader
    this.exportLoader(e, true);

    let fileName = this.projectName != "null" ? this.projectName : this.authScriptObjManager.authScriptObject.source;
    this.authScriptObjManager.splitUnifiedObject();
    Utils.exportFileToDownload(this.authScriptObjManager.extractorObject, fileName + '.extract');
    Utils.exportFileToDownload(this.authScriptObjManager.harvestingObject, fileName + '.harvest');
    this.authScriptObjManager.authScriptObject.customScript != "" &&
      Utils.exportFileToDownload(this.authScriptObjManager.authScriptObject.customScript, fileName + '.py', true);

    //Remove Loader after 1 sec
    setTimeout(() => { this.exportLoader(e, false) }, 1000);
  }


  onValidateCallBack() {

    this.sourceDataValidator.validateData(this.authScriptObjManager.authScriptObject);

  }

  onDebugCallBack() {
    this.authScriptObjManager.splitUnifiedObject();
    this.debuggerLauncher.launchDebugger({ ...this.authScriptObjManager });
  }

  showDialogBox(errorText, warningText) {
    const dialogBox = new ShowErrDialog({
      okButtonText: "OK",
      errorText: errorText,
      warningText: warningText
    }, this.clickNo.bind(this));
    dialogBox.confirm();
  }

  /**
   * Call back to process the traverse request of the selected node.
   */

  onHarvesterTraverseCallBack(direction, nodeElement) {
    let nodeToLoad = this.authScriptObjManager.traverseHarvesterNode(direction, nodeElement.currentIndex, nodeElement.nodeElement);
    this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle, nodeToLoad, this.cloneNodeHandler.bind(this));
    this.editorObject = EditorFactory.createEditor_v1("editorContainer", "Harvester", nodeToLoad, this.authScriptObjManager.authScriptObject, this.getEditorCallBackRef("Harvester"));
  }

  onHarvesterSaveCallBack(selectedIndex, attributes, type, modifiedNodeElement) {
    this.authScriptObjManager.modifyHarvesterNode(selectedIndex, modifiedNodeElement);
    this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle, modifiedNodeElement, this.cloneNodeHandler.bind(this));
  }

  onExtractorTraverseCallBack(direction, parent, selectedIndex, type) {
    let nodeToLoad = this.authScriptObjManager.traverseExtractorNode(direction, parent, selectedIndex);

    //Update latest index
    this.selectedNodeEle.selectedIndex = nodeToLoad.index;
    this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle, null, this.cloneNodeHandler.bind(this));
    this.editorObject = EditorFactory.createEditor("editorContainer", type, nodeToLoad, this.authScriptObjManager.authScriptObject, this.onExtractorGroupSaveCallBack.bind(this), this.onExportCallBack.bind(this), this.togglePointAndClickClick.bind(this), this.annotateElement.bind(this), this.onValidateCallBack.bind(this), this.navTreeUpdateCallBack.bind(this), this.onExtractorTraverseCallBack.bind(this), this.onDebugCallBack.bind(this), this.onTransformCallBack.bind(this));
  }

  onExtractorGroupSaveCallBack(parent, childIndex, modifiedNodeElement) {
    this.authScriptObjManager.modifyExtractorGroupField(parent, childIndex, modifiedNodeElement);
    this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle, null, this.cloneNodeHandler.bind(this));
  }

  onExtractorSaveCallBack(parent, childIndex, modifiedNodeElement) {
    this.authScriptObjManager.modifyExtractorField(parent, childIndex, modifiedNodeElement);
    this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle, null, this.cloneNodeHandler.bind(this));
  }

  onCRCNodeSaveCallBack(parent, modifiedNodeElement) {
    this.authScriptObjManager.modifyCRCNode(parent, modifiedNodeElement);
    this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle);
  }

  onCRCFieldSaveCallBack(parent, childIndex, modifiedNodeElement) {
    this.authScriptObjManager.modifyCRCField(parent, childIndex, modifiedNodeElement);
    this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle);
  }

  onStartURLSaveCallBack(parent, modifiedStartURL) {
    this.authScriptObjManager.modifyStartURL(parent, modifiedStartURL);
    this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle);
  }
  onParamsSaveCallback(parent, modifiedParam) {
    this.authScriptObjManager.modifyParam(parent, modifiedParam);
    this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle);
  }

  onSourceNameSaveCallBack(parent, modifiedSourceName) {
    this.authScriptObjManager.modifySourceName(parent, modifiedSourceName);
    this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle);
    // updating the sourcename to project tab
    this.appendProjectNameToNavBar(modifiedSourceName);
  }

  onOptionsParamSaveCallBack(parent, modifiedOptionParams) {
    this.authScriptObjManager.modifyOptionParams(parent, modifiedOptionParams);
    //this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle);
  }

  onSettingsSaveCallBack(parent, modifiedSettings) {
    this.authScriptObjManager.modifySettings(parent, modifiedSettings);
    //this.navigationTreeObj = new NavigationTree("navContainer", this.authScriptObjManager, this.onClickHandler.bind(this), this.addNodeHandler.bind(this), this.deleteNodeHandler.bind(this), this.selectedNodeEle);
 }

  navTreeUpdateCallBack() {

    //Enable the Tree for Update
    this.navigationTreeObj.enableTree(true);

  }

  exportLoader(e, active) {

    var loader = document.querySelector("#exportLoader");

    //Add dynmaic Loader to Export
    if (!loader) {
      var parent = e.target.parentNode;
      loader = document.createElement('div');
      loader.id = "exportLoader"
      parent.appendChild(loader);
    }

    if (active) {
      loader.classList.add("export-loader");
    }
    else {
      loader.classList.remove("export-loader");
    }
  }


  checkDirty(editorObject, node, parentIndex, selectedIndex, nodeType, actualNode, selectedNode) {
    // if project editor has unsaved changes then show the popup else don't

    const dialogBox = new ConfirmDialog({
      trueButtonText: "Yes",
      falseButtonText: "No",
      questionText: "You have unsaved changes. Are you sure to proceed?"

    }, this.clickYes.bind(this), this.clickNo.bind(this), node, parentIndex, selectedIndex, nodeType, actualNode, selectedNode);
    dialogBox.confirm();

  }
  clickYes(node, parentIndex, selectedIndex, nodeType, actualNode, selectedNode) {
    // if yes is clicked then handle click otherwise note the navigation tree otherwise don't
    this.clickHandler(node, parentIndex, selectedIndex, nodeType, actualNode, selectedNode);
  }
  clickNo() {
    // console.log("No clicked");
    return false;
  }
}