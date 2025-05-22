// File: extension/js/auth-script-obj-manager.js
// This is the ES6 class version provided by the user.
// Refactored to use File System Access API via selectedDirectoryHandle and Utils.

import Harvestor from "./harvest/Harvestor.js";
import Proxy from "./proxy/Proxy.js";
import Payload from "./payload/Payload.js";
import Prepare from "./prepare/prepare.js";
import ElementFactory from "./element/ElementFactory.js";
import Utils from './utils.js'; 
import HarvesterConfigPayload from "./harvest/harvester-config-payload.js";
import ExtractorConfigPayload from "./extract/extractor-config-payload.js";
import MetaData from "./config/meta-data.js";


export default class AuthScriptObjManager {

    AUTH_SESSION_OBJECT_NAME = "authScriptObject";

    constructor(directoryHandle, projectname) {
        this.directoryHandle = directoryHandle; 
        this.projectname = projectname;
        this.authScriptObject = null; 
        this.harvestingObject = null;
        this.extractorObject = null;
        // Do NOT call getUHAuthScriptObject() or init() here.
    }

    async init() {
        let localObject = this.getUHAuthObjectFromStorage(); 
        const isNewProject = sessionStorage["newProject"] != 'undefined' 
                                && sessionStorage["newProject"] != null 
                                && sessionStorage["newProject"] != "null";

        if (localObject != undefined && localObject != null) {
            this.authScriptObject = localObject;
            if (this.authScriptObject.customScript && this.authScriptObject.customScript.length > 0 && this.directoryHandle) {
                const scriptFileName = `${this.projectname}.py`; 
                const scriptExists = await Utils.readFileContent(this.directoryHandle, `scripts/${scriptFileName}`);
                if (scriptExists === null) {
                     console.warn(`Custom script for ${this.projectname} was in localStorage but not found in selected directory. Clearing script content.`);
                     this.authScriptObject.customScript = "";
                     this.setUHAuthObjectToStorage(); 
                }
            }
        } else if (isNewProject && !(await this.checkIfHarvesterAndExtractorTemplateFilesExist())) { 
            this.getDefaultUHAuthScriptObject(); 
        } else {
            const projectNameToLoad = isNewProject ? 'template' : this.projectname;
            try {
                let { harvestObj, extractObj } = await this.getHarvestAndExtractObjects(projectNameToLoad); 
                
                if(isNewProject) {
                    this.setSourceNameAndStartURL(harvestObj, extractObj);
                    if(await this.checkIfCustomScriptTemplateFileExists()) { 
                        sessionStorage["customScriptAvailable"] = "true";
                    } else {
                        sessionStorage["customScriptAvailable"] = "false";
                    }
                }

                this.translateJsonToElement(harvestObj, extractObj); 
                await this.setCustomScriptObj(projectNameToLoad); 
            } catch (error) {
                console.error(`Error initializing AuthScript object for project "${projectNameToLoad}" from directory:`, error);
                alert(`Error loading project files for "${projectNameToLoad}". Falling back to default empty project. Error: ${error.message}`);
                this.getDefaultUHAuthScriptObject(); 
            }
        }
       
        if (!this.authScriptObject) {
            console.warn("AuthScriptObject is still null after init attempts, setting default.");
            this.getDefaultUHAuthScriptObject();
        }
        // Final save after all initialization attempts
        this.setUHAuthObjectToStorage();
    }

    async checkIfHarvesterAndExtractorTemplateFilesExist() {
        if (!this.directoryHandle) return false;
        const harvesterContent = await Utils.readFileContent(this.directoryHandle, "harvester/template.harvest");
        const extractorContent = await Utils.readFileContent(this.directoryHandle, "extractor/template.extract");
        return harvesterContent !== null && extractorContent !== null;
    }

    async checkIfCustomScriptTemplateFileExists() {
        if (!this.directoryHandle) return false;
        const scriptContent = await Utils.readFileContent(this.directoryHandle, "scripts/template.py");
        return scriptContent !== null;
    }

    setSourceNameAndStartURL(harvestObj, extractObj) {
        if (harvestObj) {
            harvestObj.source = sessionStorage["newProject"];
            harvestObj.startUrl = sessionStorage["newStartUrl"];
        }
        if (extractObj) {
            extractObj.source = sessionStorage["newProject"];
        }
    }

