
var debugUtilListenerData = {};
var isdebugListenerSubscribed = false;

/**
 * Subscriber event listener link to listen from debug util
 */
var subscribeDebugUtilListener = () => {
  if (!isdebugListenerSubscribed) {
    window.addEventListener('message', function (event) {

      if (event.data && DebugUtilConnector.isValidMessage(event.data) && event.data.isping) {
        let requestid = event.data.requestid;
        debugUtilListenerData[requestid].iscompleted = true;
        console.log("Handshake reply msg recieved from debugutil for request ID - " + requestid);
        event.source.postMessage(DebugUtilConnector.getHandShakeData(requestid), event.origin);
      }else {
        console.log("Invalid request Received-" + event.data)
      }
      return;
    });
  }
  isdebugListenerSubscribed = true;
};

subscribeDebugUtilListener();

/**
 * Establish Publisher model for Debug Util to handshake.
 * This Util will post message to DebugUtil until handshake
 */
export default class DebugUtilConnector {

  // Add Request to Queue and establish handshake
  static push = (windowid, requestid, data) => {
    console.log("Adding Listener for " + requestid)
    debugUtilListenerData[requestid] = { data: data, counter: 0, iscompleted: false };
    this._establishHandshake(windowid, requestid);
  }

  //Check for Valid Request
  static isValidMessage(message) {
    if (message && message.tool && message.tool === 'authtool') {
      return message.requestid && debugUtilListenerData[message.requestid] != null ? true : false;
    }
  }

  //Final Handshake Data for DebugUtil
  static getHandShakeData(id) {
    return { requestid: id, tool: 'authtool', isdata: true, data: debugUtilListenerData[id].data }
  }

  //Ping Data for HandShake
  static _getPingData(id) {
    return { requestid: id, tool: 'authtool', isping: true }
  }

  //Get Data based on RequestID
  static _getRequestData(id) {
    return id && debugUtilListenerData[id] != null ? debugUtilListenerData[id] : null;
  }

  //Clear Data once connection established
  static _removeData(id) {

    if (id && debugUtilListenerData[id] != null) {
      delete debugUtilListenerData[id];
    }
  }

  //Establish HandShake to Debug Util
  static _establishHandshake(windowid, requestid) {

    let data = this._getRequestData(requestid);
    if (data && data.iscompleted) {
      //Clear the data and exist if required
      this._removeData( requestid);
      console.log(`Handshake Completed for - ${requestid}`);
    } else if (data && data.counter > -1 && data.counter < 50) {

      setTimeout(() => {
        console.log(`Retring handshake for request - ${requestid} and it counter - ${data.counter}`);
        data.counter = data.counter + 1;
        windowid.postMessage(this._getPingData(requestid), "*");
        this._establishHandshake(windowid, requestid);
      }, 2000);

    } else {
      console.log(`Handshake timeout for requestid - ${requestid}`);
    }
  }
}

