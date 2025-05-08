const GARTNER_INSPECT_ELEMENT = "Gartner_InspectElement";
const XPATH_SELECTOR_FAMILY = ["xpath","xmlxpath", "xmlxpathselector"]

function attachPointAndClick() {
    document.body.addEventListener('mouseover', mouseaction);
    document.body.addEventListener('mousedown', mouseaction);
    document.body.addEventListener('mouseleave', mouseaction);
}
function removePointAndClick() {
    document.body.removeEventListener('mouseover', mouseaction);
    document.body.removeEventListener('mousedown', mouseaction);
    document.body.removeEventListener('mouseleave', mouseaction);
    $('body').attr('style', 'cursor: default;');
}

function getOuterHTMLOfSelection(ele, showMoreFlag, isTextContent) {
    if (ele.length == undefined || (ele.length && ele.length == 0)) {
        return ele;
    }

    let lstString = "";

    if(typeof ele != "string"){
        for (var i = 0; i < ele.length; i++) {
     
            if(isTextContent){ 
                  lstString = lstString.concat(ele[i].textContent ? ele[i].textContent : ele[i].value ? ele[i].value : JSON.stringify(ele[i])).concat("&#013;&#010;&#013;&#010;");                   
              }else{
                  lstString = lstString.concat(ele[i].outerHTML ? ele[i].outerHTML : ele[i].value ? ele[i].value : JSON.stringify(ele[i])).concat("&#013;&#010;&#013;&#010;");
              }
          }
    } else {
        lstString = ele;
    }



    if(lstString != undefined && !showMoreFlag) {
        let trimmedLength = 3000;
        lstString = lstString.length > trimmedLength ? lstString.substring(0, trimmedLength) + "...Click on Show More button to view more": lstString; 
    }
    return lstString;
}

function getInnerHTMLOfSelection(ele, showMoreFlag, isTextContent) {
    if (ele.length == undefined || (ele.length && ele.length == 0)) {
        return ele;
    }

    let lstString = '';
    for (var i = 0; i < ele.length; i++) {      
        if(isTextContent){ 
            lstString = lstString.concat(ele[i].textContent ? ele[i].textContent : ele[i].value ? ele[i].value : JSON.stringify(ele[i])).concat('&#013;&#010;&#013;&#010;');                   
        }else{
            lstString = lstString.concat(ele[i].outerHTML ? ele[i].outerHTML : ele[i].value ? ele[i].value : JSON.stringify(ele[i])).concat('&#013;&#010;&#013;&#010;');            
        }
    }

    if(lstString != undefined && !showMoreFlag) {
        let trimmedLength = 3000;
        lstString = lstString.length > trimmedLength ? lstString.substring(0, trimmedLength) + "...Click on Show More button to view more": lstString; 
    }
    return lstString;
}

function getInnerHTMLOfSelectionasArray(ele, showMoreFlag, isTextContent) {
    if (ele.length == undefined || (ele.length && ele.length == 0)) {
        return ele;
    }

    let lstArray = [];
    for (var i = 0; i < ele.length; i++) {      
        if(isTextContent){ 
            lstString = lstArray.push(btoa(ele[i].textContent ? ele[i].textContent : ele[i].value ? ele[i].value : JSON.stringify(ele[i])));                   
        }else{
            lstString = lstString.push(btoa(ele[i].outerHTML ? ele[i].outerHTML : ele[i].value ? ele[i].value : JSON.stringify(ele[i])));            
        }
    }

    if(lstString != undefined && !showMoreFlag) {
        let trimmedLength = 3000;
        lstString = lstString.length > trimmedLength ? lstString.substring(0, trimmedLength) + "...Click on Show More button to view more": lstString; 
    }
    return lstString;
}


function setHighlighterAttribute(element){
    try{
        if(element.length){
            for(var e of element){
                e.setAttribute(GARTNER_INSPECT_ELEMENT, "true");
            }
        } else {
            element.setAttribute(GARTNER_INSPECT_ELEMENT, "true");
        }
    } catch(e){
    console.log("Exception occurred while highlighting an element::" + e);
    }
}

function removeHighlighterAttribute(element){
    for(var e of element){
        e.removeAttribute(GARTNER_INSPECT_ELEMENT);
    }   
}

/**
 * Evaluates the contents of the elementSelector input by sending through native chrome extension messaging service.
 */