    getDefaultUHAuthScriptObject() {
        let harvestObj = this.createDefaultHarvestObj(sessionStorage["newProject"] || this.projectname, sessionStorage["newStartUrl"], "html", "default", "", [], []);
        let extractObj = this.createDefaultExtractorObj();
        this.translateJsonToElement(harvestObj, extractObj); 
        if (this.authScriptObject) { 
            this.authScriptObject.customScript = ""; 
        }
        // Removed setUHAuthObjectToStorage() as init() will handle it.
    }

    async getHarvestAndExtractObjects(projectName) {
        if (!this.directoryHandle) {
            console.error("getHarvestAndExtractObjects: directoryHandle is not set.");
            throw new Error("Project directory not selected.");
        }
        const harvesterPath = `harvester/${projectName}.harvest`;
        const extractorPath = `extractor/${projectName}.extract`;

        const harvestContent = await Utils.readFileContent(this.directoryHandle, harvesterPath);
        if (harvestContent === null) throw new Error(`Failed to read ${harvesterPath}`);
        const harvestObj = JSON.parse(harvestContent);
        
        const extractContent = await Utils.readFileContent(this.directoryHandle, extractorPath);
        if (extractContent === null) throw new Error(`Failed to read ${extractorPath}`);
        const extractObj = JSON.parse(extractContent);

        return { harvestObj, extractObj };
    }

    async setCustomScriptObj(projectName){
        let customScript = "";
        const scriptFileName = `${projectName}.py`;
        const scriptPath = `scripts/${scriptFileName}`;
       
        if (!this.directoryHandle) {
             console.warn("setCustomScriptObj: directoryHandle is not set. Cannot load custom script.");
        } else {
             try {
                 const scriptContent = await Utils.readFileContent(this.directoryHandle, scriptPath);
                 if (scriptContent !== null) {
                     customScript = scriptContent;
                     sessionStorage["customScriptAvailable"] = "true"; 
                 } else {
                     sessionStorage["customScriptAvailable"] = "false";
                 }
             } catch (error) {
                 console.warn(`Could not fetch custom script from "${scriptPath}":`, error);
                 sessionStorage["customScriptAvailable"] = "false";
             }
        }

        if (!this.authScriptObject) {
            console.warn("authScriptObject is not initialized in setCustomScriptObj. Creating a default.");
            this.getDefaultUHAuthScriptObject(); 
        }
        this.authScriptObject.customScript = customScript;
        // this.setUHAuthObjectToStorage(); // Let init() handle final storage
    }

    getUHAuthObjectFromStorage(){
        try {
            const storedItem = window.localStorage.getItem( this.AUTH_SESSION_OBJECT_NAME + "-" + this.projectname);
            return storedItem ? JSON.parse(storedItem) : null;
        } catch (e) {
            console.error("Error parsing auth object from localStorage:", e);
            return null; // Return null on parsing error
        }
    }

    setUHAuthObjectToStorage(){       
        if (this.authScriptObject && this.projectname) {
            try {
                window.localStorage.setItem( this.AUTH_SESSION_OBJECT_NAME  + "-" + this.projectname , JSON.stringify(this.authScriptObject));
            } catch (e) {
                console.error("Error stringifying or setting auth object to localStorage:", e);
                alert("Warning: Could not save project changes to local storage. Storage might be full or corrupted.");
            }
        } else {
            console.warn("Attempted to save null or undefined authScriptObject, or projectname is missing.");
        }
    }

    translateJsonToElement(harvesterObj, extractorObj) {
        if (!harvesterObj) {
            console.error("translateJsonToElement: harvesterObj is undefined. Cannot proceed.");
            this.authScriptObject = new Harvestor(this.projectname, new Proxy("default", ""), "html", "", new Payload([]), {}, new Prepare([]), {}, {});
            // this.setUHAuthObjectToStorage(); // Let init() handle storage
            return;
        }

        let isValidInput = this.validateInput(harvesterObj);
        if (isValidInput) {
            this.createandPopulateHarvest(harvesterObj, extractorObj);
        } else {
            console.warn("translateJsonToElement: Input harvesterObj is not valid. Using default script object.", harvesterObj);
            this.getDefaultUHAuthScriptObject(); // Fallback if validation fails
        }
    }

    getAuthRootNodeDataBasedOnCategory(category) {
        if (!this.authScriptObject) return []; 
        if (category && category === "prepare") { 
            return this.authScriptObject.prepare.harvestorPrepareNode;
        }
        return this.authScriptObject.payload.harvestorPayloadNode;
    }

