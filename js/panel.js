// File: extension/js/panel.js
// Main script for the Side Panel UI. Handles tab navigation, workspace setup,
// and provides helper functions for communication with the background script
// for script execution and debugger control.

// Original imports
import LoadProjectTab from "./project.js"; // Ensure this path is correct relative to panel.js
import loadEditorTab from "./python-ide.js"; // Ensure this path is correct
import Utils from './utils.js'; // Ensure this path is correct

let selectedDirectoryHandle = null; // Added global variable

// --- START: Communication Helpers for Side Panel Migration ---

// Establish connection with the background script
const port = chrome.runtime.connect({ name: "uh_script_auth_tool_port" });

// Store for pending callbacks for script execution and debugger results
const pendingScriptCallbacks = {};
const pendingDebuggerCallbacks = {}; // Added for debugger commands

// Helper to generate unique IDs for messages
function generateUniqueMessageId() {
    return "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

// Central listener for messages from background.js
port.onMessage.addListener(function(msg) {
    // console.log("Panel received message from background:", msg); // Optional: for debugging

    // --- Handle Script Execution Results ---
    if (msg.type === "scriptExecutionResult" && msg.originalMessageId) {
        const callbackData = pendingScriptCallbacks[msg.originalMessageId];
        if (callbackData && typeof callbackData.callback === 'function') {
            let mappedException = null;
            if (msg.isException && msg.errorDetails) {
                mappedException = { // Structure mimicking devtools eval exception
                    isException: true, isError: true,
                    value: msg.errorDetails.value || msg.errorDetails.description || JSON.stringify(msg.errorDetails),
                    description: msg.errorDetails.description || "Error during script execution.",
                    _rawErrorDetails: msg.errorDetails
                };
            }
            callbackData.callback(msg.result, mappedException);
            delete pendingScriptCallbacks[msg.originalMessageId]; // Clean up
        } else if (callbackData) {
            console.warn("Callback for script messageId", msg.originalMessageId, "is not a function:", callbackData.callback);
            delete pendingScriptCallbacks[msg.originalMessageId];
        }

    // --- Handle Debugger Command Results ---
    } else if (msg.type === "debuggerCommandResult" && msg.originalMessageId) {
        const callbackData = pendingDebuggerCallbacks[msg.originalMessageId];
        if (callbackData && typeof callbackData.callback === 'function') {
            let errorObject = null;
            if (msg.isException && msg.errorDetails) {
                // Create an Error-like object for the callback
                errorObject = new Error(msg.errorDetails.description || "Debugger command failed.");
                Object.assign(errorObject, msg.errorDetails); // Add extra details if any
            }
            // Debugger callbacks typically expect (error, result)
            callbackData.callback(errorObject, msg.result);
            delete pendingDebuggerCallbacks[msg.originalMessageId]; // Clean up
        } else if (callbackData) {
             console.warn("Callback for debugger messageId", msg.originalMessageId, "is not a function:", callbackData.callback);
            delete pendingDebuggerCallbacks[msg.originalMessageId];
        }

    // --- Handle Forwarded Debugger Events ---
    } else if (msg.type === "debuggerEventForward") {
        // console.log("Panel received forwarded debugger event:", msg.eventData.method, msg.eventData.params);
        // Dispatch this event locally within the panel for interested components (like AnnotateElements)
        // Option 1: Use a custom event
        window.dispatchEvent(new CustomEvent('debuggerEvent', { detail: msg.eventData }));
        // Option 2: Call a known global handler if one exists
        // if (window.handleGlobalDebuggerEvent) {
        //     window.handleGlobalDebuggerEvent(msg.eventData.method, msg.eventData.params);
        // }
        // Option 3: If panel knows about specific instances (like annotatorInstance)
        // if (window.annotatorInstance && typeof window.annotatorInstance.handleDebuggerEvent === 'function') {
        //     window.annotatorInstance.handleDebuggerEvent(msg.eventData.method, msg.eventData.params);
        // }
    
    // --- Handle Unexpected Debugger Detach ---
    } else if (msg.type === "debuggerDetached") {
        console.warn(`Debugger detached unexpectedly from tab ${msg.tabId}. Reason: ${msg.reason}`);
        // Notify relevant components (like AnnotateElements) to update their state
        window.dispatchEvent(new CustomEvent('debuggerDetached', { detail: { tabId: msg.tabId, reason: msg.reason } }));
        // if (window.annotatorInstance && typeof window.annotatorInstance.handleUnexpectedDetach === 'function') {
        //     window.annotatorInstance.handleUnexpectedDetach(msg.tabId, msg.reason);
        // }
        alert(`Debugger connection to the page was lost. Reason: ${msg.reason}. You may need to re-attach annotation features.`);
    }

    // Handle other types of messages from background if needed
});

// --- Helper for Script Execution ---
/**
 * Replaces chrome.devtools.inspectedWindow.eval.
 * Sends a script to the background service worker for execution in the target tab.
 * @param {string|function} scriptContent The JavaScript code string or function to execute.
 * @param {object} options DEPRECATED - Original options. Largely ignored now.
 * @param {function} callback The original callback function: (result, isException) => {}.
 */
function executeScriptInPageContext(scriptContent, options, callback) {
    if (typeof callback !== 'function') {
        callback = function(result, isException) { // Default callback
            if (isException) console.error("Script exec error:", isException.description || isException.value, isException._rawErrorDetails || isException);
            // else console.log("Script exec result:", result);
        };
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
            let errorMsg = "executeScriptInPageContext: Could not get active tab.";
            if (chrome.runtime.lastError) errorMsg += " Error: " + chrome.runtime.lastError.message;
            console.error(errorMsg);
            callback(null, { isException: true, isError: true, value: "Failed to get active tab.", description: errorMsg });
            return;
        }
        const targetTabId = tabs[0].id;
        const messageId = generateUniqueMessageId();
        pendingScriptCallbacks[messageId] = { callback: callback };

        let scriptString = scriptContent;
        if (typeof scriptContent === 'function') scriptString = `(${scriptContent.toString()})();`;
        else if (typeof scriptContent !== 'string') {
            console.error("executeScriptInPageContext: scriptContent must be a string or function.", scriptContent);
            callback(null, { isException: true, isError: true, value: "Invalid script content.", description: "Script must be string or function." });
            delete pendingScriptCallbacks[messageId]; return;
        }
        
        const messageToSend = { messageId, tabId: targetTabId, action: 'code', content: scriptString };
        try { port.postMessage(messageToSend); } 
        catch (e) {
            console.error("Failed to post script execution message:", e);
            callback(null, { isException: true, isError: true, value: "Communication error.", description: e.message });
            delete pendingScriptCallbacks[messageId];
        }
    });
}