function evaluateSelection(){

    chrome.storage.local.get('elementDetails', function (data) {
        
        var itemsToHighlight = data.elementDetails;
        let splittedItems = itemsToHighlight.split("----");
        let elementSelector = splittedItems[0];
        let elementSelectorType = splittedItems[1];
        let fieldName = splittedItems[2];
        let noOfRecord = splittedItems[3];
        noOfRecord = (noOfRecord > 10) ? 10 : (noOfRecord < 1 ? 1 : noOfRecord);

        try {
            let element = [];
            if (XPATH_SELECTOR_FAMILY.includes(elementSelectorType)){

               let ele = convertXPathToSelector(elementSelector);                 
               //element =$(ele);        
               element =getElementData( ele, noOfRecord);

                if (elementSelector === "//body") {
                    sendObjectToDevTools([{ content: "selectionValue" }, { content: fieldName }, { content: "//body" }]);
                }
                else {
                    sendObjectToDevTools([{ content: "selectionValue" }, { content: fieldName }, { content: getInnerHTMLOfSelection_manual(element, true) }]);
                }

            }
            else if (elementSelectorType === "expn.xpath") {

                let elementValue = convertExpnXPathToSelector(elementSelector);

                if (elementSelector === "body") {
                    sendObjectToDevTools([{ content: "selectionValue" }, { content: fieldName }, { content: "body" }]);
                } else {
                    sendObjectToDevTools([{ content: "selectionValue" }, { content: fieldName }, { content: elementValue}]);
                }                
            }
            else if (elementSelectorType === "css") {     

                //element.push($(elementSelector)[0]);                
                element =getElementData(elementSelector, noOfRecord);

                if (elementSelector === "body") {
                    sendObjectToDevTools([{ content: "selectionValue" }, { content: fieldName }, { content: "body" }]);
                } else {
                    sendObjectToDevTools([{ content: "selectionValue" }, { content: fieldName }, { content: getInnerHTMLOfSelection_manual(element, true) }]);
                }                
            }
            else if (elementSelectorType === "css.innerhtml") { 
                //element.push($(elementSelector)[0]);  
                element =getElementData(elementSelector, noOfRecord);              

                if (elementSelector === "body") {
                    sendObjectToDevTools([{ content: "selectionValue" }, { content: fieldName }, { content: "body" }]);
                } else {
                sendObjectToDevTools([{ content: "selectionValue" }, { content: fieldName }, { content: getOuterHTMLOfSelection_manual(element) }]);
                }                
            }
            else if (elementSelectorType === "xpath.innerhtml") {  
                let ele = convertXPathToSelector(elementSelector);                       
                //element.push($(ele)[0]);   
                element =getElementData(ele, noOfRecord);                 

                if (elementSelector === "//body") {
                    sendObjectToDevTools([{ content: "selectionValue" }, { content: fieldName }, { content: "//body" }]);
                } else {
                sendObjectToDevTools([{ content: "selectionValue" }, { content: fieldName }, { content: getOuterHTMLOfSelection_manual(element) }]);
                }                
            }

        } catch (e) {
            console.log(`Exception occured while highlighting element - ${fieldName} with Selector - ${elementSelector} :: Errror - ` + e)
            sendObjectToDevTools([{ content: "selectionValue" }, { content: fieldName }, { content: e.message ?e.message : e }, { content: true }]);
        }

    });
}

function getElementData(ele, noOfRecords){
    let eleData = $(ele);    

    if (!eleData || eleData.length == undefined || !eleData.length) {
        throw "Invalid Selector or Please navigate to correct Page";
    }

    return eleData.slice( 0,  eleData.length > noOfRecords ? noOfRecords : eleData.length);
}

function getOuterHTMLOfSelection_manual(ele) {
    if (ele.length == undefined || (ele.length && ele.length == 0)) {
        return ele;
    }

    let lstString = '';
    for (var i = 0; i < ele.length; i++) {
      lstString = lstString.concat(ele[i].outerHTML ? ele[i].outerHTML : ele[i].value ? ele[i].value : JSON.stringify(ele[i]));             
    }

    return lstString;
}

function getInnerHTMLOfSelection_manual(ele, isTextContent) {

    if (ele.length == undefined || (ele.length && ele.length == 0)) {
        return ele;
    }

    let lstString = '';
    for (var i = 0; i < ele.length; i++) {      
        if(isTextContent){ 
            lstString = lstString.concat(ele[i].textContent ? ele[i].textContent : ele[i].value ? ele[i].value : JSON.stringify(ele[i]));       
        }else{
            lstString = lstString.concat(ele[i].outerHTML ? ele[i].outerHTML : ele[i].value ? ele[i].value : JSON.stringify(ele[i]));       
        }
    }

    return lstString;
}