    setAuthNodeDataBasedOnCategory(rootData, category) {
        if (!this.authScriptObject) return;
        if (category && category === "prepare") {
            this.authScriptObject.prepare.harvestorPrepareNode = rootData;
            return;
        }
        this.authScriptObject.payload.harvestorPayloadNode = rootData;
    }

    traverseHarvesterNode(directionToMove, selectedIndex, nodeElement){
        if (!this.authScriptObject || !nodeElement) return null;

        let harvesterNodes = (nodeElement.category === "prepare") ? 
                             this.authScriptObject.prepare.harvestorPrepareNode :
                             this.authScriptObject.payload.harvestorPayloadNode;

        if (!Array.isArray(harvesterNodes) || selectedIndex < 0 || selectedIndex >= harvesterNodes.length) {
            console.error("Invalid selectedIndex or harvesterNodes for traversal.", selectedIndex, harvesterNodes);
            return null;
        }
        
        const parentOfSelected = harvesterNodes[selectedIndex].elementParent;
        let siblingNodesIndices = [];
        for(let i=0; i < harvesterNodes.length; i++) {
            if(harvesterNodes[i].elementParent === parentOfSelected) {
                siblingNodesIndices.push(i);
            }
        }

        if (siblingNodesIndices.length <= 1) return harvesterNodes[selectedIndex]; // No siblings to swap with

        const currentPositionInSiblings = siblingNodesIndices.indexOf(selectedIndex);
        let newTargetGlobalIndex = -1;

        if (directionToMove === MetaData.direction.UP) {
            if (currentPositionInSiblings > 0) {
                newTargetGlobalIndex = siblingNodesIndices[currentPositionInSiblings - 1];
            }
        } else { // DOWN
            if (currentPositionInSiblings < siblingNodesIndices.length - 1) {
                newTargetGlobalIndex = siblingNodesIndices[currentPositionInSiblings + 1];
            }
        }
        
        if (newTargetGlobalIndex !== -1 && newTargetGlobalIndex !== selectedIndex) {
            [harvesterNodes[newTargetGlobalIndex], harvesterNodes[selectedIndex]] = 
                [harvesterNodes[selectedIndex], harvesterNodes[newTargetGlobalIndex]];
            
            const reshuffled = this.reShufflePayload(harvesterNodes); 

            if(nodeElement.category === "prepare"){
                this.authScriptObject.prepare.harvestorPrepareNode = reshuffled;
            } else {
                this.authScriptObject.payload.harvestorPayloadNode = reshuffled;
            }
            this.setUHAuthObjectToStorage();
            return reshuffled.find(el => el.elementId === nodeElement.elementId);
        }
        return harvesterNodes[selectedIndex]; 
    }
    
    traverseExtractorNode(directionToTraverse, parent, selectedIndex){
        if (!parent || !Array.isArray(parent.fields) && !(parent.document && parent.document.document && Array.isArray(parent.document.document.documentDetails))) { 
            console.warn("traverseExtractorNode: Invalid parent or no fields array.", parent);
            return null; 
        }

        let extractorFields = parent.isgroup ? parent.fields : (parent.document && parent.document.document ? parent.document.document.documentDetails : null);

        if (!extractorFields || extractorFields.length === 0 || selectedIndex < 0 || selectedIndex >= extractorFields.length) {
            console.warn("traverseExtractorNode: No extractor fields or invalid selectedIndex.", extractorFields, selectedIndex);
            return null;
        }

        let newTargetIndex = -1;
        if (directionToTraverse === MetaData.direction.UP) {
            if (selectedIndex > 0) newTargetIndex = selectedIndex - 1;
        } else { // DOWN
            if (selectedIndex < extractorFields.length - 1) newTargetIndex = selectedIndex + 1;
        }

        if (newTargetIndex !== -1 && newTargetIndex !== selectedIndex) {
            [extractorFields[newTargetIndex], extractorFields[selectedIndex]] = 
                [extractorFields[selectedIndex], extractorFields[newTargetIndex]];
            
            extractorFields[newTargetIndex].index = newTargetIndex;
            extractorFields[selectedIndex].index = selectedIndex;
            
            this.setUHAuthObjectToStorage();
            return { ...extractorFields[newTargetIndex], parent }; 
        }
        return { ...extractorFields[selectedIndex], parent };
    }

