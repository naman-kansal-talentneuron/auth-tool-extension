import BaseComponent from "./base-component.js";

export default class DropDown extends BaseComponent {
    constructor(parentElement, id, ddlOptions,selectedItem, onChange, selectmenuClass, optionsClass, isMandatory, isMultiSelect, isDefaultSelectOptionRequired = true) {
        super(parentElement,id);
        this.id = id;
        this.ddlOptions = ddlOptions;
        this.selectedItem = selectedItem == undefined || selectedItem == ""? undefined: selectedItem;
        this.onChange = onChange;
        this.classname = this.classname;
        this.isDirty = false;
        this.isMandatory = isMandatory;
        this.isMultiSelect = isMultiSelect;
        this.isDefaultSelectOptionRequired = isDefaultSelectOptionRequired;
        this.renderControl();
    }    

    renderControl() {        
        // Creating Select Menu
        let dropdown =  this.createSelectMenu();

        // Creating Select menu options 
        !this.isMultiSelect && this.isDefaultSelectOptionRequired && dropdown.appendChild(this.createOptions("Select"));

        for(var key in this.ddlOptions) {           
            dropdown.appendChild(this.createOptions(key));            
        }
        
        // Mounting constructed element to parent
        this.mountComponent(dropdown);
        
    }

    onSelectedItemChange(event) {
        
        this.isDirty = true;
        this.selectedItem = [];

        if(this.isMultiSelect){
            for(var option of event.target.options){
                if(option.selected){
                    this.selectedItem.push(option.value);
                }
            } 
        } else {
            this.selectedItem = event.target.options[event.target.selectedIndex].value == "Select"? undefined:event.target.options[event.target.selectedIndex].value ;
        }
        
        this.validateValue(this.selectedItem);

        if(this.onChange) {
            this.onChange(event, this);
        }
    }  


    createSelectMenu() {
        let dropdown = document.createElement('SELECT');
        this.isMultiSelect && this.setAttributes(dropdown, {multiple: "multiple", size: 3});
        
        let dropdownstyle = "position: relative; overflow: hidden; height: 20px; background-color: #fff; border: 2px solid #d3d3d3;" +    
        "-webkit-box-sizing: border-box; box-sizing: border-box; color: #616161; cursor: default; outline: none; padding: 2px 2px 2px 2px; -webkit-transition: all .2s ease; -o-transition: all .2s ease; transition: all .2s ease; border-radius: 0px; width: 120px" ;
        dropdownstyle = this.selectmenuClass ? "": dropdownstyle;
        this.selectmenuClass = this.selectmenuClass ? this.selectmenuClass : "select-css"
        dropdownstyle = "";

        this.setAttributes(dropdown, {id: this.id, "class": this.selectmenuClass, style : dropdownstyle});
        this.registerEvents(dropdown, { "change" : this.onSelectedItemChange.bind(this)});
        return dropdown;
    }
    
    createOptions(key) {
        let optionsStyle ="max-height: 368px; background-color: #fff;  border: 2px solid #d3d3d3; -webkit-box-shadow: 0 1px 3px 0 rgba(97,97,97,.28); box-shadow: 0 1px 3px 0 rgba(97,97,97,.28); padding-bottom: 10px; padding-top: 10px; -webkit-box-sizing: border-box; box-sizing: border-box; margin-top: 0; width: 100%"+
        +"overflow-y: auto; position: absolute; top: 100%; width: 220px; z-index: 1000;";
        optionsStyle = this.optionsClass? "" : optionsStyle;        
        optionsStyle  = ""

        let options = document.createElement('OPTION');
        this.setAttributes(options,{id: 'opt_'+this.id, "class": this.optionsClass, style : optionsStyle, value : key});
        options.innerHTML = this.ddlOptions && this.ddlOptions[key] ? this.ddlOptions[key] : "Select";                        
        
        if(this.isMultiSelect){
            options.selected = this.selectedItem && this.selectedItem.length > 0 ? this.selectedItem.includes(key) : false;
        } else {
            options.selected = this.selectedItem == key;
        }
        return options;
    }
    
    getSelectedItem() {
        let e = document.getElementById(this.id);                
        return e.options[e.selectedIndex].text;
    }    
    
} 
