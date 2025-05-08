export default class CRCField {
    constructor(fieldName, fieldSelector, fieldSelectorType, fieldSelectorContextOn, value, parent) {
        this.fieldName = fieldName;
        this.fieldSelector = fieldSelector;
        this.fieldSelectorType = fieldSelectorType;
        this.fieldSelectorContextOn = fieldSelectorContextOn;
        this.fieldValue = value;
        this.fieldParent = parent;
    }

}