function isValidPage(page){
    if(page==='listing_rows' || page==='listing_page' || page==='posting_page')
        return true;
    return false;
}

/**
 * highlights the contents based on selector input and selector type by sending input text through native chrome 
 * extension messaging service.
 */
function highlightElementInInspectedPage() {   
    chrome.storage.local.get('elementDetails', function (data) {
        removeAllElementInInspectedPage();        
        var itemsToHighlight = data.elementDetails;
        let splittedItems = itemsToHighlight.split("----");
        let elementSelector = splittedItems[0];
        let elementSelectorType = splittedItems[1];
        let showMoreFlag = (splittedItems[2] != undefined && splittedItems[2] === "showMore") ? true : false;  
        let xPathSuggestorSource = splittedItems[3] != undefined ? splittedItems[3] : false;
        try {
            if (XPATH_SELECTOR_FAMILY.includes(elementSelectorType)) {
               let ele = convertXPathToSelector(elementSelector);               
               let element = $(ele);
               setHighlighterAttribute(element);

                if (elementSelector === "//body") {
                    sendObjectToDevTools([{ content: "elementExistsForAnnotation" }, { content: 1 }, { content: "//body" }, {content:xPathSuggestorSource}]);
                }
                else {
                    sendObjectToDevTools([{ content: "elementExistsForAnnotation" }, { content: element.length }, { content: getInnerHTMLOfSelection(element, showMoreFlag, !isValidPage(xPathSuggestorSource)) }, {content:xPathSuggestorSource}]);
                }

            }
            else if (elementSelectorType === "css") {                
                let element = $(elementSelector);                
                setHighlighterAttribute(element);

                if (elementSelector === "body") {
                    let data = document.querySelector('body').outerHTML;
                    sendObjectToDevTools([{ content: "elementExistsForAnnotation" }, { content: 1 }, { content: data}, {content:xPathSuggestorSource}]); 
                } else {
                    sendObjectToDevTools([{ content: "elementExistsForAnnotation" }, { content: element.length }, { content: getInnerHTMLOfSelection(element, showMoreFlag, !isValidPage(xPathSuggestorSource)) }, {content:xPathSuggestorSource}]);
                }                
            }
            else if (elementSelectorType === "css.innerhtml") { 
                let element = $(elementSelector);  
                setHighlighterAttribute(element); 

                if (elementSelector === "body") {
                    sendObjectToDevTools([{ content: "elementExistsForAnnotation" }, { content: 1 }, { content: "body" }, {content:xPathSuggestorSource}]);
                } else {
                sendObjectToDevTools([{ content: "elementExistsForAnnotation" }, { content: element.length }, { content: getOuterHTMLOfSelection(element, showMoreFlag, false) }, {content:xPathSuggestorSource}]);    
            }                
            }
            else if (elementSelectorType === "xpath.innerhtml") {  
                let ele = convertXPathToSelector(elementSelector);  
                let element = $(ele);            
                setHighlighterAttribute(element);

                if (elementSelector === "//body") {
                    sendObjectToDevTools([{ content: "elementExistsForAnnotation" }, { content: 1 }, { content: "//body" }, {content:xPathSuggestorSource}]);
                } else {
                sendObjectToDevTools([{ content: "elementExistsForAnnotation" }, { content: element.length }, { content: getOuterHTMLOfSelection(element, showMoreFlag, false) }, {content:xPathSuggestorSource}]);
                }                
            }

        } catch (e) {
            console.log("Exception occured while highlighting element::" + e)
            sendObjectToDevTools([{ content: "elementExistsForAnnotation" }, { content: 0 }, { content: e.message }]);
        }

    });

}
function removeAllElementInInspectedPage() {
    removeHighlighterAttribute(document.querySelectorAll("[Gartner_InspectElement= 'true']"));
}

