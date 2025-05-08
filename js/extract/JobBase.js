import Fields from "./Fields.js";
import Field from "./Field.js";

export default class JobBase {

    jobname = "";
    fieldArr = [];

    constructor( _jobName) {
        this.jobname = _jobName;
    }

    addField(fieldName, mode , value) {      
        
        let found = this.fieldArr.some(el => el.fieldName === fieldName);  
        if (! found)  {

            let field = new Field(fieldName, mode , value);

            if( field.fieldName.toLowerCase() === '__selector'){
                this.fieldArr.unshift(field);    
            }else
            {
                this.fieldArr.push(field);  
            }
        }
    }

    addFields( fieldName){
        let item = new Fields(fieldName);
        this.fieldArr.push(item );
        return item;
    }

}