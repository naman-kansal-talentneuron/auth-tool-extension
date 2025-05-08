import CRCField from './CRCField.js'
export default class CRCNode {
    constructor(document, crcFields) {
        this.document = document;
        this.crcFieldsArr = crcFields;
        if( !this.crcFieldsArr){
            this.setDefaultValues();
        }
    }

    setDefaultValues(){
        this.crcFieldsArr = []
        this.crcFieldsArr.push( new CRCField('uh_crc_text',  '', 'xpath','','innerText'));
        this.crcFieldsArr.push( new CRCField('url',  '', 'xpath', '','innerText'));
    }
}