export default class ShowErrDialog {
  constructor({ errorText, warningText, okButtonText, renderHtmlCallBack, registerButtonGroupObject}, clickNo) {
    this.errorText = errorText || 'You have no error(s) to be displayed';
    this.warningText = warningText || 'You have no warning(s) to be displayed';
    this.okButtonText = okButtonText || 'OK'; 
    this.renderHtmlCallBack = renderHtmlCallBack;
    this.dialog = undefined;
    this.okButton = undefined;
    this.parent = document.body;    
    this.clickNo = clickNo;
    this.registerButtonGroupObject = registerButtonGroupObject;

    this.createDialog();
    this.appendDialog();
  }

  createDialog() {
    this.dialog = document.createElement("dialog");
    this.dialog.classList.add("confirm-dialog");

    if( this.renderHtmlCallBack){
      this.dialog.appendChild( this.renderHtmlCallBack());
    }
    else{
      const error = document.createElement("div");
      error.innerHTML = this.errorText;
      error.classList.add("confirm-dialog-error");
      error.classList.add("div-space");
      this.dialog.appendChild(error);

      const warning = document.createElement("div");
      warning.innerHTML = this.warningText;
      warning.classList.add("confirm-dialog-warning");
      warning.classList.add("div-space");
      this.dialog.appendChild(warning);
    }
    const buttonGroup = document.createElement("div");
    buttonGroup.classList.add("confirm-dialog-button-group");
    this.dialog.appendChild(buttonGroup);

    if(this.registerButtonGroupObject && this.registerButtonGroupObject.length > 0){
      for(var button of this.registerButtonGroupObject){
        this.createButton(button.name, buttonGroup, button.callback, button.isAutoClose);
      }
    } else{
      this.createButton(this.okButtonText, buttonGroup, null, true);
    }
  }

  createButton(buttonText, buttonGroup, onClickHandler, isAutoClose){

    let button = document.createElement("button");
    button.setAttribute("id", buttonText);
    button.classList.add("confirm-dialog-button", "confirm-dialog-button--true");
    button.type = "button";
    button.textContent = buttonText;
    onClickHandler && button.addEventListener("click", onClickHandler);
    isAutoClose == true && button.addEventListener("click", function () {
      this.destroy();
    }.bind(this))

    buttonGroup.appendChild(button);
  }

  appendDialog() {
    this.parent.appendChild(this.dialog);
  }

  destroy() {
    this.parent.removeChild(this.dialog);
    delete this;
  }

  confirm() {
    this.dialog.showModal();
  }
}
