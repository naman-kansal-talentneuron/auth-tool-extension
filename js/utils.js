// File: extension/js/utils.js
// Contains utility functions.
// WARNING: fetchFileFromPath uses a synchronous XMLHttpRequest for file:/// URLs.
// This method is unreliable, insecure, blocks the UI, and requires specific browser
// settings ("Allow access to file URLs"). It MUST be replaced with a proper
// method (e.g., File System Access API or packaged files) before release.
// Use this restored version ONLY for temporary testing of other components.

export default class Utils {

    /**
     * @description Fetches file content from a given path using the ORIGINAL (problematic) method.
     * @param {String} path The path to the file (likely a file:/// path).
     * @returns {String} The content of the file, or null/throws error on failure.
     * * CRITICAL WARNING: This implementation uses synchronous XMLHttpRequest
     * for local file:/// paths. This is unreliable, insecure, blocks the UI,
     * and requires the user to enable "Allow access to file URLs" for the extension.
     * It is restored temporarily ONLY for testing other parts of the Side Panel migration.
     * It MUST be replaced with a proper API (e.g., File System Access API) later.
     */
    static fetchFileFromPath(path) {
        console.warn(`[TEMPORARY CODE] Utils.fetchFileFromPath is using the original synchronous XHR method for path: "${path}". This is unreliable and MUST be replaced.`);
        
        var request = new XMLHttpRequest();
        // Use 'false' for synchronous request - BLOCKS THE UI!
        request.open('GET', path, false); 
        request.send(null);

        // Check status - For file://, status 0 or 200 might indicate success depending on browser.
        // For http/https, status 200 is success.
        if (request.status === 200 || (request.responseURL && request.responseURL.startsWith("file:") && request.status === 0)) {
            return request.responseText;
        } else {
            // Log the error but allow execution to continue (original behavior might have implicitly done this)
            // Throwing an error might be better for debugging, but could break original workflows if they expected null/undefined on failure.
            console.error(`Utils.fetchFileFromPath: Failed to fetch "${path}". Status: ${request.status}`);
            // Decide what to return on failure based on how calling code handles it.
            // Returning null might be safer than throwing if original code didn't handle throws.
            // throw new Error(`Failed to fetch file: ${path}. Status: ${request.status}`); 
            return null; // Or potentially "" depending on expected behavior
        }
    }

    /**
     * @description Sets default element options if specific ones are not provided.
     * @param {object} options The options object to check and potentially modify.
     * @returns {object} The options object with defaults applied.
     */
    static setDefaultElementOptions(options) {
        // Check if options is null, undefined, or not an object, and initialize if necessary
        if (options == null || typeof options !== 'object') {
            options = {};
        }

        // Define default values
        const defaultOptions = {
            waitTime: 500, // Default wait time in milliseconds
            maxWaitTime: 30000, // Default maximum wait time
            // Add other default options as needed
            // e.g., defaultTimeout: 10000,
            // e.g., retryAttempts: 3,
        };

        // Apply defaults only if the specific option is missing in the provided object
        for (const key in defaultOptions) {
            if (options[key] === undefined) { // Use === undefined check to allow explicit null/0 values if intended
                options[key] = defaultOptions[key];
            }
        }

        return options;
    }

    /**
     * @description Generates a simple unique ID (useful for temporary element tracking, etc.).
     * Note: This is NOT cryptographically secure or guaranteed unique across sessions/reloads.
     * For persistent unique IDs, consider libraries like UUID.
     * @param {string} [prefix='id_'] Optional prefix for the ID.
     * @returns {string} A generated ID string.
     */
    static generateSimpleId(prefix = 'id_') {
        return prefix + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * @description Escapes HTML special characters to prevent XSS when inserting text into HTML.
     * @param {string} unsafeText The potentially unsafe text.
     * @returns {string} The escaped text.
     */
    static escapeHtml(unsafeText) {
        if (typeof unsafeText !== 'string') {
            // Convert non-strings (like numbers) to strings, handle null/undefined safely
            unsafeText = String(unsafeText ?? ''); 
        }
        return unsafeText
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }

    // Add any other general utility functions needed by the extension here...

} // End of Utils class
