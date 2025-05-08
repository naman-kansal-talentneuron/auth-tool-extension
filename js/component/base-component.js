export default class BaseComponent {

  constructor(parentElement, currentElement) {
    this.parentElement = parentElement;
    this.mountedComponent;
    this.currentElement = currentElement;
    this.isEnable = true;
    this.element = null;
  }
  renderControl() {
    // Abstract method
  }

  mountComponent(finalEle) {
    this.parentElement ? document.getElementById(this.parentElement).appendChild(finalEle) : this.mountedComponent = finalEle;
    this.element = finalEle;

    //Get the values based on Object
    let value  = this.selectedItem || this.val;
    //Validate the value and set the warning message based on value
    this.validateValue( value); 
  }

  setAttributes(el, arrAttrs) {
    for (var key in arrAttrs) {
      el.setAttribute(key, arrAttrs[key]);
    }
  }

  registerEvents(el, arrEvents) {
    for (var key in arrEvents) {
      el.addEventListener(key, arrEvents[key]);
    }
  }

  // called when a form is saved
  resetDirtyFlag() {
    this.isDirty = false;
  }

  enableControl(isEnable) {
    this.isEnable = isEnable;
    document.getElementById(this.currentElement).style.display = isEnable ? "inline-block" : "none";
  }

  validateValue(value) {
    if (this.isMandatory) {
      this.element.style.border = value && value.trim().length ? "2px solid #d3d3d3" : "2px solid red";
    }
  }
}