function removeElementInInspectedPage() {

    chrome.storage.local.get('elementDetails', function (data) {

        var itemsToHighlight = data.elementDetails;
        let splittedItems = itemsToHighlight.split("----");

        let elementSelector = splittedItems[0];
        let elementSelectorType = splittedItems[1];
        try {
            if (XPATH_SELECTOR_FAMILY.includes(elementSelectorType)) {
                jquery = convertXPathToSelector(elementDetailsObj.elementSelector);
                removeHighlighterAttribute(jquery);
            }
            else {
                removeHighlighterAttribute(elementSelector);
            }

        } catch (e) {

            console.log("Exception occured while removing highlighted element::" + e)

        }

    });
}

function functionToExecute(functionName) {
    if (typeof functionName == "function") {
        functionName();
    }

}

function executeScript(f, showMore = false) {  
    let obj = "";
    try {
        if (typeof f == "function") {
            obj = f();
        }
        let ObjLength = typeof obj == "string" ? 1 : obj.length
        sendObjectToDevTools([{ content: "onScriptExecutionComplete" }, { content: ObjLength }, { content: getOuterHTMLOfSelection(obj, showMore) }]);
    } catch (e) {
        console.log("Exception occured while executing script::" + e);
        sendObjectToDevTools([{ content: "onScriptExecutionComplete" }, { content: 0 }, { content: e.message }]);
    }
}

function convertXPathToSelector(xpathStr, noOfRecord) {
    var xresult = document.evaluate(xpathStr, document, null, XPathResult.ANY_TYPE, null);
    var xnodes = [];
    var xres;

    while (xres = xresult.iterateNext()) {
        xnodes.push(xres);        
    }

    return xnodes;
}

function convertExpnXPathToSelector(expnXPATHStr) {
    var xresult = document.evaluate(expnXPATHStr, document, null, XPathResult.STRING_TYPE, null);   

    if(xresult.stringValue == ""){
        throw "Invalid Expn Xpath selector.";
    }
    return xresult.stringValue;
}

function mouseaction(e) {
    let evt = e.type;
    e.preventDefault();
    $('body').attr('style', 'cursor: grab; cursor: -webkit-grab;');
    $(document).bind("contextmenu", returnFalse);

    while (evt.length < 11) evt += ' ';

    console.log(evt + " which=" + e.which, 'test');
    currentInspectedElement = e.target;

    mouseX = e.pageX - 20 + "px";
    mouseY = e.pageY + 20 + "px";
    console.log(e.which);

    if (e.which == 0) {
        removeAllElementInInspectedPage();
        setHighlighterAttribute(currentInspectedElement);
        $(currentInspectedElement).attr('tittle', '');
        //getSetInspectionData(currentInspectedElement);
    }

    if (e.which == 3 || e.which == 1) {
        setHighlighterAttribute(currentInspectedElement);
        getSetInspectionData(currentInspectedElement);
        removePointAndClick();
    }

    return false;

}


function returnFalse(e) {
    return false;
}

function sendObjectToDevTools(message) {
    // The callback here can be used to execute something on receipt  
    chrome.runtime.sendMessage(message, function (message) { });
}


function getSetInspectionData(element) {

    var element_html = getCssSelectorOfElement(element);
    var xpath_one = getAbsoluteXPath(element);
    //var xpath_two = createXPathFromElement(element);

    sendObjectToDevTools([{ content: "updateDataInUHDevTool" }, { content: element_html }, { content: xpath_one.toLowerCase() }]);
}

function getHTMLOfElement(dom_element) {
    var elm_html = dom_element.outerHTML;
    return elm_html;
}

function getCssSelectorOfElement(dom_element) {

    var append = '';
    dom_element.classList.forEach(
        function (key, value) {
                append += '.' + key;
        });
    return dom_element.tagName.toLowerCase() + append;
}

function getAbsoluteXPath(node) {

    var comp, comps = [];
    var parent = null;
    var xpath = '';
    var getPos = function (node) {
        var position = 1;
        var curNode;
        if (node.nodeType == Node.ATTRIBUTE_NODE) {
            return null;
        }
        for (curNode = node.previousSibling; curNode; curNode = curNode.previousSibling) {
            if (curNode.nodeName == node.nodeName) {
                ++position;
            }
        }
        return position;
    }
    if (node instanceof Document) {
        return '/';
    }
    for (; node && !(node instanceof Document); node = node.nodeType == Node.ATTRIBUTE_NODE ? node.ownerElement
        : node.parentNode) {
        comp = comps[comps.length] = {};
        switch (node.nodeType) {
            case Node.TEXT_NODE:
                comp.name = 'text()';
                break;
            case Node.ATTRIBUTE_NODE:
                comp.name = '@' + node.nodeName;
                break;
            case Node.PROCESSING_INSTRUCTION_NODE:
                comp.name = 'processing-instruction()';
                break;
            case Node.COMMENT_NODE:
                comp.name = 'comment()';
                break;
            case Node.ELEMENT_NODE:
                comp.name = node.nodeName;
                break;
        }
        comp.position = getPos(node);
    }
    for (var i = comps.length - 1; i >= 0; i--) {
        comp = comps[i];
        if (comp.name != undefined) {
            xpath += '/' + comp.name;
            if (comp.position != null) {
                xpath += '[' + comp.position + ']';
            }
        }
    }
    return xpath;
}


