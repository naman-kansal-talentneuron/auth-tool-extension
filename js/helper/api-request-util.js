export default class APIRequestUtil {

    constructor() {}

    /**
     * Makes an XMLHttpRequest call (GET or POST) to specified API.
     * Custom Cookies and Headers can be added to the outgoing api call.
     */

    fetch(httpMethod, url, responseType, metadata, body, isJson){ // IF JSON, CONVERT TO PARAM ELSE ATTACH AS STRING FOR BOTH GET AND POST

        const promise = new Promise((resolve, reject) => {

            const request = new XMLHttpRequest();

            let isNonEmptyBody = isJson ? body && (body != JSON.stringify({})) : body.trim() != "" ;
            body = isJson && isNonEmptyBody ? JSON.parse(body) : body;

            if(httpMethod === 'get' && isNonEmptyBody) {
                url = this._prepareParams(url, body, isJson);
            }

            request.open(httpMethod, url);

            request.responseType = responseType;
            request.withCredentials = true;

            this._prepareMetaData(url, metadata, request);

            request.onload = () => {
                (request.status >= 200 && request.status < 300) ? resolve(request.response) : reject(request);
            }
            // Only called upon failure to make network call
            request.onerror = (e) => reject('API URL not found', e); 

            if(httpMethod === 'post' && isNonEmptyBody) {
                request.setRequestHeader("Content-Type", "application/json");
                body = isJson ? JSON.stringify(body) : body
                request.send(body);
            } else {
                request.send();
            }    
        });

        return promise;
    }


    // Converts JSON type body into query parameters for GET request. 
    _prepareParams(url, body, isJson){

        let updatedUrl = (url.includes('?')) ? url : (url + "?");

        if(isJson){
            let objectSize = Object.keys(body).length;
    
            for(const [index, key] of Object.keys(body).entries()) {
                updatedUrl = updatedUrl + key + "=" + body[key];
                if( (index+1) < objectSize ) {
                    updatedUrl = updatedUrl + "&"
                }
            }
        } else {
            updatedUrl = updatedUrl.concat(body);
        }

        return updatedUrl;
    }

    _prepareMetaData(url, metadata, request){

        if(metadata != null){
            if(metadata['cookies'] != {}) {
                this._setCookies(url, metadata);
            }
            if(metadata['headers'] != {}) {
                this._setHeaders(request, metadata);
            }
        }
    }


    // Below method adds custom cookies to the outgoing request.

    _setCookies(url, metadata) { 

        let domain = new URL(url);
        let domainUrl = domain.protocol.concat("//").concat(domain.hostname);
        // Existing cookie with same name will be replaced. (But not the response cookie)
        for (var cookieName of Object.keys(metadata['cookies'])) {
            chrome.cookies.set({
                "name": cookieName,
                "url": domainUrl,
                "value": metadata['cookies'][cookieName]
            })
        }
    }

    _setHeaders(request, metadata) { 

        for(let header in metadata['headers']){
            request.setRequestHeader(header, metadata['headers'][header]);
        }
    }




  async postData(url = "", data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached   
      headers: {
        "Content-Type": "application/json"   
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });  
    
    if (response.ok) {
        return response.json(); 
     
    }else
    {
       console.log(response);
       throw error;
    }    
  }

 
}