    saveCustomScript(script){
        if (!this.authScriptObject) {
             console.error("Cannot save custom script: authScriptObject is not initialized.");
             return;
        }
        this.authScriptObject.customScript = script;
        this.setUHAuthObjectToStorage();
    }

    modifyHarvesterNode(selectedIndex, modifiedNodeElement) {
        if (!this.authScriptObject || !modifiedNodeElement) return;

        let authRootNodeData = this.getAuthRootNodeDataBasedOnCategory(modifiedNodeElement.category);
        if (!Array.isArray(authRootNodeData) || selectedIndex < 0 || selectedIndex >= authRootNodeData.length) {
            console.error("modifyHarvesterNode: Invalid selectedIndex or authRootNodeData.", selectedIndex, authRootNodeData);
            return;
        }
        authRootNodeData[selectedIndex] = modifiedNodeElement;
        let payloadWithUpdatedParent = this.reShufflePayload(authRootNodeData); 
        
        this.setAuthNodeDataBasedOnCategory(payloadWithUpdatedParent, modifiedNodeElement.category);
        this.setUHAuthObjectToStorage();
    }

    modifyExtractorGroupField(parent, childIndex, modifiedFieldElement) {
        this.modifyExtractorField(parent, childIndex, modifiedFieldElement);
    }

    modifyExtractorField(parent, childIndex, modifiedFieldElement, isTransform = false) {
        if (!parent || modifiedFieldElement === undefined) { 
            console.warn("modifyExtractorField: Invalid parent or modifiedFieldElement.", parent, modifiedFieldElement);
            return;
        }

        let targetArray;
        if (parent.isgroup) {
            if (!Array.isArray(parent.fields)) parent.fields = []; 
            targetArray = parent.fields;
        } else if (parent.document && parent.document.document) {
            if (!Array.isArray(parent.document.document.documentDetails)) parent.document.document.documentDetails = [];
            targetArray = parent.document.document.documentDetails;
        } else if (parent.elementDocumentType) { 
             parent.document = parent.document || {};
             parent.document.document = parent.document.document || {};
             parent.document.document.documentDetails = parent.document.document.documentDetails || [];
             targetArray = parent.document.document.documentDetails;
        } else {
            console.error("modifyExtractorField: Parent structure is not recognized for field modification.", parent);
            return;
        }
        
        if (childIndex === undefined || childIndex === null || childIndex < 0) { 
            modifiedFieldElement.index = targetArray.length;
            targetArray.push(modifiedFieldElement);
        } else if (isTransform) {
            this.insertTransformedNode(targetArray, childIndex, modifiedFieldElement);
        } else {
            if (childIndex < targetArray.length) {
                targetArray[childIndex] = modifiedFieldElement;
            } else { 
                modifiedFieldElement.index = targetArray.length;
                targetArray.push(modifiedFieldElement);
            }
        }

        if (modifiedFieldElement && String(modifiedFieldElement.fieldName).toLowerCase() === '__selector') {
            const currentSelectorIndex = targetArray.findIndex(f => String(f.fieldName).toLowerCase() === '__selector');
            if (currentSelectorIndex > 0) { 
                const selectorElement = targetArray.splice(currentSelectorIndex, 1)[0];
                selectorElement.index = 0; 
                targetArray.unshift(selectorElement); 
                for (let i = 1; i < targetArray.length; i++) {
                    targetArray[i].index = i;
                }
            }
        }
        this.setUHAuthObjectToStorage();
    }

    insertTransformedNode(childNodes, targetIndex, node){
        if (!Array.isArray(childNodes) || targetIndex < 0) return;
        node.index = targetIndex; 
        childNodes.splice(targetIndex, 0, node);
        for(var i = targetIndex + 1; i < childNodes.length ; i++) { 
            childNodes[i].index = i; 
        }
    }

    modifyCRCNode(parentName, modifiedCRCNodeData) {
        if (!this.authScriptObject || !this.authScriptObject.payload || !Array.isArray(this.authScriptObject.payload.harvestorPayloadNode)) return;
        
        const parentIndex = this.authScriptObject.payload.harvestorPayloadNode.findIndex(item => item.elementId === parentName);
        if (parentIndex === -1) {
            console.error("modifyCRCNode: Parent harvester node not found:", parentName);
            return;
        }
        
        const parentElement = this.authScriptObject.payload.harvestorPayloadNode[parentIndex];
        
        if (modifiedCRCNodeData && Array.isArray(modifiedCRCNodeData.crcFieldsArr)) {
            modifiedCRCNodeData.crcFieldsArr.forEach(field => {
                field.fieldParent = modifiedCRCNodeData.document; 
            });
        } else if (modifiedCRCNodeData) {
            modifiedCRCNodeData.crcFieldsArr = []; 
        }
        
        parentElement.elementCRCFields = modifiedCRCNodeData;
        this.setUHAuthObjectToStorage();
    }