// --- Helper for Debugger Commands ---
/**
 * Sends a command related to the chrome.debugger API to the background script.
 * @param {string} command The debugger action ('attach', 'detach', 'sendCommand').
 * @param {object} params Parameters for the command. Must include 'tabId'.
 * For 'attach', can include 'version'.
 * For 'sendCommand', should include 'method' and optionally 'commandParams'.
 * @param {function} callback Function to call with the result: (error, result) => {}
 */
function sendPanelDebuggerCommand(command, params, callback) {
     if (typeof callback !== 'function') {
        callback = function(error, result) { // Default callback
            if (error) console.error(`Debugger command '${command}' error:`, error);
            // else console.log(`Debugger command '${command}' success:`, result);
        };
    }
    if (!params || typeof params.tabId !== 'number') {
         // If tabId is missing, try to get the active tab dynamically.
         chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
             if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
                 let errorMsg = "sendPanelDebuggerCommand: Could not get active tab ID.";
                 if (chrome.runtime.lastError) errorMsg += " Error: " + chrome.runtime.lastError.message;
                 console.error(errorMsg);
                 callback(new Error(errorMsg));
                 return;
             }
             params = params || {}; // Ensure params is an object
             params.tabId = tabs[0].id; // Add the dynamically fetched tabId
             sendCommandInternal(command, params, callback);
         });
    } else {
        // TabId was provided in params
        sendCommandInternal(command, params, callback);
    }
}

/** Internal function to send the debugger command message after ensuring tabId */
function sendCommandInternal(command, params, callback) {
    const messageId = generateUniqueMessageId();
    pendingDebuggerCallbacks[messageId] = { callback: callback };

    const messageToSend = {
        messageId: messageId,
        tabId: params.tabId, // tabId is now guaranteed to be in params
        action: 'debuggerControl',
        command: command,
        params: params // Send the whole params object (background will extract needed parts)
    };

    try {
        port.postMessage(messageToSend);
    } catch (e) {
        console.error(`Failed to post debugger command '${command}' message:`, e);
        callback(new Error(`Communication error sending debugger command: ${e.message}`));
        delete pendingDebuggerCallbacks[messageId];
    }
}


