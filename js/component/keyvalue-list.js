import BaseComponent from "./base-component.js"

export default class KeyValueList extends BaseComponent {

    constructor (parentElement, id, classname, arrKeyValue, onChangeCallback) {
      super(parentElement);
      this.id = id;
      this.classname = classname;
      this.arrKeyValue = arrKeyValue;
      this.onChangeCallback = onChangeCallback;      
      this.renderControl();
         
    }
    renderControl () {
      // Render contrl for each key value pair
       //this.arrKeyValue.push({key:"", value: ""});   
       
       document.getElementById(this.parentElement).innerHTML = "";
            
       let i = 0;
       for(var Key in this.arrKeyValue) {
          this.createControl(this.arrKeyValue[Key].key, this.arrKeyValue[Key].value, i++)
       }     
       this.createControl("","", i++);
       this.onChangeOfKeyValueElements();
    }   
   
    onChangeOfKeyValueElements() {
      var inputs = document.querySelectorAll('[id^='+this.id +'_txt]');
      var i = 0;
      for (i = 0; i < inputs.length; i++) {
          inputs[i].addEventListener('change', this.updateArrKeyValue.bind(this));
          inputs[i].addEventListener('change', this.onChangeCallback);
      }

      var inputs = document.querySelectorAll('[id^='+this.id +'-btn]');
      var i = 0;
      for (i = 0; i < inputs.length; i++) {
          inputs[i].addEventListener('click', this.onChangeCallback);
      }
    }

    createControl (key, value, i) {
        // Create Container
        let container = document.createElement('DIV');
        this.setAttributes(container, {"id": 'div'+ this.id+"_container_"+i, "class" : this.classname, "style": "margin-top: 10px"})
    
        // Create Key 
        let divInputKey = this.createKey(key,i);      
        container.appendChild(divInputKey);
        
        // Create Value
        let divInputValue = this.createValue(value, i);
        container.appendChild(divInputValue);
        
        // Create Button
        let divButton = this.createAddOrRemoveButton(key, i);
        container.appendChild(divButton);
        
        // mount componenet to parent div
        this.mountComponent(container);  
      }

      
    createKey(key, i) {
        let divInputKey = document.createElement('DIV');     
        this.setAttributes(divInputKey, {"id": 'div'+this.id +"_divInputKey_"+i, "style" : "display: inline;"})     
        
        let txtKey = document.createElement('INPUT');
        const txtBoxStyle = "margin-left: 15px; border: 2px solid #d3d3d3; height: 20px; font-size:10px;  padding: 0 3px; color: #616161; -webkit-box-shadow: none; box-shadow: none;  background-color: #fff; border-radius: 0px; width: 150px;";
        this.setAttributes(txtKey, {"id": this.id +"_txtKey_" + i, "style" : txtBoxStyle, "placeholder": "Key", "value": key})
        
        divInputKey.appendChild(txtKey);
        return divInputKey;
    }

    createValue(value, i) {
        let divInputValue = document.createElement('DIV');     
        this.setAttributes(divInputValue, {"id":'div'+ this.id+ "-InputValue_" + i, "style" : "display:inline;"});     
        
        const txtBoxStyle = "margin-left: 15px;border: 2px solid #d3d3d3; height: 20px; font-size:10px;  padding: 0 3px; color: #616161; -webkit-box-shadow: none; box-shadow: none;  background-color: #fff; border-radius: 0px; width: 280px;";
        let txtValue = document.createElement('INPUT');     
        this.setAttributes(txtValue, {"id": this.id+ "_txtValue_" + i, "style" : txtBoxStyle, "placeholder": "Value", "value": value});
    
        divInputValue.appendChild(txtValue);
        return divInputValue;
    }
    
    createAddOrRemoveButton(key, i) {

        let divButton = document.createElement('DIV');
        this.setAttributes(divButton, {"id": 'div'+this.id+ "-ButtonAdd_" + i, "style" :"display:inline; "});
     
        const btnStyle = "margin-right:20px;margin-left: 15px;";
//        const _btnStyle = "color: #002856; background-color: transparent; border: 2px solid #002856; text-align: center;font-weight: 500; line-height: 19px; height: 32px; max-width: 80px; width: 30%; margin-right:3%;";
        let btnAddOrRemove = document.createElement('BUTTON');
     
        this.setAttributes(btnAddOrRemove, {"id": this.id+ "-btn_AddOrRemove_"+ i, "style": btnStyle, "index": i});
        this.registerEvents(btnAddOrRemove, {"click":  this.onAddOrRemove.bind(this) , "mouseover": this.onMouseHover, "mouseleave": this.onMouseOut});                         
        
        btnAddOrRemove.innerHTML = key == "" ? "+" : "-";
        
        // Append to parent
        divButton.appendChild(btnAddOrRemove);      
        return divButton;
    }
  
