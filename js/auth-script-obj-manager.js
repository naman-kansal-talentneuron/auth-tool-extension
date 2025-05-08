// File: extension/js/auth-script-obj-manager.js
// This is the ES6 class version provided by the user.
// No changes were needed in THIS specific file for DevTools API migration,
// as it does not directly use chrome.devtools.* APIs.
// The primary concern for this file remains its local file access methods.

import Harvestor from "./harvest/Harvestor.js";
import Proxy from "./proxy/Proxy.js";
import Payload from "./payload/Payload.js";
import Prepare from "./prepare/prepare.js";
import ElementFactory from "./element/ElementFactory.js";
import Utils from './utils.js'; // This utility is used for file fetching
import HarvesterConfigPayload from "./harvest/harvester-config-payload.js";
import ExtractorConfigPayload from "./extract/extractor-config-payload.js";
import MetaData from "./config/meta-data.js";


export default class AuthScriptObjManager {

    AUTH_SESSION_OBJECT_NAME = "authScriptObject";

    constructor(rootPath, projectname) {
        this.path = rootPath;
        this.projectname = projectname;
        let obj = this.getUHAuthObjectFromStorage();
        this.authScriptObject = obj != undefined && obj != null ? obj : null;
        this.harvestingObject; // Will be populated by splitUnifiedObject
        this.extractorObject;  // Will be populated by splitUnifiedObject
        this.getUHAuthScriptObject();
    }

    getUHAuthScriptObject() {
        let localObject = this.getUHAuthObjectFromStorage();
        const isNewProject = sessionStorage["newProject"] != 'undefined' 
                                && sessionStorage["newProject"] != null 
                                && sessionStorage["newProject"] != "null";

        if (localObject != undefined && localObject != null) {
            // Loading the object from localStorage
            this.authScriptObject = localObject;
        } else if (isNewProject && !this.checkIfHarvesterAndExtractorTemplateFilesExist()) {
            // if template doesn't exist, we use default harvest and extract Objects.
            this.getDefaultUHAuthScriptObject();
        } else {
            const isDefaultRootPath = localStorage["rootPathSelection"] == "radiodefaultrootpath";
            const projectName = isNewProject ? 'template' : this.projectname;
            
            // CRITICAL: Utils.fetchFileFromPath is used here and is problematic for local files
            try {
                let { harvestObj, extractObj } = this.getHarvestAndExtractObjects(projectName, isDefaultRootPath);
                // setting source name and start url and flag to load custom script if it is a new project with default template
                if(isNewProject) {
                    this.setSourceNameAndStartURL(harvestObj, extractObj);
                    if(this.checkIfCustomScriptTemplateFileExists()) {
                        sessionStorage["customScriptAvailable"] = "true"; // Ensure consistent string "true"
                    } else {
                        sessionStorage["customScriptAvailable"] = "false";
                    }
                }

                this.translateJsonToElement(harvestObj, extractObj);
                let scriptPath = this.path + ( isDefaultRootPath ? '/scripts/' : "/") + projectName + '.py';
                this.setCustomScriptObj(scriptPath); // This also uses Utils.fetchFileFromPath
            } catch (error) {
                console.error(`Error initializing AuthScript object for project "${projectName}":`, error);
                // Fallback to default if file loading fails
                alert(`Error loading project files for "${projectName}". Falling back to default empty project. Please check file paths and permissions. Error: ${error.message}`);
                this.getDefaultUHAuthScriptObject();
            }
        }
    }

    checkIfHarvesterAndExtractorTemplateFilesExist() {
        try {
            const filesData = JSON.parse(localStorage['list_of_files']);
            const { 
                harvesterFileNames, 
                extractorFileNames 
            } = filesData || {}; // Default to empty object if filesData is null/undefined
            
            if (!Array.isArray(harvesterFileNames) || !Array.isArray(extractorFileNames)) return false;

            return harvesterFileNames.map(name => String(name).toLowerCase()).includes('template') 
                    && extractorFileNames.map(name => String(name).toLowerCase()).includes('template');
        } catch (e) {
            console.error("Error parsing list_of_files from localStorage:", e);
            return false;
        }
    }

