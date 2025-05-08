import Harvestor from "./harvest/Harvestor.js";
import Proxy from "./proxy/Proxy.js";
import Payload from "./payload/Payload.js";
import harvestData from "./harvest/harvestConfig.js"
import ElementFactory from "./element/ElementFactory.js";



export default function LoadDebugTab(){
}

$(document).ready(function () {

    // document.getElementById("load_json").addEventListener('click', function () {        
    //loadJson();
    // });
});


export function loadJson() {

    let isValidInput = validateInput(harvestData);
    if (isValidInput) {
        createandPopulateHarvest(harvestData);
    }
}


function createandPopulateHarvest(harvestData) {

    // fetch keys from the harvstor JSON
    let sourceVal = harvestData["source"];
    let typeVal = harvestData["type"];
    let startUrlVal = harvestData["startUrl"];
    let proxyVal = harvestData["proxy"];
    let payloadArray = harvestData["payload"];


    let payloadNodes = createPayloadHarvestNodes(payloadArray);
    // create proxy  object  
    let proxy = createProxy(proxyVal);
    // create Harvestor and extractor combines object  
    let uhAuthScriptObj = new Harvestor(sourceVal, proxy, typeVal, startUrlVal, payloadNodes);
    window.uhAuthScriptObj = uhAuthScriptObj;
    // TODO: below is test method call, need to remove this once JEST tests are created
    testAuthScriptJSObject(uhAuthScriptObj);
    //}
}



export function createPayloadHarvestNodes(payloadArray) {

    let payloadHarvestNodes = [];
    payloadArray = payloadArray || [];
    payloadArray.forEach(element => {

        let elementFactory = new ElementFactory();
        let elementNode = elementFactory.createElement(element);
        payloadHarvestNodes.push(elementNode);

    });

    let payloadNodes = new Payload(payloadHarvestNodes);

    return payloadNodes;
}

function createProxy(proxyKey) {

    let proxy = new Proxy(proxyKey.ip, proxyKey.port);
    return proxy;

}

export function validateInput(harvestData) {

    let sourceVal = harvestData["source"];
    let typeVal = harvestData["type"];
    let startUrlVal = harvestData["startUrl"];
    let proxyVal = harvestData["proxy"];

    return ((sourceVal != undefined && sourceVal != '') && (typeVal != undefined && typeVal != '')
        && (startUrlVal != undefined && startUrlVal != '') && (proxyVal != undefined && proxyVal != ''))

}



function testAuthScriptJSObject(uhAuthScriptObj) {

     console.log(uhAuthScriptObj);

    //  const msgStr = "Harvestor & Extractor common object model";
    //  chrome.runtime.sendMessage({ message: msgStr }, function (response) {
    //     console.log(response);

    //  });

    //  const harvestStartUrl = "harvestStartUrl from object = " + uhAuthScriptObj.startUrl;
    //  chrome.runtime.sendMessage({ message: harvestStartUrl }, function (response) {
    //     console.log(response);

    //  });
}