// --- Expose Helpers Globally ---
// Make helper functions accessible to other scripts loaded in the panel context
// (like annotate-elements.js, evaluate-selection.js)
window.executeScriptInPageContext = executeScriptInPageContext;
window.sendPanelDebuggerCommand = sendPanelDebuggerCommand;
// If using a shared Utils object:
// if (typeof Utils !== 'undefined' && Utils && typeof Utils === 'object') {
//     Utils.executeScriptInPageContext = executeScriptInPageContext;
//     Utils.sendPanelDebuggerCommand = sendPanelDebuggerCommand;
// }

// --- END: Communication Helpers ---


// Original panel.js code starts here (with added checks and warnings)
$(function () {

    // Initial tab setup
    $('#workspace-tab').addClass('active');
    $('#project-tab').removeClass('active');
    $('#editor-tab').removeClass('active');
    $('#workspace').show();
    $('#project').hide();
    $('#pyEditor').hide();

    // Load initial workspace content
    $('#workspace').load('./html/workspace.html', function (response, status, xhr) {
        if (status === "error") {
            console.error("Error loading workspace.html:", xhr.status, xhr.statusText);
            alert("Error loading workspace UI. Please try reloading the extension.");
            return;
        }
        // Initialize workspace specific JS and keyboard shortcuts
        loadWorkspaceTab();
        enableKeyboardShortcut();
    });

    // --- Tab Click Handlers ---
    document.getElementById("workspace-tab")?.addEventListener("click", function () {
        $('#workspace-tab').addClass('active');
        $('#project-tab').removeClass('active');
        $('#editor-tab').removeClass('active');
        $('#workspace').show();
        $('#project').hide();
        $('#pyEditor').hide();

        // Reload workspace content or just ensure its JS is initialized
        if ($('#workspace').is(':empty')) { // Avoid reloading if already loaded
             $('#workspace').load('./html/workspace.html', function (response, status, xhr) {
                 if (status === "error") {
                     console.error("Error loading workspace.html:", xhr.status, xhr.statusText);
                     return;
                 }
                 loadWorkspaceTab();
             });
        } else {
            // If content is already there, maybe just re-run initialization if needed
            // loadWorkspaceTab(); // Or parts of it if necessary
        }
    });

    document.getElementById("project-tab")?.addEventListener("click", function (event) {
        $('#project-tab').addClass('active');
        $('#workspace-tab').removeClass('active');
        $('#editor-tab').removeClass('active');
        $('#pyEditor').hide();
        $('#project').show();
        $('#workspace').hide();

        if ($('#project').is(':empty')) {
            $('#project').load('./html/project.html', function (response, status, xhr) {
                if (status === "error") {
                    console.error("Error loading project.html:", xhr.status, xhr.statusText);
                    return;
                }
                if (typeof LoadProjectTab === 'function') LoadProjectTab(); // Check if imported function exists
                else console.error("LoadProjectTab function not found.");
            });
        } else {
             if (typeof LoadProjectTab === 'function') LoadProjectTab(); // Re-initialize if needed
             else console.error("LoadProjectTab function not found.");
        }
    });

    document.getElementById("editor-tab")?.addEventListener('click', function() {
        $('#project-tab').removeClass('active');
        $('#workspace-tab').removeClass('active');
        $('#editor-tab').addClass('active');
        $('#pyEditor').show();
        $('#project').hide();
        $('#workspace').hide();
        
        if ($('#pyEditor').is(':empty')) {
            $('#pyEditor').load('./html/code-editor.html', function (response, status, xhr) {
                 if (status === "error") {
                     console.error("Error loading code-editor.html:", xhr.status, xhr.statusText);
                     return;
                 }
                if (typeof loadEditorTab === 'function') loadEditorTab(); // Check if imported function exists
                else console.error("loadEditorTab function not found.");
            });
        } else {
             if (typeof loadEditorTab === 'function') loadEditorTab(); // Re-initialize if needed
             else console.error("loadEditorTab function not found.");
        }
    })

}); // End of jQuery ready function

// --- Functions from Original panel.js (with added checks and warnings) ---

