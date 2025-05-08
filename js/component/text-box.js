import BaseComponent from "./base-component.js";


export default class TextBox extends BaseComponent {

    
    constructor(parentElementId, id, classname , val, placeholder, onChange, onBlur, onFocus, onKeyUp,type, isEnable, isMandatory) {

        super(parentElementId, id);        
        this.id = id;
        this.classname = classname;
        this.val = val;
        this.placeholder = placeholder;
        this.onChange = onChange;
        this.onBlur = onBlur;
        this.onFocus = onFocus;
        this.isDirty = false;
        this.onKeyUp = onKeyUp;
        this.type = type && type != ''? type: 'text';
        this.isEnable = isEnable;
        this.element = null;
        this.isMandatory = isMandatory;
        this.renderControl();      
    }
    
    renderControl() {        
        
        let txtBox = document.createElement('INPUT');        

        //Override externaly set styles
       // let textBoxStlye = "border: 2px solid #d3d3d3; height: 20px; font-size:10px;  padding: 0 3px; color: #616161; -webkit-box-shadow: none; box-shadow: none;  background-color: #fff; border-radius: 0px; width: 120px;";
        //textBoxStlye = this.classname ? "" : textBoxStlye;
        let classname  = this.classname ? "" : "toolinput";
        
        // Set attributes 
        this.setAttributes(txtBox, {"value":this.val , "id": this.id, "style": "", "class" : classname , "placeholder": this.placeholder, type : this.type});                 

        // Register events
        this.registerEvents(txtBox, {"change": this.onTextChange.bind(this), "keyup":this.onTextKeyUp.bind(this) , "blur": this.onBlur, "focus": this.onFocus});                         
        
        // Mount component to parent
        this.mountComponent(txtBox);

        this.element = txtBox;        
    }

    setValue(val) {
        this.val = val;
        document.getElementById(this.id).setAttribute('value', this.val);
        document.getElementById(this.id).value = this.val;
        this.validateValue( this.val);
    }

    getValue() {
        return this.val;
    }

    onTextChange(event) {        
        this.isDirty = true;                
        this.val = event.target.value;

       this.validateValue( this.val);

        if(this.onChange) {
            this.onChange(event, this);
        }
    }

    onTextKeyUp(event) {      
        this.val = event.target.value;
        if(this.onKeyUp) {
            this.onKeyUp(event, this);
        }
    }

    // called when a form is saved
} 