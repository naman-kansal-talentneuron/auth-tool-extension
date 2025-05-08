import ElementUtil from '../helper/element-util.js'
import ShowErrDialog from '../component/showError-dialog.js';
import DebugUtilConnector from "./debugutil-listener.js";
import MetaData from "../config/meta-data.js";
import Tree from "../component/treeview-checkbox/treeview-checkbox.js";
import Utils from "../utils.js";

export default class DebuggerLauncher {

    #component = {
        startUrl: null,
        source:null,
        options:{}, 
        environment : {},
        environmentUrl : "",
    }

    constructor(){
        this.elementUtil = new ElementUtil();
        this.debugAuthObject = {};
    }

    /**
     * Initial method invoked on click of Debug button.
     * Pop dialog box is shown
     * @param {*} authObject : A clone of original auth object.
     */
    launchDebugger(authObject){

      this.debugAuthObject = authObject;
      this.debugAuthObject.customScriptObject = authObject.authScriptObject.customScript;
      this.debugAuthObject.fileName = authObject.projectname;
      
      let dialogRenderBodyCallback = () => { return this.createDebugPopUpElements(authObject); }
  
      let dialogBox = new ShowErrDialog({
          okButtonText: "",
          errorText: " ",
          warningText: " ",
          renderHtmlCallBack : dialogRenderBodyCallback,
          registerButtonGroupObject : [{name:"Cancel", isAutoClose: true}, {name:"Launch Debugger", callback: this.launchDebuggerCallBack.bind(this), isAutoClose: true}]
      });
      
      dialogBox.confirm();
    }

    /**
     * @description: Filters the unselected Harvester payload and prepare nodes.
     * Handles removal of CRC node of the unselected nodes.
     * Removes Extractor nodes of unselected harvester nodes.
     */
    filterSelectedHarvesterNodes(){
      // Filter the PAYLOAD data and remove the unselected CRC node details.
      let nodeList = [];
      let nodeDocumentType = [];
      for(var node of this.debugAuthObject.harvestingObject.payload){
        if(this.#component.harvesterPayloadTree.selectedNodes.includes(node.id)){
          nodeList.push(node);
          node.documentType && nodeDocumentType.push(node.documentType);
        } else if(node.crc){
          // Remove the Parent CRC if the harvester node is not selected.
          this.debugAuthObject.harvestingObject.crc = this.debugAuthObject.harvestingObject.crc.filter((e) => e.document !== node.crc.document)
        }
      }
      this.ignoreUnselectedExtractorNodes(nodeDocumentType);
      this.debugAuthObject.harvestingObject.payload = nodeList;
      this.debugAuthObject.harvestingObject.crc && this.debugAuthObject.harvestingObject.crc.length === 0 && delete this.debugAuthObject.harvestingObject.crc;

      // Filter the PREPARE data if present and selected.
      nodeList = [];
      if(this.#component.harvesterPrepareTree != undefined){
        for(var node of this.debugAuthObject.harvestingObject.prepare){
          this.#component.harvesterPrepareTree.selectedNodes.includes(node.id) && nodeList.push(node);
        }
        nodeList.length === 0 ? delete this.debugAuthObject.harvestingObject.prepare : (this.debugAuthObject.harvestingObject.prepare = nodeList)
      }
    }

    /**
     * Ignores the extractor nodes of unselected Harvester nodes.
     * @param {*} selectedDocumentTypes
     */
    ignoreUnselectedExtractorNodes(selectedDocumentTypes){
      Object.keys(this.debugAuthObject.extractorObject).forEach((node) => {
        if((typeof this.debugAuthObject.extractorObject[node] === 'object') && !selectedDocumentTypes.includes(node)){
          this.debugAuthObject.extractorObject[node] = {};
        }
      })
    }

    /**
     * @description: Overrides the existing data with the data from the debug pop up.
     * Calls the debug util connector once data is modified.
     */
    launchDebuggerCallBack() {

        const startUrl = this.#component.startUrl.value;
        const options = {maxIteration : this.#component.options.maxIteration.value, delay : this.#component.options.delay.value};

        this.debugAuthObject.harvestingObject = {...this.debugAuthObject.harvestingObject, startUrl:startUrl}

        this.debugAuthObject.harvestingObject.options = {
            ...this.debugAuthObject.harvestingObject.options,
            ...(options.maxIteration != "") && { maxIteration : options.maxIteration },
            ...(options.delay != "") && { delay : options.delay }
        }

        this.#component.showTree.checked && this.filterSelectedHarvesterNodes();

        this.OnDebugUtilConnection(this.debugAuthObject);
      }

      /**
       * @description: Constructs the elements to be shown in the pop up dialog box.
       * @param {*} input : Auth object data.
       * @returns fully constructed div block with elements.
       */
      createDebugPopUpElements(input){

        const lblStyleInline = "font-size: small; display:inline; width: 10%;  font-weight: 550; padding : 10px 10px 5px 0";
        const eleStyleInline = "border-radius: 6px; padding-left: 7px; border-color: rgb(0 0 0 / 25%); display:inline; width: 70px;  font-weight: 400; margin-left:7px ; margin-top:15px; margin-right: 30px";
        const eleStyleInlineCheck = "border-radius: 6px; padding-left: -10px; border-color: rgb(0 0 0 / 25%); display:inline; width: 70px;  font-weight: 400; margin-left:-10px; margin-top:15px; margin-right: 30px";
        const eleStyleInlineEx = "border-radius: 6px; padding-left: 7px; border-color: rgb(0 0 0 / 25%); display:inline; width: 80px;  font-weight: 400; margin-left:7px ; margin-top:15px; margin-right: 30px";
        const eleStyleInline2 = "border-radius: 6px; padding-left: 7px; border-color: rgb(0 0 0 / 25%); width: 63%;  font-weight: 400; margin-left:7px ; margin-top:15px; margin-right: 30px";
        const eleStyleInlineFull = "border-radius: 6px; padding-left: 7px; border-color: rgb(0 0 0 / 25%); width: 86%;  font-weight: 400; margin-left:7px ; margin-top:15px; margin-right: 30px";
        const headerLblStyle = "width: 100%; font-size:large; text-align: center; font-weight: 900;";
        const lblStyleNewLine = "width:100%; font-size: small; display:inline; width: 10%;  font-weight: 550; padding : 10px 10px 5px 0";
        const titleStyle = "color: #0066a1; margin-bottom: 5px; font-weight: 550; margin-top: 14px;"

        const {startUrl, options} = input.harvestingObject;

        // Title Header
        let parentEle = this.elementUtil.prepareParentElement(null, "debug-container", "");
        this.elementUtil.createLabelWithElement(parentEle, { style:headerLblStyle ,id: 'lblHeader'}, 'Debug Utility Launcher');

        // URL to connect
        this.elementUtil.createLabelWithElement(parentEle, { style:lblStyleInline, id:'lblUrl'}, 'Env to connect');
        this.#component.environment = this.elementUtil.createDropdownWithElement(parentEle, { style:eleStyleInlineEx}, ["Prod", "QA", "Custom"], this.onUrlSelectionChange.bind(this))
        this.elementUtil.createLabelWithElement(parentEle, { style:lblStyleInline, id:'lblUrl'}, 'URL');
        this.#component.environmentUrl = this.elementUtil.createInputWithElement(parentEle, { style:eleStyleInline2}, "");

        // Start URL 
        this.elementUtil.createLabelWithElement(parentEle, { style:lblStyleInline ,id: 'lblStartUrl', }, 'Start URL');
        this.#component.startUrl = this.elementUtil.createInputWithElement(parentEle ,{ style:eleStyleInlineFull ,id: 'txtMaxIterations'} , startUrl );
     
        // Max Iteration
        this.elementUtil.createLabelWithElement(parentEle, { style:lblStyleNewLine ,id: 'lblMaxIterations', }, 'Max Iteration');
        this.#component.options.maxIteration = this.elementUtil.createInputWithElement(parentEle ,{ style:eleStyleInline ,id: 'txtMaxIterations', type:"number"} , options && options.maxIteration);
        
        // Delay
        this.elementUtil.createLabelWithElement(parentEle, { style:lblStyleInline ,id: 'lblDelay', }, 'Delay');
        this.#component.options.delay = this.elementUtil.createInputWithElement(parentEle ,{ style:eleStyleInline ,id: 'txtDelay', type:"number"} , options && options.delay);
       
        this.elementUtil.createLabelWithElement(parentEle, {style:"display:block;"}, "");
        // show or hide the tree.
        this.elementUtil.createLabelWithElement(parentEle, {style: titleStyle, id:"treeTitle"}, "Select Nodes");
        this.#component.showTree = this.elementUtil.createInputWithElement(parentEle ,{ style:eleStyleInlineCheck, id: 'txtAlterTree', type:"checkbox", checked:false} , "", this.showOrHideTree.bind(this));
        this.#component.showTree.checked = false;
        this.elementUtil.createLabelWithElement(parentEle, {style:"color: red; display: none", id: "error-message"}, "Please select at least one Harvester node to debug");
        // Starts next block in new line
        this.elementUtil.createLabelWithElement(parentEle, {style:"display:block;"}, "");

        this.onUrlSelectionChange();

        return parentEle;
      }

      /**
       * Creates or removes the tree view from the debugger launcher.
       */
      showOrHideTree(){
        if(this.#component.showTree.checked){
          this.debugAuthObject.harvestingObject.prepare && 
            (this.#component.harvesterPrepareTree = this.createHierarchyTree(this.getHarvesterObjectWithChildren(this.debugAuthObject.harvestingObject.prepare), "Prepare"));
            this.debugAuthObject.harvestingObject.payload && 
            (this.#component.harvesterPayloadTree = this.createHierarchyTree(this.getHarvesterObjectWithChildren(this.debugAuthObject.harvestingObject.payload), "Payload"));
        } else {
          document.getElementById("error-message").style.display = "none";
          Utils.disableEnableButton(document.getElementById("Launch Debugger"), false);
          Array.from(document.getElementsByClassName("treejs")).forEach((ele) => ele.outerHTML = "");
        }
      }

      /**
       * Forms tree view of the list of Harvester nodes. 
       * @param {*} harvesterNodes : List of Harvester nodes.
       */
      createHierarchyTree(harvesterNodes, id){
        return new Tree(".debug-container", {
          data: [{ id: id, text: id, children: harvesterNodes }],
          loaded: function () {
            this.values = [id];
          }
        }, this.onNodeClickCallBack.bind(this))
      }

      /**
       * Enables or disables the Launch debugger button
       * and displays error message if no node is selected.
       * @param {*} selectedValue : List of selected value.
       */
      onNodeClickCallBack(){
        let isNodeSelected = (this.#component.harvesterPrepareTree && this.#component.harvesterPrepareTree.selectedNodes.length > 1) || (this.#component.harvesterPayloadTree && this.#component.harvesterPayloadTree.selectedNodes.length > 1)
        if(!isNodeSelected){ document.getElementById("error-message").style.display = "inline"} else document.getElementById("error-message").style.display = "none";
        Utils.disableEnableButton(document.getElementById("Launch Debugger"), (!isNodeSelected))
      }

      /**
       * Connects to the Debug utility application and send the auth object once connection is established.
       * @param {*} authObject : Modified auth object to be sent to debug utility application.
       */
      OnDebugUtilConnection(authObject){
        let requestId =  Math.floor(Math.random()*100000)+Math.floor(Math.random()*100000);
        let URL = this.#component.environmentUrl.value + "/#/localdebug?authtoolparam=" + requestId;
        let debugWindow = window.open(URL, "_blank"); 
        DebugUtilConnector.push( debugWindow, requestId, authObject);
        debugWindow.focus();
      }

      /**
       * Sets the environment of debug utility and the respective url to connect.
       */
      onUrlSelectionChange(){
        for(var e of MetaData.getDebuggerEnvUrl()){
          if(this.#component.environment.value === e.name){
            this.#component.environmentUrl.value = e.value;
            this.#component.environmentUrl.disabled = e.isReadOnly;
            break;
          }
        }
      }

      /**
       * Forms the parent child relational object and returns the harvester object.
       * @param {auth object} data 
       * @returns harvester object with children array if present.
       */
      getHarvesterObjectWithChildren(data){
        var t = {};
        data.forEach(o => {
            Object.assign(t[o.id] = t[o.id] || {}, o);
            t[o.parent] = t[o.parent] || {};
            t[o.parent].children = t[o.parent].children || [];
            t[o.parent].children.push(t[o.id]);
        });
        return t['root'].children;
      }

}