function setRestorePreviousSourceSession() {
    let restoredSource = document.getElementById('restored-source-select');
    if (!restoredSource) return;

    let selectedProject = sessionStorage["selectedProject"] !== "null" && sessionStorage["selectedProject"] ? sessionStorage["selectedProject"] : sessionStorage["newProject"];
    let isDefaultOptionEnabled = false;

    let setRestoreSessionOptions = function (key, value) {
        var option = document.createElement("option");
        option.value = key;
        option.text = value.charAt(0).toUpperCase() + value.slice(1);
        restoredSource.appendChild(option);
    };

    restoredSource.options.length = 0;
    setRestoreSessionOptions("", "-- select --");

    for (let [key, value] of Object.entries(localStorage)) {
        if (key.startsWith('authScriptObject-')) {
            let parts = key.split('-', 2);
            if (parts.length === 2) {
                let sourceName = parts[1];
                setRestoreSessionOptions(sourceName, sourceName);
                if (!selectedProject) selectedProject = sourceName;
            }
        }
    }

    if (selectedProject) restoredSource.value = selectedProject;

    restoredSource.addEventListener("change", function () {
        sessionStorage.setItem('selectedProject', this.value);
        const spProjectName = document.getElementById("sp_projectName");
        if (spProjectName) spProjectName.innerHTML = 'Project';
        if (this.value.length > 0) {
            const projectTab = document.getElementById("project-tab");
            if (projectTab) projectTab.click();
        }
    });

    let clearPreviousSessionBtnElem = document.getElementById("clearPreviousSessionBtn");
    if (clearPreviousSessionBtnElem) {
        clearPreviousSessionBtnElem.addEventListener("click", function () {
            for (let [key, value] of Object.entries(localStorage)) {
                if (key.startsWith('authScriptObject-')) localStorage.removeItem(key);
            }
            sessionStorage.removeItem("newProject");
            sessionStorage.removeItem("selectedProject");
            sessionStorage.removeItem("newStartUrl");
            sessionStorage.removeItem("customScriptAvailable");
            restoredSource.options.length = 0;
            setRestoreSessionOptions("", "-- select --");
            this.disabled = true;
            const spProjectName = document.getElementById("sp_projectName");
            if (spProjectName) spProjectName.innerHTML = 'Project';
        });
        clearPreviousSessionBtnElem.disabled = (restoredSource.options.length <= 1);
    }
}