    modifyCRCField(parentHarvesterNodeName, crcFieldIndex, modifiedCRCFieldElement) {
        if (!this.authScriptObject || !this.authScriptObject.payload || !Array.isArray(this.authScriptObject.payload.harvestorPayloadNode)) return;

        const parentHarvesterNodeIndex = this.authScriptObject.payload.harvestorPayloadNode.findIndex(item => item.elementId === parentHarvesterNodeName);
        if (parentHarvesterNodeIndex === -1) {
            console.error("modifyCRCField: Parent harvester node not found:", parentHarvesterNodeName);
            return;
        }

        const parentHarvesterNode = this.authScriptObject.payload.harvestorPayloadNode[parentHarvesterNodeIndex];
        if (!parentHarvesterNode.elementCRCFields) {
            console.warn("modifyCRCField: Parent harvester node does not have elementCRCFields. Initializing.", parentHarvesterNodeName);
            parentHarvesterNode.elementCRCFields = { document: "CRC_" + parentHarvesterNodeName, crcFieldsArr: [] };
        }
        if (!Array.isArray(parentHarvesterNode.elementCRCFields.crcFieldsArr)) {
            parentHarvesterNode.elementCRCFields.crcFieldsArr = [];
        }

        const targetArray = parentHarvesterNode.elementCRCFields.crcFieldsArr;
        if (crcFieldIndex === undefined || crcFieldIndex === null || crcFieldIndex < 0 || crcFieldIndex > targetArray.length) { 
            modifiedCRCFieldElement.index = targetArray.length;
            targetArray.push(modifiedCRCFieldElement);
        } else { 
            modifiedCRCFieldElement.index = crcFieldIndex;
            targetArray[crcFieldIndex] = modifiedCRCFieldElement; 
        }
        this.setUHAuthObjectToStorage();
    }

    modifyStartURL(parent, modifiedURL) { 
        if (!this.authScriptObject) return;
        this.authScriptObject.startUrl = modifiedURL;
        this.setUHAuthObjectToStorage();
    }

    modifySourceName(parent, modifiedSourceName) { 
        if (!this.authScriptObject) return;
        this.authScriptObject.source = modifiedSourceName;
        this.setUHAuthObjectToStorage();
    }

    modifyOptionParams(parent, modifiedOptionParams) { 
        if (!this.authScriptObject) return;
        this.authScriptObject.options = modifiedOptionParams;
        this.setUHAuthObjectToStorage();
    }

    modifySettings(parent, modifiedSettings) { 
        if (!this.authScriptObject) return;
        this.authScriptObject.settings = modifiedSettings;
        this.setUHAuthObjectToStorage();
    }

    modifyParam(parent, modifiedParam) { 
        if (!this.authScriptObject) return;
        this.authScriptObject.params = modifiedParam;
        this.setUHAuthObjectToStorage();
    }

    reShuffleExtratorFields(extratorFieldArr) { 
        if (!Array.isArray(extratorFieldArr)) return [];
        
        const selectorIndex = extratorFieldArr.findIndex(field => String(field.fieldName).toLowerCase() === '__selector');
        
        if (selectorIndex > 0) { 
            const selectorElement = extratorFieldArr.splice(selectorIndex, 1)[0];
            extratorFieldArr.unshift(selectorElement);
        }
        extratorFieldArr.forEach((field, idx) => field.index = idx);
        return extratorFieldArr;
    }

    getChildren(list, selectedElementId) {
        if (!Array.isArray(list)) return [];
        return list.filter(item => item.elementParent === selectedElementId);
    }

    getNestedChildren(nodeElement, parentId, childArrAccumulator) {
        if (!nodeElement || !Array.isArray(nodeElement.childNodes)) return childArrAccumulator;
        
        for (const childNode of nodeElement.childNodes) {
            if (childNode.nodeType === "Harvester") { 
                childArrAccumulator.push(childNode.text); 
                this.getNestedChildren(childNode, childNode.text, childArrAccumulator);
            }
        }
        return childArrAccumulator;
    }

