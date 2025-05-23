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

    /**
     * Lists files in a given directory, optionally filtering by extensions.
     * Can look into predefined subdirectories like 'extractor', 'harvester', 'scripts'.
     * @param {FileSystemDirectoryHandle} directoryHandle The handle to the directory.
     * @param {object} subdirectories Optional object specifying subdirectories to scan for specific extensions. 
     *                                  Example: { extractor: ['.extract'], harvester: ['.harvest'], scripts: ['.py'] }
     * @param {string[]} rootExtensions Optional array of extensions to look for in the root directory.
     * @returns {Promise<object>} A promise that resolves to an object containing arrays of file names, 
     *                            categorized by their type (e.g., extractorFiles, harvesterFiles, scriptFiles, rootFiles).
     *                            Example: { extractorFiles: ['a.extract'], harvesterFiles: ['b.harvest'], scriptFiles: ['c.py'], rootFiles: ['d.txt'] }
     */
    static async listFiles(directoryHandle, subdirectories = {}, rootExtensions = []) {
        const categorizedFiles = {};
        if (!directoryHandle) {
            console.warn("listFiles: directoryHandle is null.");
            return categorizedFiles;
        }

        // Helper function to process a directory
        async function processDirectory(dirHandle, extensions, category, pathPrefix = "") {
            const filesInCategory = [];
            try {
                for await (const entry of dirHandle.values()) {
                    try { // New try-catch for individual entry processing
                        if (entry.kind === 'file') {
                            if (extensions.length === 0 || extensions.some(ext => entry.name.endsWith(ext))) {
                                filesInCategory.push(pathPrefix + entry.name);
                            }
                        } else if (entry.kind === 'directory') {
                            // Current design doesn't recurse into arbitrary subdirectories here,
                            // but good to acknowledge them.
                            // console.log(`listFiles: Found subdirectory '${entry.name}' in ${category}, not recursing further in this specific call.`);
                        }
                    } catch (entryError) {
                        console.error(`listFiles: Error processing entry '${entry.name}' in directory '${dirHandle.name}'. Skipping this entry. Error:`, entryError.name, entryError.message);
                        // Optionally, could collect these errors and return them too.
                    }
                }
            } catch (error) {
                // This outer catch handles errors like issues with calling dirHandle.values() itself
                // or if the directory becomes unreadable during iteration.
                console.error(`Error reading directory ${dirHandle.name} for category ${category}:`, error.name, error.message);
                // Rethrow or handle as appropriate. If this is a DOMException, it might be the one user is seeing.
                // For now, let the function continue and return any files processed so far for other categories.
                // If this specific directory is critical, one might choose to throw error here.
                 if (error instanceof DOMException) {
                    // Log DOMExceptions specifically as they might be permission related or the issue user is facing
                    console.error(`DOMException encountered while processing directory ${dirHandle.name}: ${error.message}`);
                }
            }
            return filesInCategory;
        }

        // Process predefined subdirectories
        for (const subDirName in subdirectories) {
            const extensions = subdirectories[subDirName];
            const categoryName = `${subDirName}Files`; // e.g., extractorFiles
            categorizedFiles[categoryName] = [];
            try {
                const subDirHandle = await directoryHandle.getDirectoryHandle(subDirName);
                categorizedFiles[categoryName] = await processDirectory(subDirHandle, extensions, subDirName);
            } catch (error) {
                if (error.name === 'NotFoundError') {
                    console.log(`Subdirectory "${subDirName}" not found in "${directoryHandle.name}".`);
                } else {
                    console.error(`Error getting subdirectory handle for "${subDirName}":`, error.name, error.message);
                     if (error instanceof DOMException) {
                        console.error(`DOMException encountered while getting handle for subdirectory ${subDirName}: ${error.message}`);
                    }
                }
            }
        }
        
        // Process root directory files
        categorizedFiles.rootFiles = await processDirectory(directoryHandle, rootExtensions, "root");

        return categorizedFiles;
    }

    /**
     * Reads the content of a specific file within a given directory or subdirectory.
     * @param {FileSystemDirectoryHandle} directoryHandle The handle to the main directory.
     * @param {string} filePath The name of the file, potentially including a relative path from the directoryHandle.
     *                          Example: "myFile.txt" or "subdir/myFile.txt".
     * @returns {Promise<string|null>} A promise that resolves to the file content as a string, or null if an error occurs.
     */
    static async readFileContent(directoryHandle, filePath) {
        if (!directoryHandle) {
            console.warn("readFileContent: directoryHandle is null.");
            return null;
        }
        if (!filePath) {
            console.warn("readFileContent: filePath is null or empty.");
            return null;
        }

        try {
            let fileHandle;
            const pathParts = filePath.split('/').filter(part => part.length > 0);
            let currentDirHandle = directoryHandle;

            if (pathParts.length > 1) {
                // Navigate to subdirectory
                for (let i = 0; i < pathParts.length - 1; i++) {
                    currentDirHandle = await currentDirHandle.getDirectoryHandle(pathParts[i]);
                }
            }
            fileHandle = await currentDirHandle.getFileHandle(pathParts[pathParts.length - 1]);
            
            const file = await fileHandle.getFile();
            const content = await file.text();
            return content;
        } catch (error) {
            console.error(`Error reading file "${filePath}" from directory "${directoryHandle.name}":`, error);
            return null; // Return null or throw error as per desired error handling strategy
        }
    }

} // End of Utils class
