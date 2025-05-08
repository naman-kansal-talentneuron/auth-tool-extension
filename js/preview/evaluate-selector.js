import MetaData from "../config/meta-data.js";


/**
 * Nodes Selector Validator And Value Retrival
 */

export default class SelectorEvaluator {

    static listenerNodes = [];
    evaluateCallBack = null;
    listener = null;

    static init() {

        //Registor Event Listener to Retrive Browser Selector Response
        // var port = chrome.runtime.connect({
        //     name: "UH_DEV_TOOL_SELECTOR" // Given a Name
        // });

        // let handleSelectorFunc = (message) => {
        //     

        //     /*
        //        message[0].content = Message Type .Here it is selectionvalue
        //        message[1].content = Selector Name
        //        message[2].content = Message or Selector Query Value
        //        message[3].content = IsError. If true then error in selector query
        //      */

        //     if (message != null && Array.isArray(message) && message.length > 2 && message[0].content == "selectionValue") {

        //         let isTrackingFieldExists = SelectorEvaluator._isListenerFieldExists(message[1].content );

        //         if (isTrackingFieldExists && (message[3] != null && message[3].content == true)) {
        //             let errMessage = `Invalid Selector for Field Name : ${message[1].content}, with Error : ${message[2].content}`;
        //             SelectorEvaluator.evaluateCallBack ? SelectorEvaluator.evaluateCallBack(message[1].content, errMessage, true) : null;
        //             SelectorEvaluator._removeListenerField(message[1].content);
        //         }
        //         else if (isTrackingFieldExists) {
        //             SelectorEvaluator.evaluateCallBack ? SelectorEvaluator.evaluateCallBack(message[1].content, message[2].content) : null;
        //             SelectorEvaluator._removeListenerField(message[1].content);
        //         } else {
        //             //alert('Nothing ::::: ' + JSON.stringify(SelectorEvaluator.listenerNodes) + " ::::: " + JSON.stringify(message));
        //         }

        //     }
        //     return true;
        //     // port.postMessage(message);            
        // }

        chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
            
            /*
               message[0].content = Message Type .Here it is selectionvalue
               message[1].content = Selector Name
               message[2].content = Message or Selector Query Value
               message[3].content = IsError. If true then error in selector query
             */

            if (message != null && Array.isArray(message) && message.length > 2 && message[0].content == "selectionValue") {

                let isTrackingFieldExists = SelectorEvaluator._isListenerFieldExists(message[1].content );

                if (isTrackingFieldExists && (message[3] != null && message[3].content == true)) {
                    let errMessage = `Invalid Selector for Field Name : ${message[1].content}, with Error : ${message[2].content}`;
                    SelectorEvaluator.evaluateCallBack ? SelectorEvaluator.evaluateCallBack(message[1].content, errMessage, true) : null;
                    SelectorEvaluator._removeListenerField(message[1].content);
                }
                else if (isTrackingFieldExists) {
                    SelectorEvaluator.evaluateCallBack ? SelectorEvaluator.evaluateCallBack(message[1].content, message[2].content) : null;
                    SelectorEvaluator._removeListenerField(message[1].content);
                } else {
                    //alert('Nothing ::::: ' + JSON.stringify(SelectorEvaluator.listenerNodes) + " ::::: " + JSON.stringify(message));
                }

            }
            return true; 
        });

        // Remove selector listener from the background page
        //port.onMessage.removeListener(handleSelectorFunc);

        // Listen to messages from the background page
        //port.onMessage.addListener(handleSelectorFunc.bind(this));

        SelectorEvaluator.listener = true;
    }

    static reset(){
        SelectorEvaluator.listenerNodes = [];
    }

    static evaluate(selector, selectorType, fieldName, noOfRecord, evaluateCallBack) {

        if (!SelectorEvaluator.listener) {
            SelectorEvaluator.init();
        }

        SelectorEvaluator.evaluateCallBack = evaluateCallBack;

        let elementDetails = selector + "----" + selectorType + "----" + fieldName + "----" + noOfRecord ;

        this._trackListenerField(fieldName);

        chrome.storage.local.set({ 'elementDetails': elementDetails }, function () {
            SelectorEvaluator._sendObjectToInspectedPage({ action: "code", content: "evaluateSelection" }, function () {
            });
        }.bind(this));

        //let content = '<a id="shareButton--facebook" class="shareButton shareButton--facebook tpt_socialShareIcon tpt_socialSharePopupTrigger" aria-label="Share IT109 - IT Auditor Sr with Facebook" role="button" tabindex="0" target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fuop.avature.net%2Fcareers%2FJobDetail%2FIT109-IT-Auditor-Sr%2F23902&display=popup"></a>';
        //this.evaluateCallBack(fieldName, content);

    }
    static _sendObjectToInspectedPage(message) {
        message.tabId = chrome.devtools.inspectedWindow.tabId;
        chrome.tabs.sendMessage(message.tabId,message);
    }

    static _trackListenerField(fieldName) {
        var index = SelectorEvaluator.listenerNodes.indexOf(fieldName);
        if (index == -1) {
            SelectorEvaluator.listenerNodes.push(fieldName);
        }
    }

    static _isListenerFieldExists(fieldName) {
        return SelectorEvaluator.listenerNodes.indexOf(fieldName) !== -1;
    }

    static _removeListenerField(fieldName) {
        var index = SelectorEvaluator.listenerNodes.indexOf(fieldName);
        if (index !== -1) {
            SelectorEvaluator.listenerNodes.splice(index, 1);
        }
    }

    
}
