
import BaseComponent from "./base-component.js";
export default class TextArea extends BaseComponent {
    constructor(parentElementId, id, classname, val, placeholder, row, col, onChange, onBlur, onFocus, onKeyUp, readonly, isMandatory) {
        super(parentElementId);
        this.id = id;
        this.classname = classname;
        this.val = val;
        this.row = row;
        this.col = col;
        this.placeholder = placeholder;
        this.onChange = onChange;
        this.onBlur = onBlur,
        this.onFocus = onFocus,
        this.isDirty = false;
        this.onKeyUp = onKeyUp;
        this.readonly = readonly
        this.isMandatory = isMandatory;
        this.htmlContent = '';
        this.renderControl();
    }

    renderControl() {
        let txtBox = document.createElement('TEXTAREA');

        //Override externaly set styles
        //let textBoxStlye = "border: 2px solid #d3d3d3; height: 22px; font-size:10px;  padding: 0 3px; color: #616161; -webkit-box-shadow: none; box-shadow: none;  background-color: #fff; border-radius: 0px; width: 170px;";
        //textBoxStlye = this.classname ? "" : textBoxStlye;
        txtBox.innerHTML = this.val;
        let classname = this.classname ? this.classname : "toolinput"

        // Set attributes 
        let attrArr = { "id": this.id, rows: this.row, cols: this.col, "style": "", "class": this.classname, "placeholder": this.placeholder, type: this.type };
        if (this.readonly) {
            attrArr.readonly = "readonly";
        }

        //this.setAttributes(txtBox, { "id": this.id, rows: this.row, cols: this.col, "style": textBoxStlye, "class": this.classname, "placeholder": this.placeholder, type: this.type });
        this.setAttributes(txtBox, attrArr);
        

        // Register events
        this.registerEvents(txtBox, { "change": this.onTextChange.bind(this), "keyup": this.onTextKeyUp.bind(this), "blur": this.onBlur, "focus": this.onFocus });

        // Mount component to parent
        this.mountComponent(txtBox);
    }
    setValue(val) {
        this.val = val;
        let ele = document.getElementById(this.id);
        ele.innerHTML = this.val;
      
        this.htmlContent = ele.value;

        if ("createEvent" in document) {
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent("change", false, true);
            ele.dispatchEvent(evt);
        }
        else
            ele.fireEvent("onchange");

    }

    getValue() {
        return this.val;
    }

    getHtmlContent() {
        return this.htmlContent;
    }

    onTextChange(event) {
        this.isDirty = true;
        this.val = event.target.value;

        this.validateValue( this.val);
        
        if (this.onChange) {
            this.onChange(event, this);
        }
    }

    onTextKeyUp(event) {
        this.val = event.target.value;
        if (this.onKeyUp) {
            this.onKeyUp(event, this);
        }
    }





}