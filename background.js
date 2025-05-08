// File: extension/background.js
// Service worker for the UH Script Auth Tool Extension.
// Handles communication with the side panel, script execution, and debugger interactions.

'use strict';

// Disable download shelf if API is available (Manifest V3 generally doesn't show it anyway)
if (chrome.downloads && chrome.downloads.setShelfEnabled) {
  try {
    chrome.downloads.setShelfEnabled(false);
  } catch (e) {
    // console.warn("Could not disable download shelf:", e.message);
  }
}

// --- Debugger State Management ---
// Keep track of tabs we have attached the debugger to
const attachedTabs = new Map(); // Map<tabId, { port: chrome.runtime.Port }>

// --- Helper Functions ---

/**
 * Sends a response message back to the panel via the specified port.
 * @param {chrome.runtime.Port} port The port connected to the panel.
 * @param {string} originalMessageId The ID of the message being responded to.
 * @param {string} type The type of the response message.
 * @param {any} [result] The result payload (optional).
 * @param {boolean} [isException=false] Whether an exception occurred.
 * @param {object} [errorDetails=null] Details about the exception (optional).
 */
function sendResponseToPanel(port, originalMessageId, type, result = null, isException = false, errorDetails = null) {
  if (port && originalMessageId) {
    try {
      port.postMessage({
        originalMessageId: originalMessageId,
        type: type,
        result: result,
        isException: isException,
        errorDetails: errorDetails
      });
    } catch (e) {
      console.error(`Background: Failed to post message back to panel for ${originalMessageId}. Port disconnected?`, e);
      // Attempt to clean up debugger state if port is disconnected during an operation
      if (type === 'debuggerCommandResult' || type === 'scriptExecutionResult') {
         // Find tabId associated with this port if possible (might need better tracking)
         for (let [tabId, data] of attachedTabs.entries()) {
            if (data.port === port) {
                console.warn(`Port disconnected for tab ${tabId}. Attempting to detach debugger.`);
                forceDetachDebugger(tabId);
                break;
            }
         }
      }
    }
  } else {
    console.warn("Background: Cannot send response to panel. Port or originalMessageId missing.", { portExists: !!port, originalMessageId });
  }
}

/**
 * Wraps chrome.debugger commands in Promises for easier async/await usage.
 * @param {string} command 'attach', 'detach', or 'sendCommand'
 * @param {object} target Debuggee target {tabId}
 * @param {any[]} args Additional arguments for the command (e.g., version for attach, method/params for sendCommand)
 * @returns {Promise<any>} Resolves with the result or rejects with an error.
 */
function debuggerCommandAsync(command, target, ...args) {
    return new Promise((resolve, reject) => {
        chrome.debugger[command](target, ...args, (result) => {
            if (chrome.runtime.lastError) {
                console.warn(`Debugger ${command} error for tab ${target.tabId}:`, chrome.runtime.lastError.message);
                return reject(chrome.runtime.lastError);
            }
            resolve(result);
        });
    });
}

/**
 * Forcefully tries to detach the debugger from a tab, ignoring errors.
 * Used for cleanup when port disconnects or errors occur.
 * @param {number} tabId
 */
async function forceDetachDebugger(tabId) {
    if (attachedTabs.has(tabId)) {
        console.log(`Force detaching debugger from tab ${tabId}`);
        try {
            await debuggerCommandAsync('detach', { tabId });
        } catch (e) {
            // Ignore errors during force detach
            // console.warn(`Ignoring error during force detach for tab ${tabId}:`, e.message);
        } finally {
            attachedTabs.delete(tabId);
        }
    }
}


// --- Main Connection Listener ---

