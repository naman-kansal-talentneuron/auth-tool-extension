// File: extension/js/component/annotate-elements.js
// MODIFIED: Converted to ES6 class with default export.

// Ensure helper functions are globally available (e.g., window.executeScriptInPageContext, window.sendPanelDebuggerCommand)
// as this class relies on them.

export default class AnnotateElements {
    constructor() {
        this.debuggerAttached = false;
        this.debuggeeTarget = null; // Stores {tabId: id} for debugger commands
        this.init();
    }

    init() {
        this.registerEvents();
        // Add listener for debugger events forwarded from panel.js via CustomEvent
        window.addEventListener('debuggerEvent', this.handleDebuggerEvent.bind(this));
        // Add listener for unexpected detach events from panel.js via CustomEvent
        window.addEventListener('debuggerDetached', this.handleUnexpectedDetach.bind(this));
    }

    registerEvents() {
        var self = this;
        // Listener for messages posted WITHIN the panel's window context.
        window.addEventListener('message', function (event) {
            if (event.source !== window || typeof event.data !== 'object' || event.data === null) {
                return;
            }
            // Example: Check for a specific source property if you control the sender
            // if (event.data.source !== 'panel-internal-source') return;

            var message = event.data;
            if (!message.type) return;

            if (message.type === "MOUSE_OVER_EVENT") {
                self.handleMouseOver(message.element);
            } else if (message.type === "MOUSE_OUT_EVENT") {
                self.handleMouseOut(message.element);
            } else if (message.type === "MOUSE_CLICK_EVENT") {
                self.handleMouseClick(message.element);
            }
        });
    }

    // Handler for debugger events forwarded via CustomEvent from panel.js
    handleDebuggerEvent(event) {
        if (!event.detail) return;
        const method = event.detail.method;
        const params = event.detail.params;
        // console.log("Annotator received debugger event via CustomEvent:", method, params);
        if (method === 'Overlay.inspectNodeRequested' && params && params.backendNodeId) {
            console.log("Node inspection requested for backendNodeId:", params.backendNodeId);
            // displayNodeInfo(params.backendNodeId); // Example action
        }
        // Handle other relevant debugger events...
    }

    // Handler for unexpected debugger detach events forwarded via CustomEvent from panel.js
    handleUnexpectedDetach(event) {
        if (!event.detail) return;
        console.warn(`Annotator notified of unexpected detach for tab ${event.detail.tabId}, reason: ${event.detail.reason}`);
        if (this.debuggeeTarget && this.debuggeeTarget.tabId === event.detail.tabId) {
            this.debuggerAttached = false;
            this.debuggeeTarget = null;
            // Update UI elements (e.g., disable annotation button)
            const annotateButton = document.getElementById('btnAnnotate');
            if (annotateButton) annotateButton.classList.remove('active');
        }
    }