function getAbsoluteXPathPosition(node) {

    var comp, comps = [];
    var parent = null;
    var xpath = '';
    var getPos = function (node) {
        var position = 1;
        var curNode;
        if (node.nodeType == Node.ATTRIBUTE_NODE) {
            return null;
        }
        for (curNode = node.previousSibling; curNode; curNode = curNode.previousSibling) {
            if (curNode.nodeName == node.nodeName) {
                ++position;
            }
        }
        return position;
    }
    if (node instanceof Document) {
        return '/';
    }
    for (; node && !(node instanceof Document); node = node.nodeType == Node.ATTRIBUTE_NODE ? node.ownerElement
        : node.parentNode) {
        comp = comps[comps.length] = {};
        switch (node.nodeType) {
            case Node.TEXT_NODE:
                comp.name = 'text()';
                break;
            case Node.ATTRIBUTE_NODE:
                comp.name = '@' + node.nodeName;
                break;
            case Node.PROCESSING_INSTRUCTION_NODE:
                comp.name = 'processing-instruction()';
                break;
            case Node.COMMENT_NODE:
                comp.name = 'comment()';
                break;
            case Node.ELEMENT_NODE:
                comp.name = node.nodeName;
                break;
        }
        comp.position = getPos(node);
        break;
    }
    for (var i = comps.length - 1; i >= 0; i--) {
        comp = comps[i];
        if (comp.name != undefined) {
            xpath += '/' + comp.name;
            if (comp.position != null) {
                xpath += '[' + comp.position + ']';
            }
        }
    }
    return xpath;
}

function getRelativeXpathRemove(element) {

    var uniquexpath = [];
    var requiredAttributeValue = "";
    var requiredTextValue = "";
    var searchAttributes = ["class"];
    var elementTagName = $(element).prop("tagName");
    var requiredAttribute = "";
    var rel_xpath = "";
    for (var i = 0; i < searchAttributes.length; i++) {
        requiredAttributeValue = $(element).attr(searchAttributes[i]);
        if (requiredAttributeValue == "" || requiredAttributeValue == null) {
            continue;
        } else {
            requiredAttribute = requiredAttributeValue.trim();
        }
    }
    var selectedElementClassesSplitted = requiredAttribute.split(' ');
    for (var i = 0; i < selectedElementClassesSplitted.length; i++) {
        if (selectedElementClassesSplitted[i].includes('HLRN') || selectedElementClassesSplitted[i].includes('cebdevTool')) {
            $(element).removeClassStartingWith(selectedElementClassesSplitted[i]);
            $(element).removeAttr("mltitle");
            removetooltip(element);
        }
    }
    return requiredAttribute;
}


function getRelativeXpath(element) {

    var uniquexpath = [];
    var requiredAttributeValue = "";
    var requiredTextValue = "";
    var searchAttributes = ["id", "name", "type", "for", "widget-name", "data-category", "data-bind", "data-field", "widget-on-change", "href"];
    var elementTagName = $(element).prop("tagName");
    var requiredAttribute = "";
    var rel_xpath = "";
    for (var i = 0; i < searchAttributes.length; i++) {
        requiredAttributeValue = $(element).attr(searchAttributes[i]);
        //if(requiredAttributeValue
        if (requiredAttributeValue == "" || requiredAttributeValue == null) {
            continue;
        } else {
            requiredAttribute = searchAttributes[i].trim();


            requiredTextValue = $(element).text().trim();
            if (requiredAttribute != "") {
                rel_xpath = "\/\/" + elementTagName + "[@" + requiredAttribute + "=\"" + requiredAttributeValue + "\"]";
            } else if (requiredTextValue != "") {
                rel_xpath = "\/\/" + elementTagName + "[contains(text(), \"" + requiredTextValue + "\")]";
            } else {
                rel_xpath = "";
            }

            uniquexpath = evaluateQuery(rel_xpath, 1);
            if (uniquexpath[1] == 0 || uniquexpath[1] > 1)
                continue;

            return rel_xpath;


        }
    }

    if (element !== null) {
        dom_element = element;

        var elementtagnamewithposition = getAbsoluteXPathPosition(element);
        var parentelement = dom_element.parentElement;
        rel_xpath = getRelativeXpath(parentelement);
        rel_xpath = rel_xpath + elementtagnamewithposition;
    }
    return rel_xpath;

}


