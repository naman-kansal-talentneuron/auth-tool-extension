export default class ConfirmDialog {
  constructor({ questionText, trueButtonText, falseButtonText }, clickYes, clickNo, node, parentIndex, selectedIndex, nodeType, actualNode,selectedNode) {
    this.questionText = questionText || 'You have unsaved changes. Are you sure to proceed?';
    this.trueButtonText = trueButtonText || 'Yes';
    this.falseButtonText = falseButtonText || 'No';

    this.dialog = undefined;
    this.trueButton = undefined;
    this.falseButton = undefined;
    this.parent = document.body;
    this.clickYes = clickYes;
    this.clickNo = clickNo;
    this.node = node;
    this.parentIndex = parentIndex;
    this.selectedIndex = selectedIndex;
    this.nodeType = nodeType;
    this.actualNode = actualNode;
    this.selectedNode=selectedNode;

    this.createDialog();
    this.appendDialog();
  }

  createDialog() {
    this.dialog = document.createElement("dialog");
    this.dialog.classList.add("confirm-dialog");

    const question = document.createElement("div");
    question.textContent = this.questionText;
    question.classList.add("confirm-dialog-question");
    this.dialog.appendChild(question);

    const buttonGroup = document.createElement("div");
    buttonGroup.classList.add("confirm-dialog-button-group");
    this.dialog.appendChild(buttonGroup);

    this.falseButton = document.createElement("button");
    this.falseButton.classList.add(
      "confirm-dialog-button",
      "confirm-dialog-button--false"
    );
    this.falseButton.type = "button";
    this.falseButton.textContent = this.falseButtonText;
    buttonGroup.appendChild(this.falseButton);

    this.trueButton = document.createElement("button");
    this.trueButton.classList.add(
      "confirm-dialog-button",
      "confirm-dialog-button--true"
    );
    this.trueButton.type = "button";
    this.trueButton.textContent = this.trueButtonText;
    buttonGroup.appendChild(this.trueButton);
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

    this.trueButton.addEventListener("click", function () {
      this.clickYes(this.node, this.parentIndex, this.selectedIndex, this.nodeType,this.actualNode,this.selectedNode);
      this.destroy();
    }.bind(this));

    this.falseButton.addEventListener("click", function () {
      this.clickNo();
      this.destroy();
    }.bind(this));
  }
}