async function loadWorkspaceTab() { // Made async
    setDefaultRootPathFiles(); 
    sessionStorage["currentTab"] = "workspace";
    let authToolVersionEle = document.getElementById("versionNumber");
    try {
        if (authToolVersionEle) authToolVersionEle.innerText = chrome.runtime.getManifest().version;
    } catch(error) {
        console.error("Error fetching version: " + error);
    }

    let selectDirBtn = document.getElementById("selectProjectDirBtn");
    let dirDisplay = document.getElementById("selectedProjectDirDisplay");

    if (selectDirBtn && dirDisplay) {
        selectDirBtn.addEventListener('click', async () => {
            try {
                const handle = await window.showDirectoryPicker();
                selectedDirectoryHandle = handle; 
                dirDisplay.textContent = handle.name; 
                console.log("Selected directory:", handle.name);
                
                const files = await fetchProjectList(true); // isRootPathDefault relevance might change
                registerProjectAutoComplete(files);
                // alert("Directory selected: " + handle.name + ". Projects listed."); // Removed alert

            } catch (err) {
                console.error("Error selecting or listing directory:", err);
                if (err.name !== 'AbortError') { 
                    alert("Error selecting directory or listing projects: " + err.message);
                }
                dirDisplay.textContent = "None";
                selectedDirectoryHandle = null;
                registerProjectAutoComplete({ harvesterFileNames: [], extractorFileNames: [], customScriptFileNames: [] }); 
            }
        });
    } else {
        console.warn("Could not find 'selectProjectDirBtn' or 'selectedProjectDirDisplay' in workspace tab.");
    }

    let sourceNameElem = document.getElementById("sourceNameTxt");
    let startUrlElem = document.getElementById("startUrlTxt");
    let inputCreateNewSource = {};

    const updateCreateButtonState = () => { inputCreateNewSource = handleCreateProjButton(); };
    if (sourceNameElem) sourceNameElem.addEventListener("keyup", updateCreateButtonState);
    if (startUrlElem) startUrlElem.addEventListener("keyup", updateCreateButtonState);

    let createProjBtn = document.getElementById("createProjBtn");
    if (createProjBtn) {
        createProjBtn.addEventListener("click", async function () { // Made async
            inputCreateNewSource = handleCreateProjButton();
            let sourceNameVal = inputCreateNewSource.sourceNameVal;
            let startUrlVal = inputCreateNewSource.startUrlVal;

            if (!sourceNameVal || !startUrlVal) {
                alert("Source Name and Start URL cannot be empty."); return;
            }
             if (!selectedDirectoryHandle) {
                alert("Please select a project directory first using the 'Select Project Directory' button.");
                return;
            }

            // 1. Check for existing project
            try {
                const existingFiles = await Utils.listFiles(selectedDirectoryHandle, { extractor: ['.extract'] });
                if (existingFiles.extractorFiles && existingFiles.extractorFiles.includes(`extractor/${sourceNameVal}.extract`)) {
                    alert("Project '" + sourceNameVal + "' already exists. Please choose a different name.");
                    return;
                }
            } catch (e) {
                console.error("Error checking for existing project:", e);
                alert("Error checking for existing project: " + e.message);
                return;
            }

            // Show a simple loading indicator
            const createBtnOriginalText = this.textContent;
            this.textContent = 'Creating...';
            this.disabled = true;

            try {
                // 2. Create Directories
                const harvesterDirHandle = await selectedDirectoryHandle.getDirectoryHandle('harvester', { create: true });
                const extractorDirHandle = await selectedDirectoryHandle.getDirectoryHandle('extractor', { create: true });
                const scriptsDirHandle = await selectedDirectoryHandle.getDirectoryHandle('scripts', { create: true });

                // 3 & 4. Prepare File Content
                const defaultHarvest = {
                    source: sourceNameVal,
                    proxy: { ip: "default", port: "" },
                    type: "html",
                    startUrl: startUrlVal,
                    payload: [], params: {}, options: {}, settings: {}, prepare: []
                };
                const defaultExtractor = { source: sourceNameVal };
                const defaultPythonScript = "# New Python script for " + sourceNameVal + "\n\n";

                // 5. Write Files
                async function writeFileToDisk(dirHandle, fileName, content) {
                    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(content);
                    await writable.close();
                }

                await writeFileToDisk(harvesterDirHandle, sourceNameVal + '.harvest', JSON.stringify(defaultHarvest, null, 2));
                await writeFileToDisk(extractorDirHandle, sourceNameVal + '.extract', JSON.stringify(defaultExtractor, null, 2));
                await writeFileToDisk(scriptsDirHandle, sourceNameVal + '.py', defaultPythonScript);
                
                alert("Project '" + sourceNameVal + "' created successfully!");

                // 6. Update Session Storage and Trigger Load
                sessionStorage["newProject"] = sourceNameVal.trim();
                sessionStorage["newStartUrl"] = startUrlVal.trim();
                sessionStorage.removeItem("selectedProject");
                sessionStorage["customScriptAvailable"] = "true"; // Since we created an empty .py file
                
                // Refresh the project list in autocomplete
                const files = await fetchProjectList(true); // isRootPathDefault is likely vestigial
                registerProjectAutoComplete(files);
                
                triggerClick(sourceNameVal); // Open the new project

            } catch (err) {
                console.error("Error creating project files:", err);
                alert("Error creating project files: " + err.message);
            } finally {
                this.textContent = createBtnOriginalText;
                this.disabled = false;
            }
        });
    }
    setRestorePreviousSourceSession();
    handleCreateProjButton(); 

    if (selectedDirectoryHandle) {
        try {
            const initialFiles = await fetchProjectList(true); // isRootPathDefault relevance might change
            registerProjectAutoComplete(initialFiles);
        } catch (e) {
            console.error("Error fetching initial project list:", e);
            alert("Error fetching initial project list: " + e.message);
        }
    }
}

function registerScriptPath() {
    console.warn("registerScriptPath is now obsolete and its functionality has been replaced by the 'Select Project Directory' button.");
}

