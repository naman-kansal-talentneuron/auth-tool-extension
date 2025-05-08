import ShowErrDialog from '../../component/showError-dialog.js'

export default class BaseEditor {

    AUTH_SESSION_OBJECT_NAME = "authScriptObject";

    constructor(parentElement, navTreeUpdateCallBack, emptyCheckvalidateFields) {
        this.parentElement = parentElement;
        this.navTreeUpdateCallBack = navTreeUpdateCallBack;
        this.mountedContainer;
        this.isDirty = false;
        this.isBroken = false;
        this.emptyCheckvalidateFields = emptyCheckvalidateFields;
    }

    // Populate editor based on Node input object
    // If input Object is empty, then render editor as basic element mode
    // This will be called by external components like Navigation tree
    populateEditor() {
        //asbtract method
    }

    // Returns current state of Node Object 
    onSaveClick() {

    }

    onNodeIDChange(event) {
        this.navTreeUpdateCallBack && this.navTreeUpdateCallBack();
    }

    mountContainerToParent(ele) {

        document.getElementById(this.parentElement).innerHTML = "";
        document.getElementById(this.parentElement).appendChild(ele);

    }

    setAttributes(el, arrAttrs) {
        if (el != null && el != 'undefined') {
            for (var key in arrAttrs) {
                el.setAttribute(key, arrAttrs[key]);
            }
        }
    }

    registerEvents(el, arrEvents) {
        for (var key in arrEvents) {
            el.addEventListener(key, arrEvents[key]);
        }
    }

    getUHAuthObjectFromStorage() {

        let sourceProjectName = sessionStorage["selectedProject"] != "null" ? sessionStorage["selectedProject"] : sessionStorage["newProject"]

        //Load AuthScriptObject From Local Storage
        return JSON.parse(window.localStorage.getItem(this.AUTH_SESSION_OBJECT_NAME + "-" + sourceProjectName));

    }

    hasValidValues(fieldData) {

        let isValid = true;

        if ( !this.emptyCheckvalidateFields && !fieldData) {
            return false;
        }

        this.emptyCheckvalidateFields.forEach(fieldName => {
            if (!fieldData[fieldName] || !fieldData[fieldName].trim().length) {
                isValid = false;
            }
        });

        return isValid;
    }

    showDialogMessage(error, warning) {

        const dialogBox = new ShowErrDialog({
            okButtonText: "OK",
            errorText: error && error.trim().length ? error : " ",
            warningText: warning && warning.trim().length ? warning : " "
        }, () => { });
        dialogBox.confirm();
    }

    createTable(tblObj) {
        let divMain = document.createElement("div");
        this.setAttributes(divMain, tblObj.attr);

        tblObj.rows.forEach((row, i) => {
            let r = this.createRow(row);
            divMain.appendChild(r);
        });
        return divMain;

    }

    createRow(row) {
        let r = document.createElement('div');
        this.setAttributes(r, row.attr);
        row.col.forEach((col, i) => {
            let c = this.createColumn(col);
            r.appendChild(c);
        });
        return r;

    }

    createColumn(col) {
        let c = document.createElement("div");
        this.setAttributes(c, col.attr);
        col.divs.forEach((div, i) => {
            let d = this.createDiv(div);
            c.appendChild(d);
        });
        return c;
    }

    createDiv(div) {
        let d = document.createElement('div');
        this.setAttributes(d, div.attr);
        return d;

    }

    createLabel(parentId, attr, innerHTML) {
        let lbl = document.createElement('label');
        this.setAttributes(lbl, attr);
        lbl.innerHTML = innerHTML;
        document.getElementById(parentId).appendChild(lbl);
        return lbl;
    }

    createButton(parentId, attr, innerHtml, events) {
        let btn = document.createElement('button');
        this.setAttributes(btn, attr);
        this.registerEvents(btn, events);
        btn.innerHTML = innerHtml;
        document.getElementById(parentId).appendChild(btn);

    }

    createIcon(parentId, attr, src, events) {
        let icon = document.createElement('img');
        icon.src = src
        this.setAttributes(icon, attr);
        this.registerEvents(icon, events);
        document.getElementById(parentId).appendChild(icon);
    }

    createImage(parentId, id, imageStyle, src, alt) {
        let image = document.createElement('img');

        image.setAttribute("id", id);
        image.setAttribute("src", src);
        image.setAttribute("alt", alt);
        image.setAttribute("style", imageStyle);

        document.getElementById(parentId).appendChild(image);

    }



    showAutoSaved() {
        document.getElementById("sp_dirtyflag").style.display = 'block';
    }

    resetFormIsDirty(lstComponents) {

        //   this.isDirty = false;

        //this.hideAutosaved() ;

        // for (var key in lstComponents) {            
        //     if(lstComponents[key].isDirty) {
        //         lstComponents[key].resetDirtyFlag();
        //     }      
        //     //else continue  

        // }

    }

    hideAutosaved() {

        setTimeout(function () {
            document.getElementById("sp_dirtyflag").style.display = 'none';
        }, 1000);

    }


    isFormDirty() {
        // if form already dirty
        // this.highlightFormIsDirty();            
        //    this.isDirty = false;
        //     if(this.isDirty)  {
        //         return;
        //     }
        //     lstComponents = {...lstComponents}
        //     // if atleast one is dirty
        //      for (var key in lstComponents) {            
        //          if(lstComponents[key].isDirty) {
        //              //console.log("Form is dirty");
        //              this.isDirty = true;    
        //              this.highlightFormIsDirty();            
        //              return;
        //          }      
        //          //else continue  

        //      }
        //      //if nothing is dirty
        //      this.isDirty = false;


    }

}