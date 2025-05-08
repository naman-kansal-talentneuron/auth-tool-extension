export default class Field {
    constructor (fieldName,fieldMode, fieldValue, parent, index) {
        this.fieldName = fieldName;       
        this.fieldMode = fieldMode;
        this.fieldValue = (fieldValue) && fieldValue.replace(/\r?\n|\r/g, "");
        this.index = index ? index : 0;
        this.parent = parent;
        this.isvalid = true;
        this.error = "";
    }
}