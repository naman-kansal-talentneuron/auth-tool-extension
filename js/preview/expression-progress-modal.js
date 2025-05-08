import ShowErrDialog from '../component/showError-dialog.js';
import ElementUtil from '../helper/element-util.js'
import ExtractorExpEvaluator from "./extractor-exp-evaluator.js";
import Utils from '../utils.js';

export default class ExpressionProgressModal {

  elementUtil = null;
  statusLogSubscriber = null;
  dialogReference = null;
  expParamData = null;
  HPARAM_SESSION_OBJECT_NAME = "hparam_manual_override";
  sourceProjectName = sessionStorage["selectedProject"] != "null" ? sessionStorage["selectedProject"] : sessionStorage["newProject"]
  hParamSessionObject = null;

  constructor(authScriptObject, setPreviewForExpression) {
    this.authScriptObject = authScriptObject;
    this.setPreviewForExpression = setPreviewForExpression;
    this.elementUtil = new ElementUtil();
    this.extractorExpEvaluator = new ExtractorExpEvaluator(authScriptObject);
    this.getHParamFromSessionStorage();
  }

  /**
   * Initializes the hParam list from session storage if not present else fetches values.
   */
  getHParamFromSessionStorage(){
    if(sessionStorage[this.HPARAM_SESSION_OBJECT_NAME + "_" + this.sourceProjectName] == undefined){
      sessionStorage[this.HPARAM_SESSION_OBJECT_NAME + "_" + this.sourceProjectName] = JSON.stringify({});
    }
    this.hParamSessionObject = JSON.parse(sessionStorage[this.HPARAM_SESSION_OBJECT_NAME + "_" + this.sourceProjectName]);
  }

  /**
   * Expression evaluator process starts here.
   * @param {*} expParams - List of extractor fields that will be evaluated during eval process.
   */
  evaluate = (expParams) => {

    this.expParamData = expParams;
    //Reset the Evaluator Before it Start
    this.extractorExpEvaluator.reset();
    this.expParamData.hParams.length > 0  && this.updateHParamValues();

    if (this.expParamData.hParams.length == 0) {
      try {
        this.extractorExpEvaluator.evaluate(this.expParamData.variables);
      } catch (e) {
        console.log("Exception occurred. Skipping the evaluation process :: ", e);
      }
      this.launchEvaluateModel("status");
    } else {
      this.launchEvaluateModel("hParam");
      this.handleContinueButton();
    }
  }

  /**
   * Updates HParam values from the auth object.
   */
  updateHParamValues(){
    
    if(this.hParamSessionObject["$hparams.@url"] == undefined){
      this.hParamSessionObject["$hparams.@url"] = this.authScriptObject.startUrl;
    }

    let hParamList = {};
    this.expParamData.hParams[0].forEach( hParam => {
      hParamList[hParam] = this.hParamSessionObject[hParam] != undefined ? this.hParamSessionObject[hParam] 
                            : this.authScriptObject.params && this.authScriptObject.params[hParam.substring(9)] != undefined ? this.authScriptObject.params[hParam.substring(9)] : "";
    })

    this.expParamData.hParams = hParamList;
    console.log(this.expParamData);
  }


  /**
   * HParam Editor or Status dialog box is launched.
   */
  launchEvaluateModel(origin) {

    let dialogRenderBodyCallback = () => { return this.dialogRenderBodyCallback(origin); }
    let buttonGroup = [];
    if (origin == "status") {
      buttonGroup = [{ name: "close", isAutoClose: true, callback: this.handleLogDialogClose.bind(this) }]
    } else {
      buttonGroup = [{ name: "Continue", isAutoClose: true, callback: this.reStartEvalProcess.bind(this) },
      { name: "Cancel", isAutoClose: true, callback: this.handleLogDialogClose.bind(this) }]
    }

    this.dialogReference = new ShowErrDialog({
      okButtonText: "",
      errorText: "",
      warningText: " ",
      renderHtmlCallBack: dialogRenderBodyCallback,
      registerButtonGroupObject: buttonGroup
    });

    this.dialogReference.confirm();
  }


  /**
  * Clears the statusLogSubscriber reference if created.
  */
  handleLogDialogClose() {
    this.statusLogSubscriber && clearInterval(this.statusLogSubscriber);
  }


  /**
   * Once HParams entered, evaluate cycle is restarted.
   */
  reStartEvalProcess() {
    try {
      this.updateHParamToEvaluator();
      this.extractorExpEvaluator.evaluate(this.expParamData.variables);
    } catch (e) {
      console.log("Exception occurred. Skipping the evaluation process :: ", e)
    }
    this.launchEvaluateModel("status");
  }

  /**
   * Updates the latest HParam value to session storage for tracking and retrieval.
   */
  updateHParamToEvaluator(){
    Object.keys(this.expParamData.hParams).forEach(hParam => {
      this.extractorExpEvaluator.add(hParam, this.expParamData.hParams[hParam]);
    });
    sessionStorage[this.HPARAM_SESSION_OBJECT_NAME + "_" + this.sourceProjectName] = JSON.stringify(this.hParamSessionObject);
  }