    removeNodeFromObject(nodetype, parentId, nodeIdToRemove, nodeElementContext) {
        if (!this.authScriptObject) return;

        if (nodetype === 'Harvester') {
            if (!nodeElementContext || !nodeElementContext.category) {
                console.error("removeNodeFromObject (Harvester): nodeElementContext or its category is missing.");
                return;
            }
            let rootNodeData = this.getAuthRootNodeDataBasedOnCategory(nodeElementContext.category);
            if (!Array.isArray(rootNodeData)) return;

            let allNodesToRemoveIds = [nodeIdToRemove];
            let queue = [nodeIdToRemove];
            while(queue.length > 0) {
                let currentParentId = queue.shift();
                for(const node of rootNodeData) {
                    if (node.elementParent === currentParentId && !allNodesToRemoveIds.includes(node.elementId)) {
                        allNodesToRemoveIds.push(node.elementId);
                        queue.push(node.elementId);
                    }
                }
            }
            
            let finalArr = rootNodeData.filter(item => !allNodesToRemoveIds.includes(item.elementId));
            this.setAuthNodeDataBasedOnCategory(this.reShufflePayload(finalArr), nodeElementContext.category);

        } else if (nodetype === 'Extractor' || nodetype === 'ExtractorGroup') {
            if (!nodeElementContext || !nodeElementContext.parent || !nodeElementContext.parent.currentContext) {
                 console.error("removeNodeFromObject (Extractor/Group): Context for parent is missing.");
                 return;
            }
            let parentNodeArrObj = this.getExtractorParentArrObj(nodeElementContext.parent.currentContext);
            if (Array.isArray(parentNodeArrObj) && nodeElementContext.selectedIndex >= 0 && nodeElementContext.selectedIndex < parentNodeArrObj.length) {
                parentNodeArrObj.splice(nodeElementContext.selectedIndex, 1);
                parentNodeArrObj.forEach((field, idx) => field.index = idx);
            }
        } else if (nodetype === 'CRC') {
            if (!this.authScriptObject.payload || !Array.isArray(this.authScriptObject.payload.harvestorPayloadNode)) return;
            const parentIndex = this.authScriptObject.payload.harvestorPayloadNode.findIndex(e => e.elementId === parentId);
            if (parentIndex !== -1) {
                this.authScriptObject.payload.harvestorPayloadNode[parentIndex].elementCRCFields = undefined;
            }
        } else if (nodetype === 'CRCField') {
             if (!this.authScriptObject.payload || !Array.isArray(this.authScriptObject.payload.harvestorPayloadNode) || 
                 !nodeElementContext || !nodeElementContext.parent || !nodeElementContext.parent.parent || !nodeElementContext.parent.parent.text) {
                 console.error("removeNodeFromObject (CRCField): Context for parent harvester node is missing.");
                 return;
             }
            const parentHarvesterNodeId = nodeElementContext.parent.parent.text; 
            const parentHarvesterNodeIndex = this.authScriptObject.payload.harvestorPayloadNode.findIndex(e => e.elementId === parentHarvesterNodeId);

            if (parentHarvesterNodeIndex !== -1) {
                const crcNode = this.authScriptObject.payload.harvestorPayloadNode[parentHarvesterNodeIndex].elementCRCFields;
                if (crcNode && Array.isArray(crcNode.crcFieldsArr)) {
                    const crcFieldIndex = crcNode.crcFieldsArr.findIndex(e => e.fieldName === nodeIdToRemove); 
                    if (crcFieldIndex !== -1) {
                        crcNode.crcFieldsArr.splice(crcFieldIndex, 1);
                        crcNode.crcFieldsArr.forEach((field, idx) => field.index = idx);
                    }
                }
            }
        } else if (nodetype === 'Params') {
            this.authScriptObject.params = {};
        }
        this.setUHAuthObjectToStorage();
    }

