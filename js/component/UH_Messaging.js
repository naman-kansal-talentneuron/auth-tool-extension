// This creates and maintains the communication channel between
// the inspectedPage and the dev tools panel.
//
// In this example, messages are JSON objects
// {
//   action: ['code'|'script'|'message'], // What action to perform on the inspected page
//   content: [String|Path to script|Object], // data to be passed through
//   tabId: [Automatically added]
// }

export default class UHMessaging {

	static populateSelectedElementCallback = null;
	static elementExistsForAnnotationCallback=null;
	static selectedObjectPreviewCallback = null;
	static evaluateSelectorCallback = null;
	static xpathSuggestorCallback = null;


    static init(populateSelectedElementCallback,elementExistsForAnnotationCallback,selectedObjectPreviewCallback, evaluateSelectorCallback,xpathSuggestorCallback ) {
		this.populateSelectedElementCallback = populateSelectedElementCallback;
		this.elementExistsForAnnotationCallback=elementExistsForAnnotationCallback;
		this.selectedObjectPreviewCallback = selectedObjectPreviewCallback;
		this.evaluateSelectorCallback = evaluateSelectorCallback;
		this.xpathSuggestorCallback = xpathSuggestorCallback;		
		//this.initialize();
	}
	static {
		// var port = chrome.runtime.connect({
		// 	name: "UH_DEV_TOOL" // Given a Name
		// });
		// // Listen to messages from the background page
		// port.onMessage.addListener(function (message) {	
			
		// 	if (Array.isArray(message) && message.length > 0 && message != null && message != 'undefined') {
		// 		if (message[0].content == "updateDataInUHDevTool") {
		// 			UHMessaging.updateDataForUHDevTool(message);
		// 		} 
		// 		if (message[0].content == "elementExistsForAnnotation"){
		// 			UHMessaging.res_elementExistsForAnnotation(message);
		// 		}
		// 		if(message[0].content == "onScriptExecutionComplete") {
		// 			UHMessaging.res_selectedObjectPreview(message);
		// 		}
					
		// 	}
		// 	//port.postMessage(message);

		// 	return true;
		// }.bind(this));

		const PAGE_TYPES = ['listing_rows','listing_page','posting_page'];

		chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {	
			if (Array.isArray(message) && message.length > 0 && message != null && message != 'undefined') {
				if (message[0].content == "updateDataInUHDevTool") {
					UHMessaging.updateDataForUHDevTool(message);
				} 
				if (message[0].content == "elementExistsForAnnotation"){

					if(message[3] != undefined && (PAGE_TYPES.includes(message[3].content)))
					{
					UHMessaging.res_xpathSuggestorCallback(message);
					}
					else{
						UHMessaging.res_elementExistsForAnnotation(message);
					}
				}
				if(message[0].content == "onScriptExecutionComplete") {
					UHMessaging.res_selectedObjectPreview(message);
				}
					
			}
		});
		
	}
	
	static res_elementExistsForAnnotation(message){
		this.elementExistsForAnnotationCallback(message);
	}
	static res_xpathSuggestorCallback(message)
	{
        this.xpathSuggestorCallback(message);
	}
	static res_selectedObjectPreview(message) {
		this.selectedObjectPreviewCallback(message[2].content, message[1].content);
	}
	static updateDataForUHDevTool(message) {		
		this.populateSelectedElementCallback(message);
	}
	static res_evaluateSelector(message) {
		this.evaluateSelectorCallback(message);
	}

}
