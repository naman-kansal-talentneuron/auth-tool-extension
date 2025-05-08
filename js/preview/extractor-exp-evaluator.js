import MetaData from "../config/meta-data.js"
import SelectorEvaluator from "./evaluate-selector.js";
import Utils from "../utils.js"

var VARIABLE_REGEX_PATTERN = /\$\[.*?\]/g;
var PYTHON_REGEX_PATTERN = /\#\[.*?\]/g;

/**
 * Extractor Expression Evaluator
 */
export default class ExtractorExpEvaluator {

  extractorVariables = {};
  currentNode = null;
  extractorNodes = null;
  authScriptObject = null;
  _logMessage = { currentNode: "", operation: "", console: [], isError: false, isCompleted: false };

  constructor(authScriptObject) {
    this.authScriptObject = authScriptObject;
  }

  _setCompletionStatus(isCompleted, isError) {
    this._logMessage.isCompleted = isCompleted;
    this._logMessage.isError = isError;

    this._addProgressLogger(isError ? "Completed with Error" : "Completed with Success");
  }

  _addProgressLogger(message) {

    console.log(message);
    this._logMessage.console.push(message);
  }

  // Add Extractor Value
  add = (vName, pvalue) => {
    pvalue = this._getTextValueAsArray(pvalue);
    this.extractorVariables[vName] = pvalue;
  }

  //Remove the Variable
  _remove = (vName) => {
    delete this.extractorVariables[vName];
  }

  //Get the Variable
  get = (vName) => {

    let pvalue = this.extractorVariables[vName];
    if (Array.isArray(pvalue)) {
      return pvalue[0];
    }

    return pvalue;
  }

  //Get All Variables
  getAll = () => {
    return this.extractorVariables;
  }

