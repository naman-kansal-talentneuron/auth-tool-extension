import BaseComponent from "./base-component.js";

export default class CheckBox extends BaseComponent {
    constructor(parentElement, id, selectedItem, onChange, isMandatory, className) {

        super(parentElement);
        this.id = id;
        this.selectedItem = selectedItem == undefined ? false: selectedItem;
        this.onChange = onChange;
        this.isMandatory = isMandatory;
        this.className = className;
        this.renderControl();
    }    

    renderControl() {        
        // Creating dropdown Menu
        let checkBox =  this.createCheckbox();
        checkBox.checked = this.selectedItem;
        // Mounting constructed element to parent
        this.mountComponent(checkBox);
    }

    onCheckBoxSelection(event) {
        
        this.selectedItem = event.target.checked;
        this.validateValue(this.selectedItem);

        if(this.onChange) {
            this.onChange(event, this);
        }
    }  


    createCheckbox() {
        let checkBox = document.createElement('INPUT');
        checkBox.type ="checkbox"
        let checkBoxStyle = "border-radius: 6px; padding-left: -10px; border-color: rgb(0 0 0 / 25%); display:inline; width: 50px;  font-weight: 400; margin: 17px 0px 0px 0px;";
        this.className = this.className? this.className:""
        this.setAttributes(checkBox, {id: this.id, "class": "check-box-custom", style : checkBoxStyle, class:this.className});
        this.registerEvents(checkBox, { "change" : this.onCheckBoxSelection.bind(this)});
        return checkBox;
    }

    
    getSelectedItem() {
        let e = document.getElementById(this.id);                
        return e.checked;
    }    
    
} 
