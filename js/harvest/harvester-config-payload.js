import Utils from "../utils.js";

export default class HarvesterConfigPayload {

    static getHarvesterPayload(payloadItem) {

        let commonAttributes = {
            id : payloadItem.elementId,
            type: payloadItem.elementType,
            selector: payloadItem.elementSelector,
            selectorType: payloadItem.elementSelectorType,
            selectorContextOn: payloadItem.elementSelectorContextOn,
            persist: payloadItem.elementPersist,
            documentType: payloadItem.elementDocumentType,
            parent: payloadItem.elementParent,
            persistWithData: payloadItem.elementPersistWithData,
            options: payloadItem.elementOptions
        }

        switch(payloadItem.elementType) {
            case "BasicElement" : 
                return {...commonAttributes, multiple: payloadItem.elementMultiple, maxIteration : payloadItem.elementMaxIteration, fetchType: payloadItem.elementFetchType, onComplete: payloadItem.elementOnComplete};                

            case "SelectElement" :                
                return {...commonAttributes, select: payloadItem.elementSelect};
                
            case "ClickElement" :
                return {...commonAttributes, multiple: payloadItem.elementMultiple, maxIteration : payloadItem.elementMaxIteration, fetchType: payloadItem.elementFetchType, childFirst: payloadItem.elementChildFirst};
            
            case "LinkElement" :
                return {...commonAttributes, isNewTab: payloadItem.elementNewTab, onComplete: payloadItem.elementOnComplete };
            
            case "InputTextElement" : 
                return {...commonAttributes, text: payloadItem.elementText};

            case "ParamElement" : 
                return {...commonAttributes, values: payloadItem.elementValues && payloadItem.elementValues.length>0? payloadItem.elementValues:undefined};
    
            case "ScrollDownElement" :
                return commonAttributes;
            
            case "ScriptElement":
                return {...commonAttributes, fetchType: payloadItem.elementFetchType, childFirst: payloadItem.elementChildFirst, multiple: payloadItem.elementMultiple, maxIteration : payloadItem.elementMaxIteration};
            case "WaitingElement":
                return commonAttributes;
            
            case "FocusElement" :
                return commonAttributes;
            
            case "KeyboardEvent" :
                return commonAttributes;

            case "MouseEvent" :
                return commonAttributes;     
            case "APIToHTMLElement"  :
                return commonAttributes;
            case "FileToHTMLElement"  :
                return commonAttributes;
            case "BrowserToHtmlElement"  :
                    return commonAttributes;
            case "DownloadPdfElement" :
                return {...commonAttributes, multiple: payloadItem.elementMultiple, maxIteration : payloadItem.elementMaxIteration, fetchType: payloadItem.elementFetchType, onComplete: payloadItem.elementOnComplete};
                
        }
        
    }

    static getCRCFields(crc) { 
        let crcObj;
        let fieldsNames = [];
        let fields = {}; 
        if(crc != null && crc != "undefined") {
            crc.crcFieldsArr.forEach(function (item, index) {
                fieldsNames.push(item.fieldName);
                let k = item.fieldName;                            
                fields[k] = {};  
                if( item.fieldSelector){
                    fields[k]['selector'] = item.fieldSelector
                }
                if( item.fieldSelectorType){
                    fields[k]['selectorType'] = item.fieldSelectorType
                }
                if( item.fieldSelectorContextOn){
                    fields[k]['selectorContextOn'] = item.fieldSelectorContextOn
                }
                if( item.fieldValue){
                    fields[k]['value'] = item.fieldValue
                }
            });
            crcObj = {declaration : { fields: fieldsNames , document: crc.document }, definition:  {  fields: fields, document : crc.document} }
            return crcObj;
        }
        
    }

    //Get the Harvester data based on Parent and Child relationship order
    static getReorderedHarvesterPayLoad( payload){

        if( !payload || !payload.length){
            return payload;
        }        
        //Convert the Harvester into Tree Hierarchy Level based on parent and child relationship
        let treeHierarchyHarvester = function (data, root) {
            var t = {};
            data.forEach(o => {
                Object.assign(t[o.id] = t[o.id] || {}, o);
                t[o.parent] = t[o.parent] || {};
                t[o.parent].children = t[o.parent].children || [];
                t[o.parent].children.push(t[o.id]);
            });
            return t[root].children;
        }(payload, 'root');

        //Convert back the Tree Hierarchy to individual Harvester based on parent and child relationship
        let separateTreeHierarchyHarvester = function( harvesters) {

            let obj = [];
            harvesters.forEach(item => {

                if (item.children && item.children.length) {
                    obj.push( item);
                    let childrens =  separateTreeHierarchyHarvester(item.children);
                    obj.push( ...childrens);
                    delete item.children;
                }
                else {
                    obj.push( item);
                }
            })
            return obj;
        }

        return separateTreeHierarchyHarvester( treeHierarchyHarvester);
    }
}