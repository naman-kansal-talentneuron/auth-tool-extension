import ShowErrDialog from '../component/showError-dialog.js';
import ElementUtil from '../helper/element-util.js'
import HarvesterMacroPreview from "./harvester-macro-preview.js";
import Utils from "../utils.js";

export default class MacrosProgressModal {

  elementUtil = null;
  dialogReference = null;
  statusLogSubscriber = null;
  nodeId = null;

  constructor(harvesterScriptObj, category, nodeName, onSetMacrosPreviewCallback,proxyData) {
    this.nodeId = nodeName;
    this.onSetMacrosPreviewCallback = onSetMacrosPreviewCallback;
    this.macroPreviewEvaluation = new HarvesterMacroPreview(harvesterScriptObj, category, nodeName, this.onEvaluateCallBack.bind(this), proxyData);
    this.elementUtil = new ElementUtil();
  }

  /**
   * Callback for evaluation complete for the macros substitution.
   * @param {*} response has query, result or error.
   */
  onEvaluateCallBack(response, isError){

    if(isError){
      this.updateErrorLog(response, true);
      return;
    }

    if(this.macroPreviewEvaluation._currentStatus.isRequestCancelled){
      console.log("Request cancelled manually");
      return;
    }

    let nodeResponse = response[this.nodeId];

    if(nodeResponse && !this.macroPreviewEvaluation._currentStatus.isPrepareInProgress){
      if(nodeResponse.error) {
        this.updateErrorLog(nodeResponse.error);
      } else {
        this.onSetMacrosPreviewCallback(nodeResponse);
        this.dialogReference.destroy();
        return;
      }
    } else if(!this.macroPreviewEvaluation._currentStatus.isPrepareInProgress) {
      let isErrorFound = false;
      Object.keys(response).forEach((node) => { 
        if(response[node].error){
          isErrorFound = true;
          this.updateErrorLog({...response[node], id: node}, true);
        }
      })
      if(!isErrorFound){
        this.updateErrorLog("Node information missing in the response.");
      }
    }
  }

  /**
   * Modal is displayed with status or error if present.
   */
   launchMacrosEvalModal() {
    
    this.macroPreviewEvaluation.evaluate();

    let dialogRenderBodyCallback = () => { return this.dialogRenderBodyCallback(); }

    this.dialogReference = new ShowErrDialog({
      okButtonText: "",
      errorText: "",
      warningText: " ",
      renderHtmlCallBack: dialogRenderBodyCallback,
      registerButtonGroupObject: [{ name: "Cancel", isAutoClose: true, callback: this.handleLogDialogClose.bind(this) }]
    });

    this.dialogReference.confirm();
    Utils.processingLoader(true, document.getElementById("divTitle"));
  }


  /**
  * Clears the statusLogSubscriber reference if created.
  */
  handleLogDialogClose() {
    this.macroPreviewEvaluation._currentStatus.isRequestCancelled = true;
    this.statusLogSubscriber && clearInterval(this.statusLogSubscriber)
  }

  /**
   * Dynamically updates Status console and errors if present.
   * @returns - constructed dialog box
   */
  dialogRenderBodyCallback = () => {

    const headerLblStyle = "width: 100%; font-size:large; display: inline-flex; align-items: center; justify-content: center; font-weight: 900;";
    const statusLogStyle = "font-weight: 100; font-size: small; padding : 2px 0px 0px 5px; max-height: 250px; overflow: hidden; float: left;";
    const errorLogStyle = "font-weight: 100; font-size: small; padding : 2px 0px 0px 5px; color: red; float: left; clear: left;";
    let parentDialogEle = this.elementUtil.prepareParentElement(null, "evaluatorContainer", "");

    this.statusLogSubscriber = setInterval(this.updateStatusLogs.bind(this), 300);

    this.elementUtil.createLabelWithElement(parentDialogEle, { id: "divTitle", style: headerLblStyle }, "Macros Substitution")
    this.elementUtil.createLabelWithElement(parentDialogEle, { id: 'statusContainer', style: statusLogStyle }, "Fetching Macros information");
    this.elementUtil.createLabelWithElement(parentDialogEle, { id: 'errorContainer', style: errorLogStyle }, "");
    return parentDialogEle;
  }


  /**
   * Updates the status console dialog box with the progress message.
   */
  updateStatusLogs() {

    let status = this.macroPreviewEvaluation._currentStatus;

    if (status.isError || status.isCompleted) {
      clearInterval(this.statusLogSubscriber);
    } if (status.isCompleted && !status.isError) {
      return;
    }
      document.getElementById("statusContainer").innerText = status.console.join('\n');
  }

  /**
   * Error is updates in the displayed modal popup.
   * @param {*} error - error message with other details related to macros evaluation.
   * @param {*} isDependentNodeError - previous node failed during macros eval.
   */
  updateErrorLog(error, isDependentNodeError){

    document.getElementById("divTitle").innerHTML = "Error substituting macros - <span style='color:red'>" + this.nodeId + "</span>";

    let errorMessage = "";

    if (error){
      if(isDependentNodeError){
        errorMessage = "Failed to evaluate for below dependant nodes <br> " + `1) <span style='font-weight:bold'> ${error.id} <br>  </span> `
        error = error.error;
      }
      document.getElementById("errorContainer").innerHTML = errorMessage + error;
    }
    document.getElementById("Cancel").innerText = "Close";
  }

}