function registerProjectAutoComplete(files) {
    const $autocompleteInput = $("#automplete-1");

    if ($autocompleteInput.data('ui-autocomplete')) { 
        try { $autocompleteInput.autocomplete("destroy"); } catch (e) { /* ignore */ }
    }
    $autocompleteInput.removeData('ui-autocomplete'); 

    const sourceFiles = (files && Array.isArray(files.extractorFileNames)) ? files.extractorFileNames : [];
    if (sourceFiles.length === 0) {
        console.warn("No extractor files found for autocomplete.");
    }

    $autocompleteInput.autocomplete({
        source: sourceFiles,
        minLength: 0, 
        select: async function (event, ui) { // Made async
            let selectedProjectName = ui.item.label;
            sessionStorage.removeItem("newProject");
            sessionStorage["selectedProject"] = selectedProjectName;
            
            const customScriptExists = (files.customScriptFileNames && files.customScriptFileNames.includes(ui.item.label));
            sessionStorage["customScriptAvailable"] = customScriptExists ? "true" : "false";

            let errorMsgWsInvalidFileLbl = document.getElementById('errorMsgWsInvalidFileLbl');
            let errorMsgWsFileLbl = document.getElementById('errorMsgWsFileLbl');
            if (errorMsgWsInvalidFileLbl) errorMsgWsInvalidFileLbl.style.display = 'none';
            if (errorMsgWsFileLbl) errorMsgWsFileLbl.style.display = 'none';

            const harvesterExists = files.harvesterFileNames && files.harvesterFileNames.includes(ui.item.label);

            if (harvesterExists) { 
                if (await isValidJson(ui.item.label)) { 
                    triggerClick(ui.item.label); 
                } else {
                    if (errorMsgWsInvalidFileLbl) {
                         errorMsgWsInvalidFileLbl.innerHTML = `Error: ${ui.item.label}.harvest or .extract is not valid JSON or not found.`;
                         errorMsgWsInvalidFileLbl.style.cssText = 'display:block; color: red; width: 100%;';
                    }
                }
            } else {
                if (errorMsgWsFileLbl) {
                    errorMsgWsFileLbl.innerHTML = `Error: Corresponding .harvest file for ${ui.item.label} not found.`;
                    errorMsgWsFileLbl.style.cssText = 'display:block; color: red; width: 100%;';
                }
            }
            event.preventDefault();
            $autocompleteInput.blur(); 
        }
    }).focus(function(){
        if (sourceFiles.length > 0) { 
            $(this).autocomplete("search", $(this).val()); 
        }
    });
}


function triggerClick(itemName) {
    const projectTab = document.getElementById("project-tab");
    if (projectTab) {
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
        projectTab.dispatchEvent(clickEvent);
    } else {
        console.error("Project tab element not found for triggerClick.");
    }
}

async function fetchProjectList(isRootPathDefault) { // filePath parameter is removed, made async
    console.log("Refactored fetchProjectList called.");
    if (!selectedDirectoryHandle) {
        console.warn("fetchProjectList: No directory selected.");
        return { harvesterFileNames: [], extractorFileNames: [], customScriptFileNames: [], commonScriptFileNames: [] };
    }

    // Define the structure to scan
    const subdirectoriesToScan = {
        extractor: ['.extract'],
        harvester: ['.harvest'],
        scripts: ['.py'] 
    };

    const categorizedFiles = await Utils.listFiles(selectedDirectoryHandle, subdirectoriesToScan);

    // Extract base names for extractor files, as this seems to be used as "project names"
    const extractorBaseNames = (categorizedFiles.extractorFiles || []).map(fname => fname.substring(fname.lastIndexOf('/') + 1).replace('.extract', ''));
    
    const harvesterBaseNames = (categorizedFiles.harvesterFiles || []).map(fname => fname.substring(fname.lastIndexOf('/') + 1).replace('.harvest', ''));
    const customScriptBaseNames = (categorizedFiles.scriptsFiles || []).map(fname => fname.substring(fname.lastIndexOf('/') + 1).replace('.py', ''));

    let commonScriptFileNames = [];
    try {
        const scriptsDirHandle = await selectedDirectoryHandle.getDirectoryHandle('scripts');
        const commonUtilsDirHandle = await scriptsDirHandle.getDirectoryHandle('commonutils');
        const commonUtilsResult = await Utils.listFiles(commonUtilsDirHandle, {}, ['.py']); 
        commonScriptFileNames = (commonUtilsResult.rootFiles || []).map(fname => fname.replace('.py', ''));
    } catch (e) {
        if (e.name === 'NotFoundError') {
             console.log("Could not find 'scripts/commonutils' directory. Common scripts may be missing.");
        } else {
            console.log("Error accessing 'scripts/commonutils':", e.name, e.message);
        }
    }

    const filenames = {
        harvesterFileNames: harvesterBaseNames, 
        extractorFileNames: extractorBaseNames, 
        customScriptFileNames: customScriptBaseNames, 
        fullPathExtractorFiles: categorizedFiles.extractorFiles || [],
        fullPathHarvesterFiles: categorizedFiles.harvesterFiles || [],
        commonScriptFileNames: commonScriptFileNames 
    };
    
    setStaticImports(commonScriptFileNames || [], isRootPathDefault); // isRootPathDefault might be less relevant now
    console.log("fetchProjectList results:", filenames);
    return filenames;
}


