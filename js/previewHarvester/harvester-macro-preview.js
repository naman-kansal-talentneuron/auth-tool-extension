import MetaData from "../config/meta-data.js";

/**
 * Harvester Macro Value Substitution Preview
 */
export default class HarvesterMacroPreview {

    _category = null;
    _currentNodeName = null;
    _prepareDocChildMissionData = null;
    _isPrepareEvaluation = false;
    _currentStatus = { inProgress: false, isError: false, isPrepareInProgress: false, isCompleted: false, console:[], isRequestCancelled: false  };

    constructor(harvesterScriptObj, category, nodeName, onEvaluationCallback, proxyData) {

        //Initial Harvester API
        this.harvesterPreviewAPI = new HarvesterPreviewAPI(this._setProgressStatus.bind(this));
        this.onEvaluationCallback = onEvaluationCallback;
        this._category = category;
        this._currentNodeName = nodeName;

        this._harvesterScriptObj = JSON.parse(JSON.stringify(harvesterScriptObj)); 
        if(proxyData != "undefined" && proxyData != null){
        this._harvesterScriptObj.proxy = proxyData; 
        }

        //Set this value to fetch the child mission param value from prepare
        //To evaluate Prepare and then Payload
        this._prepareDocChildMissionNodeName = this._getPrepareChildMissionNodeName();
        this._isPrepareEvaluation = this._prepareDocChildMissionNodeName ? true : false;
    }

    /**
     * Evaluate the Prepare or Payload or [Prepare & Payload]
    **/
    evaluate() {

        this._currentStatus.inProgress = true;

        let tempHarvesterScript = JSON.parse(JSON.stringify(this._harvesterScriptObj, null, 4));

        //Condition check for [Prepare & Payload] execution. First execute the prepare
        if (this._isPrepareEvaluation) {
            console.log("Start prepare evaluation as first step");
            this._currentStatus.console.push("Started Prepare evaluation");
            tempHarvesterScript.payload = null;
            this._currentStatus.isPrepareInProgress = true;
        }
        //Condition 2 : Only Prepare 
        else if (this._category === "prepare") {
            console.log("Start prepare evaluation");
            this._currentStatus.console.push("Started Prepare evaluation");
            tempHarvesterScript.payload = null;
            tempHarvesterScript.prepare = this._filterHarvesterObj(tempHarvesterScript.prepare, this._currentNodeName);
        }
        //Condition 3 : Payload or [Prepare & payload as 2nd]
        else {
            console.log("Start Payload evaluation");
            this._currentStatus.console.push("Started Payload evaluation");
            tempHarvesterScript.prepare = null;
            tempHarvesterScript.payload = this._filterHarvesterObj(tempHarvesterScript.payload, this._currentNodeName);
        }

        this.harvesterPreviewAPI.evaluate(JSON.stringify(tempHarvesterScript, null, 4));
    }

    checkStatus() {
        return this._currentStatus;
    }

    getPreviewData(nodeName) {
        return this.harvesterPreviewAPI.getPreviewData(nodeName);
    }
    

    _setProgressStatus(isError, isCompleted, response) {

        if (isError) {
            this._currentStatus.isError = true;
            console.log("Evaluation Failed");
            this._currentStatus.console.push("Evaluation Failed");
            this.onEvaluationCallback(response, true);
            return;
        }

        if (this._isPrepareEvaluation && isCompleted) {
            this.onEvaluationCallback(response);
            console.log("Prepare Evaluation is Done");
            this._currentStatus.console.push("Prepare Evaluation completed successfully");
            this._currentStatus.isPrepareInProgress = false;
            this._isPrepareEvaluation = false;
            console.log("Trigger Payload Evaluation");
            let childMissionParamData = this.harvesterPreviewAPI.getPreviewData(response, this._prepareDocChildMissionNodeName);
            this._injectPrepareParamValueIntoPayload(childMissionParamData);

            //Check for [Prepare & Payload Type]. If prepare is done then proceed for payload execution in prepare success
            this.evaluate();
            return;
        }
        else {
            this._currentStatus.inProgress = !isCompleted;
            this._currentStatus.isCompleted = isCompleted;
            console.log("Evaluation Completed");
            this._currentStatus.isCompleted && this.onEvaluationCallback(response);
           
        }
    }

    //Set the Param value from Prepare Response
    _injectPrepareParamValueIntoPayload(childMissionData) {

        console.log("Set the Prepare new child mission param to payload execution with " + childMissionData.result);
        this._currentStatus.console.push("Set the Prepare new child mission param to payload execution with " + JSON.stringify(childMissionData.result));
        if (this._harvesterScriptObj.params && childMissionData.result) {
            this._harvesterScriptObj.params = { ...this._harvesterScriptObj.params, ...childMissionData.result };
        } else if (childMissionData.result) {
            this._harvesterScriptObj.params = childMissionData.result;
        }
    }