  /**
   * Sets the value of param to Auth object hParam variable.
   */
  onParamChange(key, event) {
    this.hParamSessionObject[key] = event.target.value;
    this.expParamData.hParams[key] = event.target.value;
    this.handleContinueButton();
  }


  /**
   * Disables continue button incase of empty HParam value.
   * Changes the title of the dialog box accordingly.
   */
  handleContinueButton() {

    Utils.disableEnableButton(document.getElementById("Continue"), false);
    document.getElementById("divFieldBrTg").innerText = "HParams - Update/Continue"

    Array.from(document.getElementsByClassName("HParamField")).forEach(ele => {
      if (ele.value.trim() == "") {
        document.getElementById("divFieldBrTg").innerText = "Fill HParams and Continue"
        Utils.disableEnableButton(document.getElementById("Continue"), true);
        return;
      }
    })

  }


  /**
   * Dynamically renders HParam editor or Status console.
   * @param {*} origin - "HParam" or "Status"
   * @returns - constructed dialog box
   */
  dialogRenderBodyCallback = (origin) => {

    var hParams = this.expParamData.hParams;
    let parentDialogEle = this.elementUtil.prepareParentElement(null, "evaluatorContainer", "");

    switch (origin) {
      case "hParam":
        return this.prepareHParamEditorContent(parentDialogEle, hParams);
      default:
        return this.prepareStatusViewer(parentDialogEle);
    }
  }


  /**
   * Prepares a status viewer dialog box.
   * @param {*} parentDialogEle 
   */
  prepareStatusViewer(parentDialogEle) {

    const headerLblStyle = "width: 100%; font-size:large; text-align: center; font-weight: 900;";
    const statusLogStyle = "font-weight: 100; font-size: small; padding : 2px 0px 0px 5px; max-height: 250px; overflow: overlay;";
    const errorLogStyle = "font-weight: 100; font-size: small; padding : 2px 0px 0px 5px; color: red";

    // Polling process for updating the status to dialog box. 
    this.statusLogSubscriber = setInterval(this.updateStatusLogs.bind(this), 200);

    this.elementUtil.createLabelWithElement(parentDialogEle, { id: "divTitle", style: headerLblStyle }, "Evaluating Expression <br>")
    this.elementUtil.createLabelWithElement(parentDialogEle, { id: 'statusContainer', style: statusLogStyle }, "Evaluating...");
    this.elementUtil.createLabelWithElement(parentDialogEle, { id: 'errorContainer', style: errorLogStyle }, "");
    return parentDialogEle;
  }


  /**
   * Prepares a HParam editor console.
   * @param {*} parentDialogEle 
   * @param {*} hParams 
   */
  prepareHParamEditorContent(parentDialogEle, hParams) {

    const headerLblStyle = "width: 100%; font-size:large; text-align: center; font-weight: 900;";
    const lblStyleInline = "font-size: small; width: 130px;  font-weight: 550; padding : 10px 10px 5px 0; word-wrap: break-word;";
    const eleStyleInline = "border-radius: 6px; padding-left: 7px; border-color: rgb(0 0 0 / 25%); display:inline; width: 230px;  font-weight: 400; margin-left:7px ; margin-top:15px; margin-right: 30px";

    this.elementUtil.createLabelWithElement(parentDialogEle, { id: "divFieldBrTg", style: headerLblStyle }, "HParams - Update/Continue");

    for (var i = 0; i < Object.keys(hParams).length; i++) {
      this.elementUtil.createLabelWithElement(parentDialogEle, { id: 'lblField', style: lblStyleInline }, Object.keys(hParams)[i]);
      this.elementUtil.createInputWithElement(parentDialogEle, { class: "HParamField", id: "divHParamField", style: eleStyleInline }, hParams[Object.keys(hParams)[i]], this.onParamChange.bind(this, Object.keys(hParams)[i]), "keyup");
    }
    return parentDialogEle;
  }


  /**
   * Updates the status console dialog box with the progress message.
   */
  updateStatusLogs() {

    let logMessage = this.extractorExpEvaluator.getCurrentStatus();

    document.getElementById("divTitle").innerHTML = logMessage.isError ? ("Error at Extractor Field - <span style='color:red'>" + logMessage.currentNode + "</span>") : logMessage.currentNode + " - " + logMessage.operation;
    
    if(logMessage.isError){
      document.getElementById("statusContainer").innerText = logMessage.console.slice(0, -2).join('\n');
      document.getElementById("errorContainer").innerText = logMessage.console.slice(1).slice(-2).join('\n');
    } else {
      document.getElementById("statusContainer").innerText = logMessage.console.join('\n');
    }

    if (logMessage.isError || logMessage.isCompleted) {
      clearInterval(this.statusLogSubscriber);
    } if (logMessage.isCompleted && !logMessage.isError) {
      this.setPreviewForExpression(logMessage);
      this.dialogReference.destroy();
    }
  }

}