function setStaticImports(commonScriptFileNames, isRootPathDefault) {
    let staticImportList = "";
    if (isRootPathDefault && Array.isArray(commonScriptFileNames)) { // isRootPathDefault might need re-evaluation
        commonScriptFileNames.forEach((file) => {
            staticImportList += `import ${file}\n`; 
        });
    }
    localStorage["pythonImport-git"] = staticImportList;
}

function setDefaultRootPathFiles() {
    const configFileUrl = chrome.runtime.getURL('UHChromeExtentionConfig.txt');
    fetch(configFileUrl)
        .then(response => {
            if (!response.ok) throw new Error(`Config fetch failed: ${response.status}`);
            return response.text();
        })
        .then(text => {
            const lines = text.split('\n');
            let parsedFilePath = ""; let parsedConfigList = "";
            lines.forEach(line => {
                if (line.startsWith("DEFAULT_GIT_PATH=")) parsedFilePath = line.substring("DEFAULT_GIT_PATH=".length).trim().replace(/,$/, "");
                else if (line.startsWith("PYTHON_IMPORT_CONFIG=")) parsedConfigList = line.substring("PYTHON_IMPORT_CONFIG=".length).trim().replace(/,$/, "");
            });

            localStorage["rootPathGitPath"] = parsedFilePath || ""; 
            localStorage["pythonImport-config"] = parsedConfigList || "";
        })
        .catch(error => {
            console.error("Error fetching/processing UHChromeExtentionConfig.txt:", error);
            alert("CRITICAL ERROR: Could not load UHChromeExtentionConfig.txt. Default paths not set.");
            localStorage["rootPathGitPath"] = ""; localStorage["pythonImport-config"] = ""; 
        });
}


function enableKeyboardShortcut() {
    document.body.removeEventListener('keyup', keyeventtarget);
    document.body.addEventListener('keyup', keyeventtarget);
}

function keyeventtarget(eventFunction) {
    let eventFunctionKeyName = getEventFunctionKeyName(eventFunction);
    let keyName = eventFunction.key;
    if (keyName === 'Alt' && !eventFunction.ctrlKey && !eventFunction.shiftKey && !eventFunction.metaKey) return;
    
    try {
        const url = chrome.runtime.getURL('./keyboard-shortcut-config.json');
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`Keyboard config fetch failed: ${response.status}`);
                return response.json();
            })
            .then(configData => handleKeyboardShortcut(configData, eventFunctionKeyName, keyName))
            .catch(error => console.error("Error processing keyboard shortcut config:", error));
    } catch(error) {
        console.error("Error getting URL for keyboard config:", error);
    }
}

function handleKeyboardShortcut(configData, eventFunctionKeyName, keyName) {
    let userAction = getKeyPressedName(configData, eventFunctionKeyName, keyName);
    if (!userAction) return;

    const dispatchClick = (id) => {
        const el = document.getElementById(id);
        if (el && typeof el.click === 'function') el.click();
        else if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    };
    const focusElement = (id) => {
        const el = document.getElementById(id);
        if (el && typeof el.focus === 'function') el.focus();
    };

    switch (userAction) {
        case 'openWorkspaceTab': dispatchClick('workspace-tab'); break;
        case 'openProjectTab':   dispatchClick('project-tab');   break;
        case 'openDebugTab':     dispatchClick('debug-tab');     break;
        case 'openEditorTab':    dispatchClick('editor-tab');    break;
        case 'selectProject':    focusElement('automplete-1');   break;
        case 'saveProject':      dispatchClick('btnSave');       break;
        case 'exportProject':    dispatchClick('btnExport');     break;
        case 'focusNewSource':   focusElement('sourceNameTxt');  break;
        case 'createNewSource':  dispatchClick('createProjBtn'); break;
        case 'focusProjectEditor':
            const harvestorElemNode = document.getElementById('uh_editor_txtNodeId');
            const extractorElemNode = document.getElementById('uh_editor_txtFeildName');
            if (harvestorElemNode) harvestorElemNode.focus();
            else if (extractorElemNode) extractorElemNode.focus();
            break;
        case 'focusOnFirstTreeNode':
            const treeNode = document.getElementById('tree');
            if (treeNode) {
                const firstLi = treeNode.querySelector('li:first-child > span');
                if (firstLi && typeof firstLi.click === 'function') firstLi.click();
                else if (firstLi) firstLi.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            }
            break;
        case 'openContextMenuForSelectedNode':
            const tree = document.getElementById('tree');
            if (tree) {
                const selectedNodeSpan = tree.querySelector(".node_selected");
                if (selectedNodeSpan && typeof selectedNodeSpan.oncontextmenu === 'function') {
                    selectedNodeSpan.oncontextmenu(new MouseEvent('contextmenu', { bubbles: true, cancelable: false, view: window, button: 2, buttons: 0, clientX: selectedNodeSpan.getBoundingClientRect().x, clientY: selectedNodeSpan.getBoundingClientRect().y }));
                }
            }
            break;
        case 'executeFirstCtxMenuItem': case 'executeSecondCtxMenuItem': case 'executeThirdCtxMenuItem': case 'executeFourthCtxMenuItem':
            if (isAnyCtxMenuOpened()) {
                let itemIndex = 0;
                if (userAction === 'executeFirstCtxMenuItem') itemIndex = 1;
                else if (userAction === 'executeSecondCtxMenuItem') itemIndex = 2;
                else if (userAction === 'executeThirdCtxMenuItem') itemIndex = 3;
                else if (userAction === 'executeFourthCtxMenuItem') itemIndex = 4;
                const ctxMenuItem = getElementOfCtxMenuItem(itemIndex);
                if (ctxMenuItem) {
                    const ctxMenuItemSpan = ctxMenuItem.querySelector('span');
                    if (ctxMenuItemSpan && typeof ctxMenuItemSpan.click === 'function') ctxMenuItemSpan.click();
                    else if (ctxMenuItemSpan) ctxMenuItemSpan.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                    const allCtxMenus = document.getElementsByClassName("menu");
                    for (let menu of allCtxMenus) { menu.style.display = 'none'; }
                }
            }
            break;
        case 'togglePointAndClick': dispatchClick('btnAnnotate'); break;
        default: break;
    }
}