chrome.runtime.onConnect.addListener(function(port) {
  // Ensure the connection is from our expected panel port (optional but good practice)
  console.assert(port.name === "uh_script_auth_tool_port" || port.name === "Evaluate Selection"); // Allow both ports
  console.log(`Background: Connection established from port "${port.name}"`);

  // Listener for messages received FROM this specific panel port
  var extensionListener = async function(message, senderPort) { // Make listener async
    // console.log("Background received message:", message); // For debugging

    if (!message || !message.action) {
        console.warn("Background received invalid message:", message);
        return;
    }

    const { action, tabId, content, messageId, command, params, expression, frameUrl, isSelector } = message;

    // --- Script Execution Actions ---
    if (action === 'code' || action === 'script' || action === 'link') {
      if (typeof tabId !== 'number') {
        console.error(`Background: Received ${action} action without valid tabId.`, message);
        sendResponseToPanel(port, messageId, "scriptExecutionResult", null, true, { description: `Invalid or missing tabId for action '${action}'.` });
        return;
      }
      if (!content) {
         console.error(`Background: Received ${action} action without content.`, message);
         sendResponseToPanel(port, messageId, "scriptExecutionResult", null, true, { description: `Missing content for action '${action}'.` });
         return;
      }

      const executionTarget = { tabId: tabId };
      // TODO: Add frame targeting if needed based on message properties (e.g., frameUrl -> frameId resolution)
      // if (message.frameId) { executionTarget.frameIds = [message.frameId]; }

      let executionPromise;
      if (action === 'code') {
        executionPromise = chrome.scripting.executeScript({
          target: executionTarget,
          // Injecting code as a string via 'func' is generally safer than 'files' for dynamic content.
          // Ensure the content is actually executable JS code.
          // Using new Function() can sometimes help isolate scope but has limitations.
          // Directly using 'func' assumes 'content' is a valid function body or expression.
          // Let's try wrapping it for safety, assuming 'content' is a block of code or expression.
          func: (codeToRun) => {
            try {
              // Attempt to evaluate the code string.
              // This executes in the target page's context.
              // Be mindful of scope and potential side effects.
              return eval(codeToRun); // Using eval here based on original intent, but consider safer alternatives if possible.
                                      // For simple function calls, passing the function and args is better.
            } catch (e) {
              // Rethrow error to be caught by executeScript promise
              throw e;
            }
          },
          args: [content], // Pass the code string as an argument
          world: 'MAIN' // Execute in the main world to access page's JS context (use with caution)
        });
      } else { // action === 'script' or 'link' (treating 'link' as injecting a script file too)
        executionPromise = chrome.scripting.executeScript({
          target: executionTarget,
          files: [content], // 'content' should be a path relative to extension root
          world: 'MAIN' // Or 'ISOLATED' if preferred
        });
      }

      try {
        const injectionResults = await executionPromise;
        let finalResult = null;
        let exceptionInfo = null;
        // Process results (executeScript returns an array of results per frame injected)
        if (injectionResults && injectionResults.length > 0) {
           // For simplicity, take the result from the first frame (usually the main frame)
           const firstResult = injectionResults[0];
           if (firstResult.error) {
               console.warn(`Background: Script execution error in tab ${tabId}:`, firstResult.error);
               exceptionInfo = { description: firstResult.error.message || JSON.stringify(firstResult.error) };
           } else {
               finalResult = firstResult.result;
           }
        }
        sendResponseToPanel(port, messageId, "scriptExecutionResult", finalResult, !!exceptionInfo, exceptionInfo);

      } catch (error) {
        console.error(`Background: Error executing script/file "${content}" in tab ${tabId}:`, error);
        sendResponseToPanel(port, messageId, "scriptExecutionResult", null, true, { description: error.message || "Unknown script execution error." });
      }

    // --- Debugger Control Actions ---
    } else if (action === 'debuggerControl') {
        if (typeof tabId !== 'number') {
            console.error("Background: Received debuggerControl action without valid tabId.", message);
            sendResponseToPanel(port, messageId, "debuggerCommandResult", null, true, { description: "Invalid or missing tabId for debugger command." });
            return;
        }

        const debuggeeTarget = { tabId: tabId };

        switch (command) {
            case 'attach':
                if (attachedTabs.has(tabId)) {
                    console.warn(`Debugger already attached to tab ${tabId}.`);
                    sendResponseToPanel(port, messageId, "debuggerCommandResult", { status: "Already attached" }, false);
                    return;
                }
                try {
                    const version = params?.version || "1.3"; // Default to 1.3 if not specified
                    await debuggerCommandAsync('attach', debuggeeTarget, version);
                    console.log(`Debugger attached to tab ${tabId}`);
                    attachedTabs.set(tabId, { port: port }); // Store the port associated with this tab

                    // Enable necessary domains AFTER successful attach
                    console.log(`Enabling domains for tab ${tabId}...`);
                    await debuggerCommandAsync('sendCommand', debuggeeTarget, "Runtime.enable");
                    await debuggerCommandAsync('sendCommand', debuggeeTarget, "DOM.enable");
                    await debuggerCommandAsync('sendCommand', debuggeeTarget, "Overlay.enable");
                    console.log(`Domains enabled for tab ${tabId}.`);

                    sendResponseToPanel(port, messageId, "debuggerCommandResult", { status: "Attached and domains enabled" }, false);
                } catch (error) {
                    console.error(`Failed to attach debugger or enable domains for tab ${tabId}:`, error);
                    attachedTabs.delete(tabId); // Clean up state on failure
                    sendResponseToPanel(port, messageId, "debuggerCommandResult", null, true, { description: error.message || "Failed to attach debugger or enable domains." });
                }
                break;

            case 'detach':
                if (!attachedTabs.has(tabId)) {
                    console.warn(`Debugger not attached to tab ${tabId}, cannot detach.`);
                    sendResponseToPanel(port, messageId, "debuggerCommandResult", { status: "Not attached" }, false);
                    return;
                }
                try {
                    await debuggerCommandAsync('detach', debuggeeTarget);
                    console.log(`Debugger detached from tab ${tabId}`);
                    attachedTabs.delete(tabId); // Clean up state
                    sendResponseToPanel(port, messageId, "debuggerCommandResult", { status: "Detached" }, false);
                } catch (error) {
                    console.error(`Failed to detach debugger for tab ${tabId}:`, error);
                    // Still remove from map even if detach fails? Maybe.
                    attachedTabs.delete(tabId);
                    sendResponseToPanel(port, messageId, "debuggerCommandResult", null, true, { description: error.message || "Failed to detach debugger." });
                }
                break;

            case 'sendCommand':
                if (!attachedTabs.has(tabId)) {
                    console.error(`Cannot send command to tab ${tabId}: Debugger not attached by this extension.`);
                    sendResponseToPanel(port, messageId, "debuggerCommandResult", null, true, { description: "Debugger not attached." });
                    return;
                }
                if (!params || !params.method) {
                     console.error("Background: Received sendCommand without method.", message);
                     sendResponseToPanel(port, messageId, "debuggerCommandResult", null, true, { description: "Missing 'method' for sendCommand." });
                     return;
                }
                try {
                    const result = await debuggerCommandAsync('sendCommand', debuggeeTarget, params.method, params.commandParams || {});
                    // console.log(`Debugger command '${params.method}' sent to tab ${tabId}. Result:`, result); // Optional logging
                    sendResponseToPanel(port, messageId, "debuggerCommandResult", result, false);
                } catch (error) {
                    console.error(`Error sending debugger command '${params.method}' to tab ${tabId}:`, error);
                    sendResponseToPanel(port, messageId, "debuggerCommandResult", null, true, { description: error.message || `Failed to send command '${params.method}'.` });
                }
                break;

            default:
                console.warn(`Background: Received unknown debugger command '${command}'.`, message);
                sendResponseToPanel(port, messageId, "debuggerCommandResult", null, true, { description: `Unknown debugger command '${command}'.` });
        }
    // --- Evaluate Selection Actions (Handled by Panel now via executeScriptInPageContext) ---
    // These messages might still come from content scripts directly to background?
    // If so, they need routing or handling here. The current panel implementation
    // assumes the panel initiates these evaluations now. Let's keep the original
    // message handling for evaluateSelection/evaluate/evaluateonselected minimal
    // unless we confirm they are still needed here.
    } else if (message.message === "evaluateSelection" || message.message === "evaluate" || message.message === "evaluateonselected") {
        // These are likely handled by the panel now using executeScriptInPageContext.
        // If these messages can still arrive directly at the background script (e.g., from a content script),
        // you would need to implement the logic here (similar to action: 'code')
        // and potentially route the result back to the correct panel port.
        console.warn(`Background received '${message.message}'. This should likely be handled by the panel now.`);
        // Example of forwarding to panel if needed (requires panel to listen):
        // port.postMessage(message);
    } else {
        // Handle other potential messages if necessary
        console.warn(`Background received unhandled message action/type: '${action || message.message}'`, message);
    }
  };

  port.onMessage.addListener(extensionListener);

  // --- Port Disconnect Handler ---
  port.onDisconnect.addListener(function(disconnectedPort) {
    console.log(`Background: Port "${disconnectedPort.name}" disconnected.`);
    // Clean up listeners associated with this port
    disconnectedPort.onMessage.removeListener(extensionListener);

    // Detach debugger from any tabs associated *only* with this disconnected port
    let tabsToDetach = [];
    for (let [tabId, data] of attachedTabs.entries()) {
        if (data.port === disconnectedPort) {
            tabsToDetach.push(tabId);
        }
    }
    tabsToDetach.forEach(tabId => {
        console.log(`Port disconnected, detaching debugger from tab ${tabId}`);
        forceDetachDebugger(tabId); // Use async helper
    });

    // Original logic to set storage on disconnect (might be related to DevTools closing)
    chrome.storage.local.set({ 'isDevToolShutDown': true }, function() {
      if (chrome.runtime.lastError) {
        console.error("Error setting isDevToolShutDown on port disconnect:", chrome.runtime.lastError);
      } else {
        // console.log("Data Saved Locally: isDevToolShutDown = true (on port disconnect)");
      }
    });
  });
});


