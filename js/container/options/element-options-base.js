import ShowErrDialog from '../../component/showError-dialog.js'

export default class ElementOptionsBase {
    constructor(parentElement) {
        this.parentElement= parentElement;        
        this.showOrHideOptinalFields(true);
    }

    renderOptions() {
        // abstract method
    }
    
    showOrHideOptinalFields(isVisible) {
        this.setVisibility('divLblSelectorType', isVisible);
        this.setVisibility('divEleSelectorType', isVisible);        
        this.setVisibility('divLblSelector', isVisible);
        this.setVisibility('divEleSelector', isVisible);
        this.setVisibility('divIconSelector', isVisible);        
        this.setVisibility('divLblPreview', isVisible);
        this.setVisibility('divElePreview', isVisible);
        this.setVisibility('divLblCount', isVisible);
        this.setVisibility('divIconShowMore', isVisible);

    }

    setVisibility( elementId, isVisible){
        let elementNode = document.getElementById(elementId);
        if( elementNode){
            isVisible ? elementNode.style.display = 'inline-block' : elementNode.style.display = 'none';
        }
    }
    
    mountContainerToParent(ele) {        
        this.parentElement ? document.getElementById(this.parentElement).appendChild(ele) : this.mountedComponent = ele;
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

    onSaveChanges() {
        
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
        this.setAttributes(r,row.attr);
        row.col.forEach((col, i) => {
            let c= this.createColumn(col);
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

     createAccordion(parentId, attr, innerHTML, itemContainerId, isClosed) {

        var acc = document.createElement("div");
        this.setAttributes(acc, attr);
        acc.classList.add("accordion");

        var title = document.createElement("div");
        title.id = "accordion-title";

        var collapse = document.createElement("img");
        collapse.setAttribute("style", "padding: 0 0 3px 2px;")
        isClosed ? collapse.src = "../../images/expand.png" : collapse.src = "../../images/collapse.png";
        collapse.id = 'toggle_off';
        title.append(collapse);
        title.innerHTML += (" " + innerHTML);
        acc.appendChild(title);

        var panel = document.createElement("div");
        panel.classList.add("accordion-panel")
        panel.classList.add("grid-container");
        panel.setAttribute("id", itemContainerId);
        isClosed && (panel.style.maxHeight = "0px");
        acc.appendChild(panel);

        title.addEventListener("click", function() {
            var panel = document.getElementById(itemContainerId);
            let icon = '';
            if (panel.style.maxHeight != "0px") {
                icon = title.getElementsByTagName("img")[0];
                icon.src = "../../images/expand.png";
                icon.id = 'toggle_on';
                panel.style.maxHeight = "0px";
            } else {
                icon = title.getElementsByTagName("img")[0];
                icon.src = "../../images/collapse.png";
                icon.id = 'toggle_off';
                panel.style.maxHeight = panel.scrollHeight + "px";
            } 
        });    

        document.getElementById(parentId).appendChild(acc);
     }

     createButton(parentId, attr, innerHtml, events) {
        let btn = document.createElement('button');
        this.setAttributes(btn, attr);
        this.registerEvents(btn, events);
        btn.innerHTML = innerHtml;
        document.getElementById(parentId).appendChild(btn);
        return btn;
    }

    showDialogBox(content){

        let dialogBox = new ShowErrDialog({
             okButtonText: "OK",
             errorText: " ",
             warningText: " ",
             renderHtmlCallBack : () =>{
                let divBlock = document.createElement("pre");
                divBlock.innerHTML = JSON.stringify(content, undefined, 4);
                return divBlock;
        }
           } , (() => { return false }));
       
           dialogBox.confirm();
     }

}