function getKeyPressedName(configData, commandKey, keyName) {
    if (!configData) return null;
    const keyToLookup = (commandKey ? commandKey + "_" : "") + keyName.toLowerCase();
    return configData[keyToLookup];
}

function getEventFunctionKeyName(eventFunction) {
    if (eventFunction.altKey) return "alt";
    if (eventFunction.ctrlKey) return "ctrl";
    if (eventFunction.shiftKey) return "shift";
    if (eventFunction.metaKey) return "meta";
    return null;
}

function handleCreateProjButton() {
    let sourceNameElem = document.getElementById("sourceNameTxt");
    let startUrlElem = document.getElementById("startUrlTxt");
    let createProjBtnElem = document.getElementById("createProjBtn");
    let sourceNameVal = sourceNameElem ? sourceNameElem.value.trim() : "";
    let startUrlVal = startUrlElem ? startUrlElem.value.trim() : "";
    if (createProjBtnElem) createProjBtnElem.disabled = !(sourceNameVal && startUrlVal);
    return { sourceNameVal, startUrlVal };
}


function isAnyCtxMenuOpened() {
    const menuElements = document.getElementsByClassName("menu");
    if (menuElements) {
        for (let i = 0; i < menuElements.length; i++) {
            if (menuElements[i].style.display === "block") return true;
        }
    }
    return false;
}


function getElementOfCtxMenuItem(index) {
    if (index < 1) return null;
    const menuElements = document.getElementsByClassName("menu");
    if (menuElements) {
        for (let i = 0; i < menuElements.length; i++) {
            if (menuElements[i].style.display === "block") {
                const items = menuElements[i].getElementsByTagName('li');
                if (items && index <= items.length) return items[index - 1];
            }
        }
    }
    return null;
}

async function isValidJson(projectname) { // Made async
    if (!selectedDirectoryHandle) {
        console.error("isValidJson: No directory selected.");
        return false;
    }
    if (!projectname) {
        console.error("isValidJson: No project name provided.");
        return false;
    }

    const extractorPath = `extractor/${projectname}.extract`;
    const harvesterPath = `harvester/${projectname}.harvest`;

    try {
        const extractorContent = await Utils.readFileContent(selectedDirectoryHandle, extractorPath);
        if (extractorContent === null) {
            console.warn(`isValidJson: Could not read ${extractorPath}`);
            return false;
        }
        JSON.parse(extractorContent);

        const harvesterContent = await Utils.readFileContent(selectedDirectoryHandle, harvesterPath);
        if (harvesterContent === null) {
            console.warn(`isValidJson: Could not read ${harvesterPath}`);
            return false;
        }
        JSON.parse(harvesterContent);
        
        return true;
    } catch (e) {
        console.error(`isValidJson: Error parsing JSON for project '${projectname}':`, e);
        return false;
    }
}
