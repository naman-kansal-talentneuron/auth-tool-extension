import Fields from "../../extract/Fields.js";
import BaseEditor from "./base-editor.js";
import TextBox from "../../component/text-box.js"
import Utils from '../../utils.js';

export default class ExtractorGroupEditor extends BaseEditor {

    #components = {
        txtExtractorGroupName: null
    }

    constructor(parentElement, fields, authobj, onSaveCallback, onExportCallBack, togglePointAndClickClick, onSelectorChangeCallback, onValidateCallBack, navTreeUpdateCallBack, onTraverseCallBack, onDebugCallBack) {
        super(parentElement, navTreeUpdateCallBack);
        this.fields = fields;
        this.onSaveCallback = onSaveCallback;
        this.onExportCallBack = onExportCallBack;
        this.onDebugCallBack = onDebugCallBack;
        this.onValidateCallBack = onValidateCallBack;
        this.parentElement = parentElement;
        this.onSelectorChangeCallback = onSelectorChangeCallback;
        this.togglePointAndClickClick = togglePointAndClickClick;
        this.onTraverseCallBack = onTraverseCallBack;
        this.authObj = authobj;
        this.fieldParentNode = fields.parent;
        fields.parent = null; // Clear parent value to null
        this.populateEditor();
        this.handleRearrangeButtons();
    }

    populateEditor() {

        if (this.validateInputNodeElement()) {
            this.fields = new Fields('', '', '');
        }

        this.createContainerDivs();
        this.createComponents();
        this.onChangeOfFormElements();

    }

    onTraverseClick(event){
        this.onTraverseCallBack(event.srcElement.innerHTML, this.fieldParentNode, this.fields.index, "ExtractorGroup");
    }

    validateInputNodeElement() {
        return this.fields == null
    }

    onExportClick(event) {
        this.onExportCallBack(event, this);
    }

    getExtractorParentsExtractorFields(){

        let extractorFields = [];

        if (this.fieldParentNode.isgroup && this.fieldParentNode.fields && this.fieldParentNode.fields.length) {
            extractorFields = this.fieldParentNode.fields;
        } else if ( this.fieldParentNode.document 
                    && this.fieldParentNode.document.document
                    && this.fieldParentNode.document.document.documentDetails) {
            //create or update extractor to Harvestor parent .
            extractorFields = this.fieldParentNode.document.document.documentDetails;
        }

        return extractorFields;
    }

    onSaveClick() {

        if (!this.validateEditor()) {
            // event.preventDefault();
            return false;
        }
        this.showAutoSaved();
        this.fields.fieldName = this.#components.txtExtractorGroupName.val;
        this.onSaveCallback( this.fieldParentNode, this.fields.index, this.fields);

        this.hideAutosaved();

    }

    onDebugClick() {
        this.onDebugCallBack();
    }

    onValidateClick(event){
        this.onValidateCallBack && this.onValidateCallBack(event, this);
    }

    validateEditor() {
        return true;
    }

    onChangeOfFormElements() {

        var inputs = document.querySelectorAll('[id^=uh_editor_]');
        var i = 0;
        for (i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('change', this.onSaveClick.bind(this));
        }
    }

    createComponents() {

        const lblStyleSmall = "font-weight: 550";
        this.createLabel('divLblExtractorGroupName', { style: lblStyleSmall, id: 'lblExtractorGroupName' }, 'Extractor Group Name *');
        this.#components.txtExtractorGroupName = new TextBox('divEleExtractorGroupName', 'uh_editor_txtExtractorGroupName', null, this.fields.fieldName ? this.fields.fieldName : "", "",
            this.onNodeIDChange.bind(this), null);
        const btnStyle = "margin-right:20px";

        this.createButton('divIconSave', { style: btnStyle, id: 'btnExport' }, 'Export', { "click": this.onExportClick.bind(this) });
        this.createButton('divIconValidate', { style: btnStyle, id: 'btnValidate' }, 'Validate', { "click": this.onValidateClick.bind(this) });
        this.createButton('divMoveUp', { style: btnStyle, id: 'btnUp' }, 'Up',  { "click": this.onTraverseClick.bind(this) });
        this.createButton('divMoveDown', { style: btnStyle, id: 'btnDown' }, 'Down',  { "click": this.onTraverseClick.bind(this) });
        this.createLabel('divSeparator', { style: lblStyleSmall, id: 'lblSeparator' }, '|');
        this.createButton('divDebug', {style: btnStyle, id:'btnDebug'},'Debug', {"click": this.onDebugClick.bind(this)});

    }

    handleRearrangeButtons(){
        let upButton = document.getElementById("btnUp");
        let downButton = document.getElementById("btnDown");

        let isFirstNode = true;
        let isLastNode = true;

        if(this.fields.index <= (this.getExtractorParentsExtractorFields().length -1)){
            if (this.fieldParentNode.isgroup) {
                isFirstNode = this.fieldParentNode.fields[0].fieldName === '__selector' ? this.fields.index == 1 : this.fields.index == 0;
                isLastNode = this.fields.index == this.fieldParentNode.fields.length - 1;
            } else if (this.fieldParentNode.document != null && this.fieldParentNode.document.document != null) {
                //fetch extractor if Harvester is parent .
                isFirstNode = this.fieldParentNode.document.document.documentDetails[0].fieldName === '__selector' ? this.fields.index == 1 : this.fields.index == 0;
                isLastNode  = this.fields.index == this.fieldParentNode.document.document.documentDetails.length - 1
            }
        }

        Utils.disableEnableButton(upButton, isFirstNode);
        Utils.disableEnableButton(downButton, isLastNode);
    }

    createContainerDivs() {

        const tblStyle = "height:100%";
        const divLabelStyle = "display:inline; width: 155px; text-align:left; padding-top:2px; padding-left:15px;"
        const divElementStyle = "display:inline; width: 220px;  text-align:left; padding-top:2px; padding-left:15px"
        const firstRow = "margin-top: 28px";
        const colStyle = "display:inline; width: 25%; min-width: 350px;";
        const colStyle2X = "display:inline; width: 25%; min-width: 350px; margin-left: 0px";
        const classRow = "margin-top:20px";
        const classCol = "display: inline-block;";
        const classColEle = "display: inline-block;";
        const classSeparator = "display: inline-block; font-size: 25px; padding-right:15px";
        const exportIcon =  "display: inline-block;margin-left:25px";
        const editorHeader = ";border-bottom: 2px solid rgb(0 0 0 / 25%); padding-bottom:15px;width:90%";

        let tblObj = {
            attr: { style: tblStyle },
            id: "tblEditorMain",
            rows: [
                {
                    attr: { style: classRow + editorHeader},
                    col: [
                        {
                            attr: { style: classCol }, divs: [
                            { attr: { style: exportIcon, id: "divIconSave" } },
                            { attr: { style: classColEle, id: "divIconValidate" } },
                            { attr: { style: classColEle, id: "divDebug" } },
                            { attr: { style: classSeparator, id: "divSeparator" } },
                            { attr: { style: classColEle, id: "divMoveUp" } },
                            { attr: { style: classColEle, id: "divMoveDown" } }
                        ]
                        }
                    ]
                },
                {
                    attr: { style: firstRow },
                    col: [
                        { attr: { style: colStyle }, divs: [{ attr: { style: divLabelStyle, id: "divLblExtractorGroupName" } }, 
                        { attr: { style: divElementStyle, id: "divEleExtractorGroupName" } }] },
                        { attr: { style: colStyle2X }, divs: [{ attr: { style: divLabelStyle, id: "divIconSelector" } }] }
                    ]
                }]
        }

        let divMain = this.createTable(tblObj);

        this.mountContainerToParent(divMain);
    }
}