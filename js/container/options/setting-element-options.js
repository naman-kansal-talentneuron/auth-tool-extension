import ElementOptionsBase from "./element-options-base.js";
import DropDown from "../../component/drop-down.js";
import MetaData from "../../config/meta-data.js";
import TextBox from '../../component/text-box.js';
import TextArea from "../../component/text-area.js";

import Utils from "../../utils.js";

export default class SettingElementOptions extends ElementOptionsBase {


    #components = {

    };


    constructor(nodeElement,parentElement, onSaveCallBack) {
        super(parentElement);
        this.nodeElement = nodeElement;
        this.onSaveCallBack = onSaveCallBack;
        if(this.nodeElement.elementOptions){
            (typeof this.nodeElement.elementOptions == "string") && (this.nodeElement.elementOptions = JSON.parse(this.nodeElement.elementOptions));
        }
       

        this.renderOptions();
        
    }

    renderOptions() {
        this.createContainerDiv();
        this.createComponents();
    }

    /*onSaveChanges(){
        let options = {
            ...(this.#components.txtEngine.selectedItem !== undefined) && 
                { engine: this.#components.txtEngine.selectedItem.length === 0 ? undefined : this.#components.txtEngine.selectedItem },
        
            ...(this.#components.txtTurnstile.selectedItem !== undefined) &&
                { turnstile: this.#components.txtTurnstile.selectedItem },
        

            ...(this.#components.txtHeadless.selectedItem !== undefined) && 
                { headless: this.#components.txtHeadless.selectedItem },
        
            ...(this.#components.txtArgs.val !== "") && 
                { args: JSON.parse(this.#components.txtArgs.val)},
        
            ...(this.#components.txtCustomConfig.val !== "") && 
                { customConfig: JSON.parse(this.#components.txtCustomConfig.val)}
        };
        
        
        this.nodeElement = (Object.keys(options).length > 0) ? options : undefined; 
        return this.nodeElement;
    } */
        onSaveChanges() {
            let options = {};
            let errors = [];
        
            // Optimistic updates with error handling
        
            if (this.#components.txtEngine.selectedItem !== undefined) {
                options.engine = this.#components.txtEngine.selectedItem.length === 0 
                    ? undefined 
                    : this.#components.txtEngine.selectedItem;
            }
        
            if (this.#components.txtTurnstile.selectedItem !== undefined && this.#components.txtTurnstile.selectedItem !== "") {
                options.turnstile = this.#components.txtTurnstile.selectedItem === undefined ? undefined : JSON.parse(this.#components.txtTurnstile.selectedItem === "true");
            }
            
            if (this.#components.txtHeadless.selectedItem !== undefined) {
                options.headless = this.#components.txtHeadless.selectedItem === "true" || this.#components.txtHeadless.selectedItem === "false" 
                    ? JSON.parse(this.#components.txtHeadless.selectedItem) 
                    : this.#components.txtHeadless.selectedItem; // Keep as string if it's "shell"
            }
        
            if (this.#components.txtArgs.val !== "") {
                try {
                    options.args = JSON.parse(this.#components.txtArgs.val);
                } catch (error) {
                    errors.push("Invalid JSON in Args.");
                }
            }
        
            if (this.#components.txtCustomConfig.val !== "") {
                try {
                    options.customConfig = JSON.parse(this.#components.txtCustomConfig.val);
                } catch (error) {
                    errors.push("Invalid JSON in Custom Config.");
                }
            }
        
            // If there are errors, return them instead of options
            if (errors.length > 0) {
                return { error: errors.join(" ") }; // Combine multiple errors into a single message
            }
        
            this.nodeElement =  Object.keys(options).length > 0 ? options : undefined;
            return this.nodeElement;
        }
        



    ensureValidJSON = (value, type) => { 
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return (type === "array" && Array.isArray(parsed)) || 
                       (type === "object" && typeof parsed === "object" && parsed !== null) 
                       ? parsed : null;
            } catch {
                return null;
            }
        }
        return (type === "array" && Array.isArray(value)) || 
               (type === "object" && typeof value === "object" && value !== null) 
               ? value : null;
    };

    
    
    disableTurnstileOptions() {
        let isDisabled = (this.#components.txtEngine.selectedItem) === "real-browser" ? false : true;
        
        let turnstileElement = this.#components.txtTurnstile;
        
        if (isDisabled) {
            turnstileElement.element.value = "";
            turnstileElement.val !== undefined ? (turnstileElement.val = "") : 
            turnstileElement.selectedItem !== undefined ? (turnstileElement.selectedItem = "") : "";
        }
    
        turnstileElement.element.disabled = isDisabled;
        isDisabled ? turnstileElement.element.classList.add("read-only") : turnstileElement.element.classList.remove("read-only");
    }
    
    

    createComponents() {
        const lblStyle = "width: 50px;  font-weight: 550; padding-top:10px; margin-bottom:0px; ";
        const lblStyleAcc = "width: 100px;  font-weight: 550; padding-top:10px; margin-bottom:0px";
        const lblHeaderStyle = "font-size:14px; padding-top:10px; magin-bottom:0px";
        const autoFillbtnStyle = "margin-left: 5px;display: inline-block;height: min-content; width: fit-content;margin-top: 9px;background-color: #4095c6;";

      this.createLabel('divLblEngine', { style: lblStyle, id: 'lblEngine' }, 'Engine');
      this.#components.txtEngine = new DropDown('divEleEngine', 'uh_editor_txtEngine',MetaData.getEngineOptions, Utils.convertBooleanToString(this.nodeElement.elementOptions.engine),this.disableTurnstileOptions.bind(this));
     
   
   this.createLabel('divLblTurnstile', { style: lblStyle, id: 'lblTurnstile' }, 'Turnstile');
   this.#components.txtTurnstile = new DropDown('divEleTurnstile', 'uh_editor_txtTurnstile',MetaData.getBoolean, Utils.convertBooleanToString(this.nodeElement.elementOptions.turnstile), null);

   this.createLabel('divLblHeadless', { style: lblStyle, id: 'lblHeadless' }, 'Headless');
   this.#components.txtHeadless = new DropDown('divEleHeadless', 'uh_editor_txtHeadless',MetaData.getHeadlessOptions,Utils.convertBooleanToString(this.nodeElement.elementOptions.headless) ,null );
  
   this.createLabel('divLblArgs', { style: lblStyle, id: 'lblArgs' }, 'Args');
   this.#components.txtArgs = new TextArea('divEleArgs', 'uh_editor_txtArgs', '', this.nodeElement.elementOptions?.args ? JSON.stringify(this.ensureValidJSON(this.nodeElement.elementOptions.args, "array")) || '' : '','', 5, 100);
   
   this.createLabel('divLblCustomConfig', { style: lblStyle, id: 'lblCustomConfig' }, 'Custom Config');
   this.#components.txtCustomConfig = new TextArea('divEleCustomConfig', 'uh_editor_txtCustomConfig', '', this.nodeElement.elementOptions?.customConfig ? JSON.stringify(this.ensureValidJSON(this.nodeElement.elementOptions.customConfig, "object")) || '' : '', '', 5, 100);
 
   
   this.disableTurnstileOptions();     

}
createContainerDiv() {
        const tblStyle = "height:100%";
        const colStyle = "display:inline; width: 25%; min-width: 350px; margin-left: 25px";
        const colStyle2 = "display:inline; width: 25%; min-width: 350px; margin-left: 20px";
        const classRow = "margin-top:20px";
        const classCol = "display: inline-block;";
        const classColFullWidth = "display: inline-block; width: 98%";
        const classColEle = "display: inline-block;margin-left: auto;";

        let tblObj = {
            attr: { style: tblStyle },
            id: "tblEditorSub",
            rows: [
                {
                    attr: { style: classRow },
                    col: [
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblHeadless" } }, { attr: { style: classColEle, id: "divEleHeadless" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblEngine" } }, { attr: { style: classColEle, id: "divEleEngine" } }] },
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblTurnstile" } }, { attr: { style: classColEle, id: "divEleTurnstile" } }] },
                        
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblArgs" } }, { attr: { style: classColEle, id: "divEleArgs" } }] },
                      
                    ]
                },
                {
                    attr: { style: classRow },
                    col: [
                      
                        { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblCustomConfig" } }, { attr: { style: classColEle, id: "divEleCustomConfig" } }] }
                    ]
                }
                
             ]
        }
        let divSub = this.createTable(tblObj);

        this.mountContainerToParent(divSub);

    }
}