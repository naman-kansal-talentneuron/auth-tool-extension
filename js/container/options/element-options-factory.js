import MetaData from "../../config/meta-data.js";
import ClickElementOptions from "./click-element-options.js";
import SelectElementOptions from "./select-element-options.js";
import LinkElementOptions from "./link-element-options.js";
import BasicElementOptions from "./basic-element-options.js";
import InputtextElementOptions from "./inputtext-element-options.js";
import ScrollDownElementOptions from "./scrolldown-element-options.js";
import ScriptElementOptions from "./script-element-options.js";
import WaitingElementOptions from "./waiting-element-options.js";
import FocusElementOptions from "./focus-element-options.js";
import KeyboardeventElementOptions from "./keyboardevent-element-options.js";
import MouseEvent from "../../element/mouse-event.js";
import MouseeventElementOptions from "./mouseevent-element-options.js";
import ParamElementOptions from "./param-element-options.js";
import APIToHTMLElementOptions from "./api-to-html-element-options.js"
import DownloadPdfElementOptions from "./downloadpdf-element-options.js";

export default class ElementOptionsFactory {

    static createElementOptions( elementType, nodeElement,parentElement, onSaveCallback) {

        switch(elementType) {
            
            case MetaData.getActionTypes.BasicElement :
                return new BasicElementOptions(nodeElement,parentElement, onSaveCallback);
            case MetaData.getActionTypes.SelectElement :
                return new SelectElementOptions(nodeElement,parentElement);
            case MetaData.getActionTypes.ClickElement :
                return new ClickElementOptions(nodeElement,parentElement);            
            case MetaData.getActionTypes.LinkElement :
                return new LinkElementOptions(nodeElement,parentElement);                                        
            case MetaData.getActionTypes.InputTextElement :
                return new InputtextElementOptions(nodeElement, parentElement);
            case MetaData.getActionTypes.ScrollDownElement :
                    return new ScrollDownElementOptions(nodeElement, parentElement);
            case MetaData.getActionTypes.ScriptElement:
                return new ScriptElementOptions(nodeElement, parentElement, onSaveCallback);               
            case MetaData.getActionTypes.WaitingElement:
                return new WaitingElementOptions(nodeElement, parentElement);
            case MetaData.getActionTypes.FocusElement:
                return new FocusElementOptions(nodeElement, parentElement);
            case MetaData.getActionTypes.KeyboardEvent:
                return new KeyboardeventElementOptions(nodeElement, parentElement);
            case MetaData.getActionTypes.MouseEvent:
                return new MouseeventElementOptions(nodeElement, parentElement);
            case MetaData.getActionTypes.ParamElement:
                return new ParamElementOptions(nodeElement, parentElement, onSaveCallback);
            case MetaData.getActionTypes.DownloadPdfElement :
                return new DownloadPdfElementOptions(nodeElement,parentElement, onSaveCallback);    
            case MetaData.getActionTypes.APIToHTMLElement:
            case MetaData.getActionTypes.FileToHTMLElement:
            case MetaData.getActionTypes.BrowserToHtmlElement:
                return new APIToHTMLElementOptions(nodeElement, parentElement, onSaveCallback, elementType);
          
            default : return;
        }
    }
}