    splitUnifiedObject() {
        if (!this.authScriptObject) {
            console.error("splitUnifiedObject: authScriptObject is not initialized.");
            this.harvestingObject = {}; 
            this.extractorObject = {};
            return;
        }

        let extractorObj = { source: this.authScriptObject.source };
        let harvesterPayload = [];
        let crcDeclaration = [];

        if (this.authScriptObject.payload && Array.isArray(this.authScriptObject.payload.harvestorPayloadNode)) {
            this.authScriptObject.payload.harvestorPayloadNode.forEach((item, index) => {
                if (item) { 
                    if (typeof item.elementOptions === 'string') {
                        try { item.elementOptions = JSON.parse(item.elementOptions); }
                        catch (e) { console.warn("Failed to parse elementOptions JSON:", item.elementOptions, e); item.elementOptions = {}; }
                    }
                    const harvesterPayloadItem = HarvesterConfigPayload.getHarvesterPayload(item);
                    harvesterPayload.push(harvesterPayloadItem);

                    if (item.elementCRCFields) {
                        let crcObj = HarvesterConfigPayload.getCRCFields(item.elementCRCFields);
                        if (harvesterPayloadItem) harvesterPayloadItem.crc = crcObj.definition; 
                        crcDeclaration.push(crcObj.declaration);
                    }
                    if (item.elementDocumentType && item.document && item.document.document) {
                        let e = ExtractorConfigPayload.getExtractorFileObject(item.document.document, item.elementDocumentType);
                        if (item.elementDocumentType === "listing") { 
                            e.listing = e.listing || {}; 
                            e.job = e.job || {};
                        }
                        extractorObj = { ...extractorObj, ...e };
                    }
                }
            });
        }

        let harvesterPrepare = [];
        if (this.authScriptObject.prepare && Array.isArray(this.authScriptObject.prepare.harvestorPrepareNode)) {
            this.authScriptObject.prepare.harvestorPrepareNode.forEach((item) => {
                if (item) { 
                     if (typeof item.elementOptions === 'string') {
                        try { item.elementOptions = JSON.parse(item.elementOptions); }
                        catch (e) { console.warn("Failed to parse elementOptions JSON for prepare node:", item.elementOptions, e); item.elementOptions = {}; }
                    }
                    harvesterPrepare.push(HarvesterConfigPayload.getHarvesterPayload(item));
                }
            });
        }
        
        harvesterPrepare = HarvesterConfigPayload.getReorderedHarvesterPayLoad(harvesterPrepare);
        harvesterPayload = HarvesterConfigPayload.getReorderedHarvesterPayLoad(harvesterPayload);
        
        this.harvestingObject = {
            source: this.authScriptObject.source,
            proxy: this.authScriptObject.proxy,
            type: this.authScriptObject.type,
            settings: this.authScriptObject.settings,
            options: Utils.setDefaultElementOptions(this.authScriptObject.options),
            ...(this.authScriptObject.params && Object.keys(this.authScriptObject.params).length > 0) && { params: this.authScriptObject.params },
            startUrl: this.authScriptObject.startUrl,
            crc: crcDeclaration && crcDeclaration.length > 0 ? crcDeclaration : undefined,
            prepare: harvesterPrepare && harvesterPrepare.length > 0 ? harvesterPrepare : undefined,
            payload: harvesterPayload && harvesterPayload.length > 0 ? harvesterPayload : undefined
        };
        this.extractorObject = extractorObj;
    }
        
    createandPopulateHarvest(harvestData, extractorObj) {
        if (!harvestData) {
            console.error("createandPopulateHarvest: harvestData is undefined.");
            return;
        }
        let sourceVal = harvestData["source"];
        let typeVal = harvestData["type"];
        let params = harvestData["params"]; 
        let startUrlVal = harvestData["startUrl"] || (params ? params.startUrl : undefined);
        let proxyVal = harvestData["proxy"];
        let payloadArray = harvestData["payload"];
        let prepareArray = harvestData["prepare"];
        let options = harvestData["options"];
        let settings = harvestData["settings"];

        let prepareNodes = this.createPrepareHarvestNodes(prepareArray);
        let payloadNodes = this.createPayloadHarvestNodes(payloadArray, extractorObj);
        let proxy = this.createProxy(proxyVal || {ip: "default", port: ""}); 

        this.authScriptObject = new Harvestor(sourceVal, proxy, typeVal, startUrlVal, payloadNodes, params, prepareNodes, options, settings);
        // this.setUHAuthObjectToStorage(); // Let init() handle final storage
    }

    createPrepareHarvestNodes(prepareArray) {
        let prepareHarvestNodes = [];
        prepareArray = Array.isArray(prepareArray) ? prepareArray : [];
        prepareArray.forEach(element => {
            if (element) { 
                let elementFactory = new ElementFactory();
                let elementNode = elementFactory.createElement(element, null); 
                if (elementNode) { 
                    elementNode.category = "prepare";
                    prepareHarvestNodes.push(elementNode);
                }
            }
        });
        return new Prepare(prepareHarvestNodes);
    }

