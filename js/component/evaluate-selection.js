// File: extension/js/component/evaluate-selection.js
// Original file path might have been: c:\Users\naman\OneDrive\Desktop\auth-tool-extension\js\component\evaluate-selection.js
// This script runs in the side panel's context.
// It listens for messages on the "Evaluate Selection" port
// and uses the executeScriptInPageContext helper to run code in the active tab.

(function createChannel() {
    // Create a port with background page for continuous message communication.
    // This port is specific to the "Evaluate Selection" functionality.
    var port = chrome.runtime.connect({
        name: "Evaluate Selection" // Unique name for this communication channel
    });

    // Listen to messages intended for this specific "Evaluate Selection" port.
    port.onMessage.addListener(function (message) {
        
        // Handler for a message potentially sent from a content script after a browser action click.
        // NOTE: The original implementation `window.getSelection().toString()` runs in the PANEL's context.
        // If the intent was to get selection from the WEB PAGE, the content script that received
        // the browser action click event should get the selection and send it in the message.
        // Leaving as is, but flagging this potential architectural issue.
        if (message.message === "clickedBrowserAction") {
            var selectedElementInPanel = window.getSelection().toString(); // Gets selection within the side panel document.
            if (selectedElementInPanel.length > 0) {
                // console.log("Selection within panel detected (clickedBrowserAction):", selectedElementInPanel);
                port.postMessage({
                    "message": "selectedElement", // Sending back potentially unintended data
                    "selectedElement": selectedElementInPanel
                });
            }
            return; // Done handling this message type
        }

        // --- Refactored Handlers using executeScriptInPageContext ---

        // Handler for evaluating a custom expression string sent from another part of the extension.
        if (message.message === "evaluateSelection") {
            const scriptToRun = message.expression; // The JS expression string to evaluate
            // Original options are kept for reference, but frame targeting etc. needs specific handling if required.
            const originalOptions = { frameURL: message.frameUrl, useContentScriptContext: true };

            if (typeof window.executeScriptInPageContext === 'function') {
                // Use the helper function to execute the script in the active page context
                window.executeScriptInPageContext(
                    scriptToRun,
                    originalOptions, // Pass options (helper might ignore some)
                    function (result, isException) { // Callback receives result from background
                        // Send the result back through this specific "Evaluate Selection" port
                        port.postMessage({
                            "message": "selectionResult",
                            "result": result,
                            "isException": isException // Mapped exception object or null
                        });
                    }
                );
            } else {
                // Error handling if the helper function isn't available
                console.error("evaluate-selection.js: executeScriptInPageContext helper is not available.");
                port.postMessage({
                    "message": "selectionResult",
                    "result": null,
                    "isException": { isException: true, isError: true, description: "Helper function missing in panel.", value:"HELPER_MISSING" }
                });
            }
        
        // Handler for evaluating a predefined function to get detailed selection info (including XPath)
        } else if (message.message === "evaluate") {
            const originalOptions = { frameURL: message.frameUrl, useContentScriptContext: true };

            // Define the function to be executed IN THE TARGET PAGE'S CONTEXT.
            // This function relies on `UHDevTool.getXPath` being available on that page.
            const functionToExecuteInPage = function () {
                // Check if the required utility is present on the page
                if (typeof UHDevTool === 'undefined' || typeof UHDevTool.getXPath !== 'function') {
                    console.warn("UHDevTool.getXPath is not available on the inspected page.");
                    // Provide fallback data if the utility is missing
                    const selection = window.getSelection();
                    const selectedText = selection ? selection.toString() : "";
                     return {
                        "selectedText": selectedText,
                        "xPath": "UHDevTool.getXPath not available",
                        "startOffset": selection && selection.rangeCount > 0 ? selection.getRangeAt(0).startOffset : 0,
                        "endOffset": selection && selection.rangeCount > 0 ? selection.getRangeAt(0).endOffset : 0,
                        "container": "UHDevTool.getXPath not available" // XPath of common ancestor
                    };
                }

                // Proceed if the utility is found
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) { // No selection or range
                    return { "selectedText": "", "xPath": "", "startOffset": 0, "endOffset": 0, "container": "" };
                }
                const range = selection.getRangeAt(0);
                const container = range.commonAncestorContainer; // The node containing the selection
                const startOffset = range.startOffset;
                const endOffset = range.endOffset;
                const selectedText = selection.toString();
                let xPath = "";
                // Only try to get XPath if there's selected text and a valid container node
                if (selectedText.length > 0 && container && container.nodeType === Node.ELEMENT_NODE) { // Ensure it's an element node for XPath usually
                    try {
                        xPath = UHDevTool.getXPath(container);
                    } catch (e) {
                        console.error("Error getting XPath on page:", e);
                        xPath = "Error getting XPath";
                    }
                } else if (selectedText.length > 0 && container) {
                     // If container is not an element (e.g., text node), get XPath of parent element
                     let elementContainer = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;
                     if(elementContainer) {
                         try { xPath = UHDevTool.getXPath(elementContainer); } catch (e) { xPath = "Error getting parent XPath"; }
                     } else {
                         xPath = "Could not find suitable element for XPath";
                     }
                }
                return {
                    "selectedText": selectedText,
                    "xPath": xPath,
                    "startOffset": startOffset,
                    "endOffset": endOffset,
                    "container": xPath // Return the XPath of the container (or parent element)
                };
            }; // End of functionToExecuteInPage

            if (typeof window.executeScriptInPageContext === 'function') {
                // Convert the function to a string and make it self-executing for injection
                const scriptString = `(${functionToExecuteInPage.toString()})();`;
                
                window.executeScriptInPageContext(
                    scriptString,
                    originalOptions,
                    function (result, isException) { // Callback receives result from background
                        // Send result back via the "Evaluate Selection" port
                        port.postMessage({
                            "message": "selectionResult",
                            "result": result,
                            "isException": isException
                        });
                    }
                );
            } else {
                console.error("evaluate-selection.js: executeScriptInPageContext helper is not available.");
                 port.postMessage({
                    "message": "selectionResult",
                    "result": null,
                    "isException": { isException: true, isError: true, description: "Helper function missing in panel.", value:"HELPER_MISSING" }
                });
            }

        // Handler for evaluating selection but potentially only returning the selector (XPath).
        } else if (message.message === "evaluateonselected") {
            const originalOptions = { frameURL: message.frameUrl, useContentScriptContext: true };
            // Determine if only the selector is needed based on original logic (functionToExecute(true))
            const isSelectorOnly = true; 

            // Define the function to execute IN THE TARGET PAGE'S CONTEXT.
            // Takes an argument to determine return format. Relies on UHDevTool.getXPath.
            const functionToExecuteInPageWithArg = function (isSelectorArg) {
                // Check for required utility
                if (typeof UHDevTool === 'undefined' || typeof UHDevTool.getXPath !== 'function') {
                    console.warn("UHDevTool.getXPath is not available on the inspected page.");
                    if (isSelectorArg) return "UHDevTool.getXPath not available"; // Return error string if only selector needed
                    // Provide fallback object if full details needed
                    const selectionForError = window.getSelection();
                    const selectedTextForError = selectionForError ? selectionForError.toString() : "";
                    return {
                        "selectedText": selectedTextForError,
                        "xPath": "UHDevTool.getXPath not available",
                        "startOffset": 0, "endOffset": 0, "container": "UHDevTool.getXPath not available"
                    };
                }

                // Proceed if utility exists
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) {
                     return isSelectorArg ? "" : { "selectedText": "", "xPath": "", "startOffset": 0, "endOffset": 0, "container": "" };
                }
                const range = selection.getRangeAt(0);
                const container = range.commonAncestorContainer;
                const startOffset = range.startOffset;
                const endOffset = range.endOffset;
                const selectedText = selection.toString();
                let xPath = "";
                 if (selectedText.length > 0 && container && container.nodeType === Node.ELEMENT_NODE) {
                    try { xPath = UHDevTool.getXPath(container); } 
                    catch (e) { console.error("Error getting XPath on page:", e); xPath = "Error getting XPath"; }
                 } else if (selectedText.length > 0 && container) {
                     let elementContainer = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;
                     if(elementContainer) {
                         try { xPath = UHDevTool.getXPath(elementContainer); } catch (e) { xPath = "Error getting parent XPath"; }
                     } else {
                         xPath = "Could not find suitable element for XPath";
                     }
                 }

                // Return only XPath string or the full object based on the argument
                if (isSelectorArg) {
                    return xPath;
                } else {
                    return {
                        "selectedText": selectedText,
                        "xPath": xPath,
                        "startOffset": startOffset,
                        "endOffset": endOffset,
                        "container": xPath
                    };
                }
            }; // End of functionToExecuteInPageWithArg

            if (typeof window.executeScriptInPageContext === 'function') {
                // Construct the script string to pass the argument correctly
                const scriptWithArg = `(${functionToExecuteInPageWithArg.toString()})(${isSelectorOnly});`;
                
                window.executeScriptInPageContext(
                    scriptWithArg,
                    originalOptions,
                    function (result, isException) { // Callback receives result from background
                        // Send result back, including the original resultType hint
                        port.postMessage({
                            "message": "selectionResult",
                            "result": result,
                            "isException": isException,
                            "resultType": "selector" // Indicate selector was requested
                        });
                    }
                );
            } else {
                console.error("evaluate-selection.js: executeScriptInPageContext helper is not available.");
                port.postMessage({
                    "message": "selectionResult",
                    "result": null,
                    "isException": { isException: true, isError: true, description: "Helper function missing in panel.", value:"HELPER_MISSING" },
                    "resultType": "selector"
                });
            }
        } // End of evaluateonselected handler

    }); // End of port.onMessage.addListener

}()); // End of IIFE