    // onMouseHover(event) {      
    //   const btnStyle = "margin-right:20px";
    //   event.target.setAttribute("style", btnStyle);    
    // }       
    // onMouseOut(event) {   
    //   const btnStyle = "margin-right:20px";
    //   event.target.setAttribute("style", btnStyle);    
    // }
  
    onAddOrRemove(event, obj) {
      event.target.innerHTML == "+"? this.onAddRow(event, obj) : this.onRemoveRow(event,obj);
    }

    onAddRow(event, obj) {

          let i = event.target.getAttribute('index');
  
          let key = document.getElementById(this.id.split('-')[0]+'_txtKey_'+i);
          let val = document.getElementById(this.id.split('-')[0]+'_txtValue_'+i);    
          
          if(this.validateOnAddingNewRow(key, val)) {            
              //If both are not empty, Create a new row, rename old row                               
              this.arrKeyValue.push({key:key.value, value: val.value});
              //event.target.innerHTML = "-";
              //this.registerEvents(event.target, {'change': this.onRemoveRow.bind(this)});
              //this.createControl("","", i+1); 
              this.renderControl();
          }      
          
      }
  
    onRemoveRow(event, obj) {        
      
      let i = event.target.getAttribute('index');
      //let key = document.getElementById(this.id.split('-')[0]+'_txtKey_'+i);
      //let val = document.getElementById(this.id.split('-')[0]+'_txtValue_'+i);    
      this.arrKeyValue.splice(i,1);
      //delete this.arrKeyValue[i];
      //event.target.parentElement.parentElement.remove();       
      this.renderControl();
    }
    
    validateOnAddingNewRow(key, val) {        
        //If key is empty, focus on key text box            
        let isValid = false;
        key.value == "" ? key.focus(): val.value == "" ? val.focus() : isValid= true;
        return isValid;
    }

  
    getOptions() {
      return this.arrKeyValue;
    }

    /**
     * Adds Key and Value to the List of Key values and calls the auto-save function
     * @param {key} "Name of the key" 
     * @param {value} "Name of the value"
     * @example 
     * this.addToKeyValueList("sampleKey", "sampleValue"); 
     */
    addToKeyValueList = (key, value) => {
      this.arrKeyValue.push({key, value});
      this.renderControl();
      this.onChangeCallback();
    }

    /**
     * Updates the key if it is present in arrKeyValue list irrespective of if it's uppercase or lowercase. <br />
     * If the key is not present, it does nothing.
     * @param {key} "Name of the key" 
     * @param {value} "Name of the value" 
     * @example
     * this.updateValueByKey("existingKey", "newValue");
     */
    updateValueByKey = (key, value) => {
      this.arrKeyValue = this.arrKeyValue.map( entry => {
        if(entry.key.toLowerCase() === key.toLowerCase()) {
          entry.value = value;
        }
        return entry;
      })

      this.renderControl();
      this.onChangeCallback();
    }

    /**
     * @description: Updates the modified value to arrKeyValue object.
     */
    updateArrKeyValue(event){
      let index = event.target.id.split('_').slice(-1)[0];
      let objectType = event.target.placeholder; // key or value
      let value = event.target.value; // updated value
      this.arrKeyValue.length > index && (this.arrKeyValue[index][objectType.toLowerCase()] = value);
    }

    getOptionsAsObject() {
      let i = 0;
      let arrKeyValue={};
      for(i=0; i<= this.arrKeyValue.length; i++) {
        // this.createControl(this.arrKeyValue[Key].key, this.arrKeyValue[Key].value, i++)
        let key = document.getElementById(this.id.split('-')[0]+'_txtKey_'+i);
        let val = document.getElementById(this.id.split('-')[0]+'_txtValue_'+i);    
        if(key.value !== ""){
          arrKeyValue[key.value] = val.value;
        }
      } 
      return arrKeyValue; 

    }
  
  }