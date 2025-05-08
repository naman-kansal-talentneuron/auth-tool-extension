import BasicElement from "./BasicElement.js";
import LinkElement from "./LinkElement.js";
import SelectElement from "./select-element.js";
import ClickElement from "./click-element.js";
import ScrollDownElement from "./scroll-down-element.js";
import InputTextElement from "./input-text-element.js";
import ScriptElement from "./script-element.js";
import WaitingElement from "./waiting-element.js";
import FocusElement from "./focus-element.js";
import KeyboardEvent from "./keyboard-element.js";
import MouseEvent from "./mouse-event.js";
import ParamElement from "./ParamElement.js";
import APIHtmlElement from "./APIHtmlElement.js"
import FileHTMLElement from "./FileHTMLElement.js"
import DownloadPdfElement from "./DownloadPdfElement.js";
import BrowserHtmlElement from "./BrowserHtmlElement.js";
export default class ElementFactory {

    createElement(element, extractorObj) {

        let elementType = element.type;
        switch (elementType) {

            case "BasicElement":
                return new BasicElement(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, element.multiple, element.maxIteration, element.fetchType, extractorObj,element.crc,element.onComplete, element.persistWithData);

            case "LinkElement":
                return new LinkElement(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, element.isNewTab, element.onComplete, extractorObj,element.crc);

            case "SelectElement":
                return new SelectElement(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, element.select, extractorObj,element.crc);

            case "ClickElement":
                return new ClickElement(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, element.multiple,  element.maxIteration, element.fetchType, element.childFirst, extractorObj,element.crc);

            case "InputTextElement":
                return new InputTextElement(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, element.text, extractorObj,element.crc);

            case "ScrollDownElement":
                return new ScrollDownElement(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, extractorObj,element.crc);

            case "ScriptElement":
                return new ScriptElement(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, element.multiple, element.maxIteration, element.fetchType, element.childFirst, extractorObj, element.crc, element.persistWithData);

            case "WaitingElement":
                return new WaitingElement(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, extractorObj, element.crc);

            case "FocusElement":
                return new FocusElement(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, extractorObj, element.crc);

            case "KeyboardEvent":
                return new KeyboardEvent(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, extractorObj, element.crc);

            case "MouseEvent":
                return new MouseEvent(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, extractorObj, element.crc);
            
            case "ParamElement":
                return new ParamElement(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, extractorObj, element.crc, element.values);
            
            case "APIToHTMLElement":
                return new APIHtmlElement(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, extractorObj, element.crc, element.values);
            case "BrowserToHtmlElement":
                return new BrowserHtmlElement(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, extractorObj, element.crc, element.values);
            case "FileToHTMLElement":
                return new FileHTMLElement(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, extractorObj, element.crc, element.values,null,null, element.proxy);
            case "DownloadPdfElement":
                return new DownloadPdfElement(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, element.multiple, element.maxIteration, element.fetchType, extractorObj,element.crc,element.onComplete, element.persistWithData);
            default:
                return new BasicElement(element.id, element.type, element.selector, element.selectorType, element.parent, element.persist, element.options, element.documentType, element.multiple, element.maxIteration, element.fetchType, extractorObj,element.crc,element.onComplete, element.persistWithData);
        }
    }
}