// --- Debugger Event Listeners (Global) ---

chrome.debugger.onEvent.addListener((debuggeeTarget, method, params) => {
    // Find the port associated with this tabId
    const tabData = attachedTabs.get(debuggeeTarget.tabId);
    if (tabData && tabData.port) {
        // console.log(`Debugger event from tab ${debuggeeTarget.tabId}: ${method}`, params); // Debug logging
        // Forward relevant events to the panel
        // Example: Forward events needed for annotation/inspection
        if (method.startsWith("Overlay.") || method.startsWith("DOM.") || method.startsWith("Runtime.")) {
             try {
                tabData.port.postMessage({
                    type: "debuggerEventForward",
                    eventData: { method, params },
                    tabId: debuggeeTarget.tabId // Include tabId in case panel manages multiple
                });
             } catch (e) {
                 console.error(`Failed to forward debugger event ${method} to panel for tab ${debuggeeTarget.tabId}. Port disconnected?`, e);
                 forceDetachDebugger(debuggeeTarget.tabId);
             }
        }
    } else {
        // Event from a tab we didn't attach to or whose port disconnected? Ignore.
        // console.warn(`Received debugger event for unmanaged tab ${debuggeeTarget.tabId}: ${method}`);
    }
});

chrome.debugger.onDetach.addListener((debuggeeTarget, reason) => {
    console.log(`Debugger detached from tab ${debuggeeTarget.tabId}. Reason: ${reason}`);
    // Clean up our state if it hasn't been already
    if (attachedTabs.has(debuggeeTarget.tabId)) {
        const tabData = attachedTabs.get(debuggeeTarget.tabId);
        // Optionally notify the panel that the debugger detached unexpectedly
        if (tabData && tabData.port) {
            try {
                tabData.port.postMessage({ type: "debuggerDetached", tabId: debuggeeTarget.tabId, reason: reason });
            } catch(e) {
                console.warn("Failed to notify panel of debugger detach:", e);
            }
        }
        attachedTabs.delete(debuggeeTarget.tabId);
    }
});


