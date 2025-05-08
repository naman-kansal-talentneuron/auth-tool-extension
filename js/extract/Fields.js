import Field from "./Field.js";
export default class Fields {

    isgroup = true;
    fieldName = ""; 
    fields = [];
    index = 0;
    parent = null;

    constructor (_fieldName, parent, index) {        
        this.fieldName = _fieldName;       
        this.fields = [];
        this.index = index ? index : 0;
        this.parent = parent;
    }

    addField( fieldName, mode, value){        
        let item = new Field(fieldName, mode , value);
        this.fields.push(item );
        return item;
    }

    addFields( fieldName){
        let item = new Fields(fieldName);
        this.fields.push(item );
        return item;
    }
}