    //Filter the Payload based on selected node
    _filterHarvesterObj(harvesterScriptObj, nodeName) {

        if (!nodeName) {
            return harvesterScriptObj;
        }

        let filterNodes = [];
        let isNodeReached = false;

        harvesterScriptObj.forEach(node => {
            if (!isNodeReached) {

                filterNodes.push(node);
                isNodeReached = node.id === nodeName ? true : false;
            }
        });

        return filterNodes;
    }

    //Get the Prepare NewChildMission Node Name for Param retrival
    _getPrepareChildMissionNodeName() {

        //Check for category is payload and it contains the prepare statement. IF no then return
        if (!this._category === "payload" || !this._harvesterScriptObj.prepare) {
            return null;
        }

        let isNodeReached = false;
        let childMissionNodeName = null;
        this._harvesterScriptObj.prepare.forEach(node => {
            if (!isNodeReached && node.documentType === "new-child-mission") {
                isNodeReached = true;
                childMissionNodeName = node.id;
                return true;
            }
        });

        return childMissionNodeName;
    }   
}

/**
 * API Layer to evaluate the Harvester Payload in Server side
 */
export class HarvesterPreviewAPI {

    _currentStatus = { inProgress: false, isError: false, isCompleted: false};

    constructor(progressStatusCallBack) {
        console.log('API Initialization Preview')
        //Set Debug Util URL
        let utilURLs = MetaData.getDebuggerEnvUrl().filter(url => url.name === "QA");
        if (!utilURLs || utilURLs.length == 0) {
            throw "Failed to fetch Debug Util URL";
        }
        this._debugUtilURL = utilURLs[0].value;

        this._setProgressStatusCallBack = progressStatusCallBack;
    }

    reset() {
        this._currentStatus = { inProgress: false, isError: false, isCompleted: false };
        this._debugUtilStatus = null;
        this._debugUtilResponse = null;
        this._errorResponse = null;
    }

    evaluate(harvesterScriptReqStr) {

        if (this._currentStatus.inProgress) {
            //TODO : throw 'Currently in Progress'
            return;
        }

        if (!harvesterScriptReqStr) {
            //TODO : Invalid script'
            return;
        }

        //reset the reference data before process
        this.reset();

        this._submitRequest(harvesterScriptReqStr);
    }

    checkStatus() {
        return this._currentStatus;
    }


    getPreviewData(response, nodeName) {

        if (!this._currentStatus.inProgress && this._currentStatus.isCompleted
            && response[nodeName]) {
            return response[nodeName];
        }
        return "";
    }

    getErrorResponse(){
        return this._errorResponse;
    }

    _setProgressStatus(isError, isCompleted, response) {

        this._currentStatus = { inProgress: !isCompleted, isError: isError, isCompleted: isCompleted };

        //Update the progress callback to caller
        this._setProgressStatusCallBack && this._setProgressStatusCallBack(isError, isCompleted, response);
    }

    _getStatus() {

        let that = this;
        if (!this._currentStatus.inProgress) {
            console.log("Check Status - API Evaluate Stopped already...")
            return;
        }

        if (!this._debugUtilStatus || !this._debugUtilStatus.pid) {
            return null;
            //TODO to handle this condition
        }

        let onSuccess = (data, e, xhr) => {

            if (xhr.status === 200) {
                that._setProgressStatus(false, true, data);
                console.log('Check Status - API Evaluate Completed')
            } else if (xhr.status === 202) {
                console.log('Check Status - Waiting Request Still In-Progress');
                setTimeout(() => { that._getStatus() }, 10 * 1000);
            }
        };

        let onError = (e, xhr) => {
            that._currentStatus.isError = true;
            that._currentStatus.inProgress = false;
            console.log(`Check Status - API Evaluate Failed with Error : ` + e);
            this._setProgressStatus(true, true, e);
        };

        $.ajax({
            type: "GET",
            url: this._debugUtilURL + "/harvester/preview/" + this._debugUtilStatus.pid,
            success: onSuccess,
            error: onError
        });
    }

    _submitRequest(harvesterScriptReqStr) {

        this._setProgressStatus(false, false);
        let that = this;
        let onSuccess = (data, e, xhr) => {
            console.log('API - Successfully Submitted Request')
            that._debugUtilStatus = data;
            that._getStatus();
        };

        let onError = (e, xhr) => {
            this._setProgressStatus(true, true, e);
            console.log(`API - Evaluate submission Failed with Error : ` + e);
            that._errorResponse = e;
        };

        $.ajax({
            type: "POST",
            url: this._debugUtilURL + "/harvester/preview",
            data: harvesterScriptReqStr,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: onSuccess,
            error: onError
        });
    }   


}