// --- Extension Installation/Update Listener ---

chrome.runtime.onInstalled.addListener(function(details) {
  // Keep existing onInstalled logic if any (e.g., setting default color)
  chrome.storage.sync.set({ color: '#3aa757' }, function() { // Example from original file
    if (chrome.runtime.lastError) {
        console.error("Error setting color in chrome.storage.sync:", chrome.runtime.lastError);
    } else {
        // console.log("Default color set to green (existing onInstalled logic).");
    }
  });

  if (details.reason === "install") {
    console.log("UH Script Auth Tool has been installed. Find it in the browser's side panel!");
    // Example: Open a welcome page (optional)
    // chrome.tabs.create({ url: chrome.runtime.getURL("html/welcome.html") });
  } else if (details.reason === "update") {
    const previousVersion = details.previousVersion;
    const newVersion = chrome.runtime.getManifest().version;
    console.log(`UH Script Auth Tool has been updated from version ${previousVersion} to ${newVersion}. Find it in the browser's side panel!`);
    // Example: Open an update info page (optional)
    // chrome.tabs.create({ url: chrome.runtime.getURL("html/updated.html") });
  }
});

// --- Add this listener for the action icon click ---
chrome.action.onClicked.addListener((tab) => {
	// This function is called when the extension's icon is clicked.
	// Directly call open() as it requires being in response to the user gesture.
	if (tab.id) {
	  chrome.sidePanel.open({ tabId: tab.id })
		.catch(error => console.error(`Error opening side panel for tab ${tab.id}:`, error));
	} else {
	  // Fallback for scenarios where tabId might be missing (less common for action clicks)
	  chrome.sidePanel.open({ windowId: tab.windowId })
		 .catch(error => console.error(`Error opening side panel for window ${tab.windowId}:`, error));
	  console.warn("Opened side panel using windowId as tabId was missing from action click event.");
	}
  });


// --- Potentially Obsolete Code ---

// The BridgeFunction/ChildFunction seemed related to specific execution needs,
// potentially replaceable by standard scripting.executeScript usage.
// Keep if absolutely necessary, but review if they are still needed.
/*
const BridgeFunction = (arg) => { ... };
const ChildFunction = (arg) => { ... };
*/

// The userScripts registration seemed like a test. Commenting out.
/*
chrome.userScripts.register([{
    id: 'test_alert_userscript',
    matches: ['*://* /*'],
    js: [{ code: 'console.log("UH Script Auth Tool user script says Hi!");' }]
}]).catch(err => console.error("Error registering user script 'test_alert_userscript':", err));
*/

// General message listener (commented out in original).
// Enable if you need direct chrome.runtime.sendMessage communication
// in addition to the port connection.
/*
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("General message received in background:", request);
  // Handle general messages here...
  // IMPORTANT: Return true if sendResponse will be called asynchronously.
  // sendResponse({ message: 'Background script has received that message ⚡' });
});
*/

console.log("UH Script Auth Tool background script loaded.");