    attachDebugger(callback) {
        var self = this;
        if (typeof window.sendPanelDebuggerCommand !== 'function') {
            console.error("AnnotateElements: sendPanelDebuggerCommand helper missing.");
            if (typeof callback === 'function') callback(new Error("Debugger communication helper missing."));
            return;
        }

        window.sendPanelDebuggerCommand(
            'attach', { version: "1.3" },
            function(error, result) {
                if (error) {
                    console.error("Failed to attach debugger via background:", error);
                    self.debuggerAttached = false; self.debuggeeTarget = null;
                    if (typeof callback === 'function') callback(error);
                    return;
                }
                console.log("Debugger attach sequence successful via background. Result:", result);
                self.debuggerAttached = true;
                // Get and store the target tabId after successful attach
                chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                     if (tabs && tabs.length > 0) {
                         self.debuggeeTarget = { tabId: tabs[0].id };
                     } else {
                         console.error("Attach successful, but failed to get active tabId to store.");
                         // Detach might be needed if we can't store target
                         self.detachDebugger(); // Attempt cleanup
                     }
                });
                if (typeof callback === 'function') callback(null); // Success
            }
        );
    }

    detachDebugger(callback) {
        var self = this;
        if (!this.debuggeeTarget || typeof this.debuggeeTarget.tabId !== 'number') {
            this.debuggerAttached = false; // Ensure state consistency
            if (typeof callback === 'function') callback(null); return;
        }
        if (typeof window.sendPanelDebuggerCommand !== 'function') {
            console.error("AnnotateElements: sendPanelDebuggerCommand helper missing.");
            if (typeof callback === 'function') callback(new Error("Debugger communication helper missing."));
            return;
        }

        window.sendPanelDebuggerCommand(
            'detach', { tabId: this.debuggeeTarget.tabId },
            function(error, result) {
                if (error) console.error("Failed to detach debugger via background:", error);
                else console.log("Debugger detach successful via background. Result:", result);
                self.debuggerAttached = false; self.debuggeeTarget = null;
                if (typeof callback === 'function') callback(error);
            }
        );
    }

    executeScript(script, callback) {
        if (typeof window.executeScriptInPageContext === 'function') {
            window.executeScriptInPageContext(script, null, callback);
        } else {
            console.error("AnnotateElements: executeScriptInPageContext helper missing.");
            if (typeof callback === 'function') {
                callback(null, { isException: true, isError: true, description: "Helper function missing.", value: "HELPER_MISSING" });
            }
        }
    }

    drawBorder(nodeId, callback) {
        if (typeof nodeId !== 'number') {
            if (typeof callback === 'function') callback(null, { isException: true, description: "Invalid nodeId"}); return;
        }
        var script = `if(typeof drawBorder === 'function'){ drawBorder(${nodeId}); } else { console.warn('drawBorder not found.'); }`;
        this.executeScript(script, callback);
    }

    removeBorder(nodeId, callback) {
         if (typeof nodeId !== 'number') {
            if (typeof callback === 'function') callback(null, { isException: true, description: "Invalid nodeId"}); return;
        }
        var script = `if(typeof removeBorder === 'function'){ removeBorder(${nodeId}); } else { console.warn('removeBorder not found.'); }`;
        this.executeScript(script, callback);
    }

    addOverlay(nodeId, message, callback) {
        if (typeof nodeId !== 'number') {
            if (typeof callback === 'function') callback(null, { isException: true, description: "Invalid nodeId"}); return;
        }
        const escapedMessage = JSON.stringify(message || "");
        var script = `if(typeof addOverlay === 'function'){ addOverlay(${nodeId}, ${escapedMessage}); } else { console.warn('addOverlay not found.'); }`;
        this.executeScript(script, callback);
    }

    handleMouseOver(elementDetails) {
        // console.log("Mouse Over received:", elementDetails);
        if (!this.debuggerAttached || !this.debuggeeTarget) return;
        if (elementDetails && typeof elementDetails.backendNodeId === 'number') {
            if (typeof window.sendPanelDebuggerCommand === 'function') {
                window.sendPanelDebuggerCommand(
                    'sendCommand',
                    {
                        tabId: this.debuggeeTarget.tabId,
                        method: "Overlay.highlightNode",
                        commandParams: {
                            highlightConfig: { showInfo: true, contentColor: { r: 111, g: 168, b: 220, a: 0.66 }, paddingColor: { r: 147, g: 196, b: 125, a: 0.55 }, borderColor: { r: 255, g: 229, b: 153, a: 0.66 }, marginColor: { r: 248, g: 189, b: 128, a: 0.66 } },
                            backendNodeId: elementDetails.backendNodeId
                        }
                    },
                    (error, result) => { if (error) console.error("Error highlighting node:", error); }
                );
            } else console.error("Cannot highlight: sendPanelDebuggerCommand missing.");
        }
    }

    handleMouseOut(elementDetails) {
        // console.log("Mouse Out received:", elementDetails);
        if (!this.debuggerAttached || !this.debuggeeTarget) return;
        if (typeof window.sendPanelDebuggerCommand === 'function') {
            window.sendPanelDebuggerCommand(
                'sendCommand',
                { tabId: this.debuggeeTarget.tabId, method: "Overlay.hideHighlight", commandParams: {} },
                (error, result) => { if (error) console.error("Error hiding highlight:", error); }
            );
        } else console.error("Cannot hide highlight: sendPanelDebuggerCommand missing.");
    }

    handleMouseClick(elementDetails) {
        // console.log("Mouse Click received:", elementDetails);
        if (!elementDetails) return;
        const xpathInput = document.getElementById('selectedElementXPathInput');
        if (xpathInput && typeof elementDetails.xPath === 'string') {
            xpathInput.value = elementDetails.xPath;
            xpathInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const textInput = document.getElementById('selectedElementTextInput');
         if (textInput && typeof elementDetails.selectedText === 'string') {
            textInput.value = elementDetails.selectedText;
            textInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        // Add logic for other fields...
    }
} // End of AnnotateElements class

// Note: No global instance (e.g., window.annotatorInstance) is created here.
// The importing module (project-tab.js) is responsible for creating an instance if needed.