    checkIfCustomScriptTemplateFileExists() {
        try {
            const filesData = JSON.parse(localStorage['list_of_files']);
            const { 
                customScriptFileNames 
            } = filesData || {}; // Default to empty object

            if (!Array.isArray(customScriptFileNames)) return false;
            
            return customScriptFileNames.map(name => String(name).toLowerCase()).includes('template');
        } catch (e) {
            console.error("Error parsing list_of_files for custom scripts:", e);
            return false;
        }
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
        let harvestObj = this.createDefaultHarvestObj(sessionStorage["newProject"], sessionStorage["newStartUrl"], "html", "default", "", [], []);
        let extractObj = this.createDefaultExtractorObj();
        this.translateJsonToElement(harvestObj, extractObj);
        this.setCustomScriptObj(); // Sets empty custom script if template/file not found
    }

    getHarvestAndExtractObjects(projectName, isDefaultRootPath) {
        // CRITICAL: Utils.fetchFileFromPath is used here. This is problematic for local files.
        // This function will throw an error if files are not accessible, which should be handled by the caller.
        let harvesterPath = this.path + ( isDefaultRootPath ? '/harvester/' : "/") + projectName + '.harvest';
        let harvestObj = JSON.parse(Utils.fetchFileFromPath(harvesterPath)); // Problematic line
        
        let extractorPath = this.path + ( isDefaultRootPath ? "/extractor/" : "/")+ projectName + ".extract";
        let extractObj = JSON.parse(Utils.fetchFileFromPath(extractorPath)); // Problematic line

        return { harvestObj, extractObj };
    }

