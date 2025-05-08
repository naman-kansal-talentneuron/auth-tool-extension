import TextArea from "../../component/text-area.js";
import BaseEditor from "./base-editor.js";

export default class BlankEditor extends BaseEditor {
    #components = {
        txtParams : null
    }

    constructor(parentElement, onExportCallBack, onValidateCallBack, onDebugCallBack) {
        super(parentElement);
        this.onExportCallBack = onExportCallBack;
        this.onValidateCallBack = onValidateCallBack;
        this.onDebugCallBack = onDebugCallBack;
        this.populateEditor();        
    }
    populateEditor() {
       
        this.createContainerDivs();
        this.createComponents();
    }

    onExportClick(event) {
        this.onExportCallBack(event, this);
    }

    
    onValidateClick(event){
        this.onValidateCallBack && this.onValidateCallBack(event, this);
    }

    onDebugClick() {
        this.onDebugCallBack();
    }
    
    createComponents() {
       
        const btnStyle = "margin-left:20px";
        this.createButton( 'divIconSave',  {style: btnStyle, id:'btnExport'},'Export', {"click": this.onExportClick.bind(this)});
        this.createButton('divIconValidate', { style: btnStyle, id: 'btnValidate' }, 'Validate', { "click": this.onValidateClick.bind(this) }),
        this.createButton('divDebug', {style: btnStyle, id:'btnDebug'},'Debug', {"click": this.onDebugClick.bind(this)});
        
    }

    createContainerDivs() {

        const tblStyle = "height:100%";
        const classRow = "margin-top:20px";
        const classCol = "display: inline-block;";
        const classColEle = "display: inline-block;";
        const exportIcon =  "display: inline-block;margin-left:25px";
        
        let tblObj = {
            attr: { style: tblStyle },
            id: "tblEditorMain",
            rows: [
                {
                    attr: { style: classRow },
                    col: [
                        {
                            attr: { style: classCol }, divs: [
                            { attr: { style: exportIcon, id: "divIconSave" } },
                            { attr: { style: classColEle, id: "divIconValidate" } },
                            { attr: { style: classColEle, id: "divDebug" } }]
                        }
                    ]
                }]
        }

        let divMain = this.createTable(tblObj);

        this.mountContainerToParent(divMain);
    }
    

}