    createPayloadHarvestNodes(payloadArray, extractorObj) {
        let payloadHarvestNodes = [];
        payloadArray = Array.isArray(payloadArray) ? payloadArray : [];
        payloadArray.forEach(element => {
            if (element) { 
                let elementFactory = new ElementFactory();
                let elementNode = elementFactory.createElement(element, extractorObj);
                if (elementNode) { 
                    elementNode.category = "payload";
                    payloadHarvestNodes.push(elementNode);
                }
            }
        });
        return new Payload(payloadHarvestNodes);
    }

    createProxy(proxyKey) {
        if (!proxyKey || typeof proxyKey.ip === 'undefined') { 
            return new Proxy("default", "");
        }
        return new Proxy(proxyKey.ip, proxyKey.port);
    }

    validateInput(harvestData) {
        if (!harvestData) return false;
        let sourceVal = harvestData["source"];
        let typeVal = harvestData["type"];
        let params = harvestData["params"];
        let startUrlVal = harvestData["startUrl"] || (params ? params.startUrl : undefined);
        let proxyVal = harvestData["proxy"];

        return !!(sourceVal && typeVal && startUrlVal && proxyVal && typeof proxyVal.ip !== 'undefined');
    }

    testAuthScriptJSObject(uhAuthScriptObj) {
        console.log("Current AuthScript Object:", uhAuthScriptObj);
    }

    createDefaultHarvestObj(sourceName, startUrl, type, ip, port, payload, params) {
        let harvestObj = {};
        let proxy = { ip: ip || "default", port: port || "" };

        harvestObj.source = sourceName || "DefaultSource";
        harvestObj.proxy = proxy;
        harvestObj.type = type || "html";
        harvestObj.startUrl = startUrl || "http://example.com";
        harvestObj.payload = Array.isArray(payload) ? payload : [];
        harvestObj.params = params || {};
        harvestObj.options = {}; 
        harvestObj.settings = {}; 
        harvestObj.prepare = []; 
        return harvestObj;
    }

    createDefaultExtractorObj() {
        let extractorObj = { source: sessionStorage["newProject"] || "DefaultSource" };
        return extractorObj;
    }

    reShufflePayload(payloadNodes) {
        if (!Array.isArray(payloadNodes)) return [];
        
        const nodeMap = new Map(payloadNodes.map(node => [node.elementId, node]));
        const childrenMap = new Map();
        payloadNodes.forEach(node => {
            if (node.elementParent && node.elementParent !== "root") {
                if (!childrenMap.has(node.elementParent)) {
                    childrenMap.set(node.elementParent, []);
                }
                childrenMap.get(node.elementParent).push(node.elementId);
            }
        });

        const visited = new Set();
        const result = [];

        function visit(nodeId) {
            if (!nodeId || visited.has(nodeId)) return;
            
            const node = nodeMap.get(nodeId);
            if (!node) return; 

            visited.add(nodeId);
            result.push(node);
            
            const children = childrenMap.get(nodeId);
            if (children) {
                children.forEach(childId => visit(childId));
            }
        }

        payloadNodes.forEach(node => {
            if (node.elementParent === "root") {
                visit(node.elementId);
            }
        });
        
        payloadNodes.forEach(node => {
            if (!visited.has(node.elementId)) {
                result.push(node); 
            }
        });
        
        return result;
    }
    
    getExtractorParentArrObj(parentContext) {
        if (!parentContext) return null;

        if (parentContext.isgroup && Array.isArray(parentContext.fields)) {
            return parentContext.fields;
        } else if (parentContext.document && parentContext.document.document && Array.isArray(parentContext.document.document.documentDetails)) {
            return parentContext.document.document.documentDetails;
        }
        return null;
    }

    isCRCNodeExists(parentHarvesterNodeId){
        if (!this.authScriptObject || !this.authScriptObject.payload || !Array.isArray(this.authScriptObject.payload.harvestorPayloadNode)) return false;
        
        const parentElement = this.authScriptObject.payload.harvestorPayloadNode.find(item => item.elementId === parentHarvesterNodeId);
        return !!(parentElement && parentElement.elementCRCFields);
    }

    isHarvesterEnabledForExtractor(parentContext){
        if (!parentContext) return false;
        return !!(parentContext.isgroup || parentContext.elementDocumentType);
    }
}