    /**
     * Sets custom python script data to the auth object if present.
     */
    setCustomScriptObj(scriptPath){
        let customScript = "";
        if (sessionStorage["customScriptAvailable"] === "true" && scriptPath) {
            try {
                // CRITICAL: Utils.fetchFileFromPath is used here. Problematic for local files.
                customScript = Utils.fetchFileFromPath(scriptPath); // Problematic line
            } catch (error) {
                console.warn(`Could not fetch custom script from "${scriptPath}":`, error);
                // customScript remains ""
            }
        }
        // Ensure authScriptObject exists before assigning to its property
        if (!this.authScriptObject) {
            console.warn("authScriptObject is not initialized in setCustomScriptObj. Creating a default structure.");
            // Initialize with a minimal structure if it's unexpectedly null/undefined
            // This indicates a potential logic flaw elsewhere if it reaches here without authScriptObject.
             this.authScriptObject = new Harvestor(this.projectname, new Proxy("default", ""), "html", "", new Payload([]), {}, new Prepare([]), {}, {});
        }
        this.authScriptObject.customScript = customScript;
        this.setUHAuthObjectToStorage();
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
                // Potentially alert the user if storage fails, as changes might be lost.
                alert("Warning: Could not save project changes to local storage. Storage might be full or corrupted.");
            }
        } else {
            console.warn("Attempted to save null or undefined authScriptObject, or projectname is missing.");
        }
    }

    translateJsonToElement(harvesterObj, extractorObj) {
        if (!harvesterObj) {
            console.error("translateJsonToElement: harvesterObj is undefined. Cannot proceed.");
            // Potentially set a default state or show an error
            this.authScriptObject = new Harvestor(this.projectname, new Proxy("default", ""), "html", "", new Payload([]), {}, new Prepare([]), {}, {});
            this.setUHAuthObjectToStorage();
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
        if (!this.authScriptObject) return []; // Should not happen if constructor/getUHAuthScriptObject works
        if (category && category === "prepare") { // Use strict equality
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

        // Find current position of selectedIndex within its siblings
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
            // Swap elements in the main harvesterNodes array
            [harvesterNodes[newTargetGlobalIndex], harvesterNodes[selectedIndex]] = 
                [harvesterNodes[selectedIndex], harvesterNodes[newTargetGlobalIndex]];
            
            // Note: Reshuffling the entire payload might be heavy if only indices need update.
            // For now, assuming reShufflePayload correctly reorders or re-indexes.
            const reshuffled = this.reShufflePayload(harvesterNodes); // This re-creates the array.

            if(nodeElement.category === "prepare"){
                this.authScriptObject.prepare.harvestorPrepareNode = reshuffled;
            } else {
                this.authScriptObject.payload.harvestorPayloadNode = reshuffled;
            }
            this.setUHAuthObjectToStorage();
            // Find the moved element in the new reshuffled array to return it.
            // This assumes elementId is unique and stable.
            return reshuffled.find(el => el.elementId === nodeElement.elementId);
        }
        return harvesterNodes[selectedIndex]; // Return original if no move happened
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
            
            // Update indices after swapping
            extractorFields[newTargetIndex].index = newTargetIndex;
            extractorFields[selectedIndex].index = selectedIndex;
            
            this.setUHAuthObjectToStorage();
            return { ...extractorFields[newTargetIndex], parent }; // Return a copy with parent context
        }
        // Return original if no move happened, with parent context
        return { ...extractorFields[selectedIndex], parent };
    }

    // findNewTargetIndex was specific to the old traversal logic, can be removed if new logic is sound.
    /*
    findNewTargetIndex(traversedNodesIndices, selectedIndex){
        let newTargetIndex = -1;
        for(const key of traversedNodesIndices){
            if(key == selectedIndex) { break }
            newTargetIndex = key;
        }
        return newTargetIndex;
    }
    */

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

        // Reshuffling might be needed if parentage or order fundamentally changes,
        // but if it's just properties, direct assignment is enough.
        // Assuming reShufflePayload handles re-indexing or parent-child relationship updates correctly.
        let payloadWithUpdatedParent = this.reShufflePayload(authRootNodeData); // This creates a new array.
        
        this.setAuthNodeDataBasedOnCategory(payloadWithUpdatedParent, modifiedNodeElement.category);
        this.setUHAuthObjectToStorage();
    }

    modifyExtractorGroupField(parent, childIndex, modifiedFieldElement) {
        // This seems to be an alias or specific case for modifyExtractorField
        this.modifyExtractorField(parent, childIndex, modifiedFieldElement);
    }

    modifyExtractorField(parent, childIndex, modifiedFieldElement, isTransform = false) {
        if (!parent || modifiedFieldElement === undefined) { // Allow childIndex to be 0
            console.warn("modifyExtractorField: Invalid parent or modifiedFieldElement.", parent, modifiedFieldElement);
            return;
        }

        let targetArray;
        if (parent.isgroup) {
            if (!Array.isArray(parent.fields)) parent.fields = []; // Initialize if not array
            targetArray = parent.fields;
        } else if (parent.document && parent.document.document) {
            if (!Array.isArray(parent.document.document.documentDetails)) parent.document.document.documentDetails = [];
            targetArray = parent.document.document.documentDetails;
        } else if (parent.elementDocumentType) { // Case where parent is a harvester node, and document structure needs to be created
             parent.document = parent.document || {};
             parent.document.document = parent.document.document || {};
             parent.document.document.documentDetails = parent.document.document.documentDetails || [];
             targetArray = parent.document.document.documentDetails;
        } else {
            console.error("modifyExtractorField: Parent structure is not recognized for field modification.", parent);
            return;
        }
        
        if (childIndex === undefined || childIndex === null || childIndex < 0) { // Adding a new field
            modifiedFieldElement.index = targetArray.length;
            targetArray.push(modifiedFieldElement);
        } else if (isTransform) {
            this.insertTransformedNode(targetArray, childIndex, modifiedFieldElement);
        } else {
            if (childIndex < targetArray.length) {
                targetArray[childIndex] = modifiedFieldElement;
            } else { // Index out of bounds for modification, treat as append
                modifiedFieldElement.index = targetArray.length;
                targetArray.push(modifiedFieldElement);
            }
        }

        // Reshuffle if __selector is added/modified and not at the beginning
        if (modifiedFieldElement && String(modifiedFieldElement.fieldName).toLowerCase() === '__selector') {
            const currentSelectorIndex = targetArray.findIndex(f => String(f.fieldName).toLowerCase() === '__selector');
            if (currentSelectorIndex > 0) { // If __selector exists and is not the first element
                const selectorElement = targetArray.splice(currentSelectorIndex, 1)[0];
                selectorElement.index = 0; // Set its index to 0
                targetArray.unshift(selectorElement); // Move to the beginning
                // Re-index the rest of the fields
                for (let i = 1; i < targetArray.length; i++) {
                    targetArray[i].index = i;
                }
            } else if (currentSelectorIndex === -1 && targetArray.length > 0 && String(targetArray[0].fieldName).toLowerCase() !== '__selector') {
                // If selector was just added and is not first, this case might be complex.
                // The above logic for `isTransform` or direct assignment should handle placement.
                // This reShuffleExtratorFields call might be redundant if __selector logic is handled well during add/modify.
            }
        }
        this.setUHAuthObjectToStorage();
    }

    insertTransformedNode(childNodes, targetIndex, node){
        if (!Array.isArray(childNodes) || targetIndex < 0) return;
        node.index = targetIndex; // Set index of the new node
        childNodes.splice(targetIndex, 0, node);
        // Update indices of subsequent nodes
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
        
        // Ensure crcFieldsArr exists on the modified data and fields have parent set
        if (modifiedCRCNodeData && Array.isArray(modifiedCRCNodeData.crcFieldsArr)) {
            modifiedCRCNodeData.crcFieldsArr.forEach(field => {
                field.fieldParent = modifiedCRCNodeData.document; // Assuming document is the CRC node name/id
            });
        } else if (modifiedCRCNodeData) {
            modifiedCRCNodeData.crcFieldsArr = []; // Initialize if not present
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
        if (crcFieldIndex === undefined || crcFieldIndex === null || crcFieldIndex < 0 || crcFieldIndex > targetArray.length) { // Append if index is invalid or at the end
            modifiedCRCFieldElement.index = targetArray.length;
            targetArray.push(modifiedCRCFieldElement);
        } else { // Modify existing or insert
            modifiedCRCFieldElement.index = crcFieldIndex;
            targetArray[crcFieldIndex] = modifiedCRCFieldElement; 
        }
        this.setUHAuthObjectToStorage();
    }

    modifyStartURL(parent, modifiedURL) { // parent argument seems unused
        if (!this.authScriptObject) return;
        this.authScriptObject.startUrl = modifiedURL;
        this.setUHAuthObjectToStorage();
    }

    modifySourceName(parent, modifiedSourceName) { // parent argument seems unused
        if (!this.authScriptObject) return;
        this.authScriptObject.source = modifiedSourceName;
        this.setUHAuthObjectToStorage();
    }

    modifyOptionParams(parent, modifiedOptionParams) { // parent argument seems unused
        if (!this.authScriptObject) return;
        this.authScriptObject.options = modifiedOptionParams;
        this.setUHAuthObjectToStorage();
    }

    modifySettings(parent, modifiedSettings) { // parent argument seems unused
        if (!this.authScriptObject) return;
        this.authScriptObject.settings = modifiedSettings;
        this.setUHAuthObjectToStorage();
    }

    modifyParam(parent, modifiedParam) { // parent argument seems unused
        if (!this.authScriptObject) return;
        this.authScriptObject.params = modifiedParam;
        this.setUHAuthObjectToStorage();
    }

    reShuffleExtratorFields(extratorFieldArr) { // This was specific for __selector, ensure it's still needed
        if (!Array.isArray(extratorFieldArr)) return [];
        
        const selectorIndex = extratorFieldArr.findIndex(field => String(field.fieldName).toLowerCase() === '__selector');
        
        if (selectorIndex > 0) { // If __selector exists and is not already first
            const selectorElement = extratorFieldArr.splice(selectorIndex, 1)[0];
            extratorFieldArr.unshift(selectorElement);
        }
        // Re-index all fields
        extratorFieldArr.forEach((field, idx) => field.index = idx);
        return extratorFieldArr;
    }

    // getChildren seems unused, consider removing if not called elsewhere
    getChildren(list, selectedElementId) {
        if (!Array.isArray(list)) return [];
        return list.filter(item => item.elementParent === selectedElementId);
    }

    // getNestedChildren seems unused, consider removing
    getNestedChildren(nodeElement, parentId, childArrAccumulator) {
        if (!nodeElement || !Array.isArray(nodeElement.childNodes)) return childArrAccumulator;
        
        for (const childNode of nodeElement.childNodes) {
            if (childNode.nodeType === "Harvester") { // Assuming nodeType is a string
                childArrAccumulator.push(childNode.text); // Assuming 'text' is the ID
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

            // Find all descendants of the node to be removed
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
                // Re-index remaining fields
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
            const parentHarvesterNodeId = nodeElementContext.parent.parent.text; // ID of the Harvester node
            const parentHarvesterNodeIndex = this.authScriptObject.payload.harvestorPayloadNode.findIndex(e => e.elementId === parentHarvesterNodeId);

            if (parentHarvesterNodeIndex !== -1) {
                const crcNode = this.authScriptObject.payload.harvestorPayloadNode[parentHarvesterNodeIndex].elementCRCFields;
                if (crcNode && Array.isArray(crcNode.crcFieldsArr)) {
                    const crcFieldIndex = crcNode.crcFieldsArr.findIndex(e => e.fieldName === nodeIdToRemove); // Assuming nodeIdToRemove is fieldName
                    if (crcFieldIndex !== -1) {
                        crcNode.crcFieldsArr.splice(crcFieldIndex, 1);
                        // Re-index
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
            this.harvestingObject = {}; // Default empty objects
            this.extractorObject = {};
            return;
        }

        let extractorObj = { source: this.authScriptObject.source };
        let harvesterPayload = [];
        let crcDeclaration = [];

        if (this.authScriptObject.payload && Array.isArray(this.authScriptObject.payload.harvestorPayloadNode)) {
            this.authScriptObject.payload.harvestorPayloadNode.forEach((item, index) => {
                if (item) { // Ensure item is not null/undefined
                    if (typeof item.elementOptions === 'string') {
                        try { item.elementOptions = JSON.parse(item.elementOptions); }
                        catch (e) { console.warn("Failed to parse elementOptions JSON:", item.elementOptions, e); item.elementOptions = {}; }
                    }
                    const harvesterPayloadItem = HarvesterConfigPayload.getHarvesterPayload(item);
                    harvesterPayload.push(harvesterPayloadItem);

                    if (item.elementCRCFields) {
                        let crcObj = HarvesterConfigPayload.getCRCFields(item.elementCRCFields);
                        if (harvesterPayloadItem) harvesterPayloadItem.crc = crcObj.definition; // Add to the correct item
                        crcDeclaration.push(crcObj.declaration);
                    }
                    if (item.elementDocumentType && item.document && item.document.document) {
                        let e = ExtractorConfigPayload.getExtractorFileObject(item.document.document, item.elementDocumentType);
                        if (item.elementDocumentType === "listing") { // Use strict equality
                            e.listing = e.listing || {}; // Ensure objects exist
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
                if (item) { // Ensure item is not null/undefined
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
        let params = harvestData["params"]; // Can be undefined
        let startUrlVal = harvestData["startUrl"] || (params ? params.startUrl : undefined);
        let proxyVal = harvestData["proxy"];
        let payloadArray = harvestData["payload"];
        let prepareArray = harvestData["prepare"];
        let options = harvestData["options"];
        let settings = harvestData["settings"];

        let prepareNodes = this.createPrepareHarvestNodes(prepareArray);
        let payloadNodes = this.createPayloadHarvestNodes(payloadArray, extractorObj);
        let proxy = this.createProxy(proxyVal || {ip: "default", port: ""}); // Default proxy if undefined

        this.authScriptObject = new Harvestor(sourceVal, proxy, typeVal, startUrlVal, payloadNodes, params, prepareNodes, options, settings);
        this.setUHAuthObjectToStorage();
        // this.testAuthScriptJSObject(this.authScriptObject); // For debugging
    }

    createPrepareHarvestNodes(prepareArray) {
        let prepareHarvestNodes = [];
        prepareArray = Array.isArray(prepareArray) ? prepareArray : [];
        prepareArray.forEach(element => {
            if (element) { // Check if element is not null/undefined
                let elementFactory = new ElementFactory();
                let elementNode = elementFactory.createElement(element, null); // extractorObj is null for prepare nodes
                if (elementNode) { // Check if createElement returned a node
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
            if (element) { // Check if element is not null/undefined
                let elementFactory = new ElementFactory();
                let elementNode = elementFactory.createElement(element, extractorObj);
                if (elementNode) { // Check if createElement returned a node
                    elementNode.category = "payload";
                    payloadHarvestNodes.push(elementNode);
                }
            }
        });
        return new Payload(payloadHarvestNodes);
    }

    createProxy(proxyKey) {
        if (!proxyKey || typeof proxyKey.ip === 'undefined') { // Provide defaults if proxyKey is malformed
            // console.warn("ProxyKey is undefined or malformed, using default proxy.", proxyKey);
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
        // For debugging purposes
        console.log("Current AuthScript Object:", uhAuthScriptObj);
        // Example: Check if conversion to JSON and back works
        // try {
        //     const jsonString = JSON.stringify(uhAuthScriptObj);
        //     console.log("Serialized AuthScript Object:", jsonString);
        //     const parsedObj = JSON.parse(jsonString);
        //     console.log("Parsed AuthScript Object (should be deep equal to original):", parsedObj);
        // } catch (e) {
        //     console.error("Error during testAuthScriptJSObject serialization/deserialization:", e);
        // }
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
        harvestObj.options = {}; // Add default empty options
        harvestObj.settings = {}; // Add default empty settings
        harvestObj.prepare = []; // Add default empty prepare array
        return harvestObj;
    }

    createDefaultExtractorObj() {
        let extractorObj = { source: sessionStorage["newProject"] || "DefaultSource" };
        // Initialize with common document types if needed
        // e.g., extractorObj.listing = { documentTypeName: "listing", documentDetails: [] };
        return extractorObj;
    }

    reShufflePayload(payloadNodes) {
        if (!Array.isArray(payloadNodes)) return [];
        
        // This is a complex operation. The goal is to ensure nodes are ordered
        // such that parents appear before their children if a strict tree order is needed.
        // A simpler approach if only top-level items need to be sorted or if parent-child
        // relationships are maintained by reference within the objects themselves:
        
        // Create a map of nodes by ID for quick lookup
        const nodeMap = new Map(payloadNodes.map(node => [node.elementId, node]));
        // Create a map of children for each parent
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
            if (!node) return; // Node not found in map (should not happen if payload is consistent)

            visited.add(nodeId);
            
            // Visit children first (if a specific child-first order is desired for some reason)
            // or visit parent then children (more common for tree output)

            // For parent-first output (typical tree traversal):
            result.push(node);
            
            const children = childrenMap.get(nodeId);
            if (children) {
                children.forEach(childId => visit(childId));
            }
        }

        // Start visitation from root nodes
        payloadNodes.forEach(node => {
            if (node.elementParent === "root") {
                visit(node.elementId);
            }
        });
        
        // Add any remaining nodes that might not have been part of the root-based traversal
        // (e.g., orphaned nodes, though ideally the data structure prevents this)
        payloadNodes.forEach(node => {
            if (!visited.has(node.elementId)) {
                // This indicates an issue with the data structure or traversal logic if nodes are missed.
                // console.warn("reShufflePayload: Node not visited, adding at end:", node.elementId);
                result.push(node); // Add them, but investigate why they weren't part of tree.
            }
        });
        
        // Re-index based on the new order
        result.forEach((node, index) => {
            // It's generally not good practice to mutate the index property directly here
            // unless the 'index' property is purely for display order and not a key.
            // If 'index' is a critical part of its identity or key, this could be problematic.
            // For now, assuming it's for order.
            // node.index = index; // If you have an 'index' property to update for order
        });

        return result;
    }
    
    // getAllParentNode and removeAlreadyExisting were part of the old reShufflePayload.
    // The new reShufflePayload uses a different graph traversal approach.
    // These can be removed if the new reShufflePayload is confirmed to work correctly.

    getExtractorParentArrObj(parentContext) {
        if (!parentContext) return null;

        // parentContext could be an ExtractorGroup object or a HarvesterNode object
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
        // An extractor can be added if the parent is an ExtractorGroup or if it's a Harvester node that supports a document type
        return !!(parentContext.isgroup || parentContext.elementDocumentType);
    }
}