  _getExpressionWithVariableAssignment(field) {

    //Expression
    let expProcessed = field.fieldValue;

    //Evalaute Variables to Field Value
    let matchVariables = expProcessed.match(VARIABLE_REGEX_PATTERN);

    if (matchVariables) {
      for (let evariable of matchVariables) {

        let extractorVName = '$' + evariable.substring(3, evariable.length - 2);
        let extractorVValue = this.get(extractorVName);

        if (!extractorVValue) {
          let errorMsg = `Failed - Field : ${field.fieldName} Expression Has InValid Variable : ${extractorVName} in Expression - ${expProcessed}`;
          this._addProgressLogger(errorMsg);
          this._setCompletionStatus(true, true);
          throw errorMsg;
        }
        //Escape Single quotes present in Value
        expProcessed = expProcessed.replaceAll(evariable, "'" + extractorVValue.replace(/'/g, "\\\'") + "'");
      }
    }

    return expProcessed;
  }

  /**
   * Evaluate Expression for Field
   * @param {Field Data} field  
   * @param {Custom Script for Execution} customScript 
   */
  _evaluateExp = (field, customScript) => {

    this._addProgressLogger('Evaluate Expression ' + field.fieldName);

    //Expression with Variable Values
    let expProcessed = this._getExpressionWithVariableAssignment(field);

    //Evalaute Expression in Backend
    this._addProgressLogger('Evaluate Expression -:' + field.fieldName + ' - Expression : ' + expProcessed);
    // If expression is empty (null), exit the flow and update progress
    if(field.fieldValue == ""){
      let that= this;
      setTimeout( () => {
        that._addProgressLogger("Expression is Empty. Required valid expression to evaluate ");
        that._setCompletionStatus(true,true);
      }, 1000);
      
      return;
    }
    // If expression is empty string (""), will not be sent to pyserver for evaluation.
    if(Utils.escapeDoubleQuotes(field.fieldValue) == "''" ){
      this.selectorOnValidator(field.fieldName, field.fieldValue);
      return;
    }

    ExperssionUtil.evaluate(expProcessed, this.authScriptObject.source, this.authScriptObject.customScript).then(
      response => {
        this._addProgressLogger('Completed Evaluate Expression -:' + field.fieldName + ' - Response : ' + response);
        this.selectorOnValidator(field.fieldName, response);
      },
      err => {
        this._addProgressLogger(`Failed Evaluate Expression for : [${field.fieldName}] with Error Message  : [${err}]`);
        this._setCompletionStatus(true, true);
      }
    );
  }


  selectorOnValidator = (name, value, isError) => {

    this._addProgressLogger(`Selector : ${name} with Response : ${value}`);

    if (isError) {
      this._setCompletionStatus(true, true);
      return;
    }

    //Add entry only for current node
    if (this.currentNode != null && this.currentNode === name) {
      this.add(name, value);
      this.currentNode = null;
      this.evaluate(this.extractorNodes);
    }
  }

  //Reset the Selector
  reset = () => {

    this._logMessage = { currentNode: "", operation: "", console: [], isError: false, isCompleted: false };
    this.extractorVariables = {};
    this.currentNode = null;
    this.extractorNodes = null;
  }


  getCurrentStatus() {

    if (!this._logMessage.isError && this._logMessage.isCompleted) {
      this._logMessage.response = this.extractorVariables[this.currentNode];
    }

    return this._logMessage;
  }

  
  evaluate = (lstExtractorFields) => {

    let isCompleted = true;
    this.extractorNodes = lstExtractorFields;

    this._addProgressLogger("       ----------- Evaluate -----------        ");

    for (let field of lstExtractorFields) {

      let extractorVValue = this.get(field.fieldName);
      this.currentNode = field.fieldName;
      if (extractorVValue || extractorVValue == "") {
        //this._addProgressLogger('Node Value Exists For ' + field.fieldName + " with selector : " + field.fieldValue + " and value : " + extractorVValue);
        continue;
      }

      isCompleted = false;
      this._logMessage.currentNode = field.fieldName;
      this._addProgressLogger('Start Evaluate : ' + field.fieldName);

      //Expression XPATH
      if (field.fieldMode === "expn.xpath") {
        this._logMessage.operation = "Evaluating  EXPN XPATH";
        let expProcessed = this._getExpressionWithVariableAssignment(field);
        this._addProgressLogger('Evaluate Exp Xpath Selector ' + field.fieldName + " - " + expProcessed);
        SelectorEvaluator.evaluate(expProcessed, field.fieldMode, field.fieldName, field.noOfRecord, this.selectorOnValidator.bind(this));
        break;
      }

      //Expression
      if (field.fieldMode === "expn") {
        this._logMessage.operation = "Evaluating  Expression";
        this._evaluateExp(field);
        break;
      }

      //Other Selector Types
      //Annotate and Get the Selector Values
      this._logMessage.operation = "Evaluating Selector Value";
      this._addProgressLogger('Evaluate Selector ' + field.fieldName + " - " + field.fieldValue);
      SelectorEvaluator.evaluate(field.fieldValue, field.fieldMode, field.fieldName, field.noOfRecord, this.selectorOnValidator.bind(this));
      break;
    }

    //Exit if completed
    if (isCompleted) {
      this._addProgressLogger("-----------  Expression Evaluate completed for Node  ----------------");
      this._setCompletionStatus(true, false);
    } else {
      this._addProgressLogger("************* Waiting ************");
    }
  }

  /**
   * Escape the Text content with Line Break and return as content as Line Array
   * @param {*} textcontent 
   * @returns 
   */
  _getTextValueAsArray = (textcontent) => {
    var lines = [];

    let decodeHtml = (html) => {
      var txt = document.createElement("textarea");
      txt.innerHTML = html;
      return txt.value;
    }

    textcontent.split(/\n/).forEach((line) => {
      if (line) {
        line = decodeHtml(line).replace(/^\s+|\s+$/g, '');
        lines.push(line);
      }
    });
    return lines.join('');
  }
}

//Private Class to Evaluate the Expression in Python Evaluate Server
class ExperssionUtil {
  static evaluate = (experssionData, sourceName, customScript) => {
    return new Promise(function (resolve, reject) {
      $.ajax({
        type: "POST",
        async: false,
        url: MetaData.getPythonEvaluatorUrl(true) + "evaluate_exp",
        data: JSON.stringify({
          customScript: customScript,
          expression: experssionData,
          sourceName: sourceName
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: (data) => {
          if (data && !data.isError) {
            resolve(JSON.stringify(data.message));
          }
          else {
            reject("Error while Evaluating with - " + data.message);
          }
        },
        error: (error) => {
          reject("N/W Error while Evaluating - " + error);
        },
      });
    });
  }
}