function createXPathFromElement(elm) {


    var allNodes = document.getElementsByTagName('*');
    for (var segs = []; elm && elm.nodeType == 1; elm = elm.parentNode) {

        if (elm.hasAttribute('id')) {
            var uniqueIdCount = 0;
            for (var n = 0; n < allNodes.length; n++) {
                if (allNodes[n].hasAttribute('id') && allNodes[n].id == elm.id) uniqueIdCount++;
                if (uniqueIdCount > 1) break;
            };
            if (uniqueIdCount == 1) {
                segs.unshift('id("' + elm.getAttribute('id') + '")');
                return segs.join('/');
            } else {
                segs.unshift(elm.localName.toLowerCase() + '[@id="' + elm.getAttribute('id') + '"]');
            }
        } else {
            for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) {
                if (sib.localName == elm.localName) i++;
            };
            segs.unshift(elm.localName.toLowerCase() + '[' + i + ']');
        };
    };
    return segs.length ? '/' + segs.join('/') : null;
};

function removetooltip(element) {

    var MLiframeremove = element.getRootNode();
    MLiframeIDremove = MLiframeremove.defaultView.frameElement;
    if (MLiframeIDremove == null) {
        $("#MLdivtoshow").hide();
        //		MLiframe.getElementById('MLdivtoshow').style.display="none";
    }
    else {
        MLiframeremove.getElementById('MLdivtoshow').innerHTML = "";
        $("#MLdivtoshow").hide();
        MLiframeremove.getElementById('MLdivtoshow').style.display = "none";
        //MLiframe.getElementById('MLdivtoshow').css({top: mouseY, left: mouseX}).show();

    }

}

$.fn.removeClassStartingWith = function (filter) {
    $(this).removeClass(function (index, className) {
        return (className.match(new RegExp("\\S*" + filter + "\\S*", 'g')) || []).join(' ')
    });
    return this;
};


function executeDynamicScript(scriptCode , tabID) {
    chrome.scripting.executeScript({
        target: {tabId: tabID},
        func: function(scriptCode) {       
            eval(scriptCode);
        },
        args: [scriptCode]
    });
}

function executeDynamicScript2(scriptString) {
    // // Create a blob from the script string
    // var blob = new Blob([scriptString], { type: 'application/javascript' });
    // var blobUrl = URL.createObjectURL(blob);

    // // Create a script element
    // var script = document.createElement('script');
    // script.src = blobUrl;

    // // Append the script element to the document body to execute it
    // document.body.appendChild(script);

    // // Clean up after execution
    // URL.revokeObjectURL(blobUrl);

// var testfunction = new Function(scriptString);
// testfunction();
}



var functionRouter = function(message, sender, sendResponse) {
    if(message.action == "dynamicScript")
    {
        //executeDynamicScript2(message.content, message.tabId );
    }else if (message.action == "code")
    {
        switch (message.content) {
            case "highlightElementInInspectedPage":
                highlightElementInInspectedPage();
                break;
            case "attachPointAndClick":
                attachPointAndClick();
                break;
            case "removePointAndClick":
                removePointAndClick();
                break;
            case "removeElementInInspectedPage":
                removeElementInInspectedPage();
                break;
            case "removeAllElementInInspectedPage":
                removeAllElementInInspectedPage();
                break;
            case "evaluateSelection":
                evaluateSelection();  
                break;
            case "executeMyFunction":
                    myFunction();
                break;
            case "executeMyFunction":
                   myFunction();  
                break;                         
            default:
                console.error("Unknown action:", message.action);
        }
    }

   
} 
// Listens to messages sent from the pane   

    if (!window.isContentScriptLoaded) {
        window.isContentScriptLoaded = true;
        chrome.runtime.onMessage.addListener(functionRouter);
    }



