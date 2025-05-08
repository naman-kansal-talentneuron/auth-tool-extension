import ParamElement from "../../element/ParamElement.js";
import BaseEditor from "./base-editor.js";
import TextBox from "./../../component/text-box.js";
import DropDown from "./../../component/drop-down.js";
import MetaData from "../../config/meta-data.js";
import KeyValueList from "../../component/keyvalue-list.js";


export default class ParamElementEditor extends BaseEditor {

    #components = {
        txtNode : null,
        ddlDocumentType: null,
        txtParentNode: null,
        lstKeyValue: null
    };

    constructor(parentElement, nodeElement, authObj, onSaveCallback, onExportCallback, onDebugCallBack){
        super(parentElement);
        this.nodeElement = nodeElement;
        this.onSaveCallback = onSaveCallback;
        this.parentElement = this.parentElement;
        this.onExportCallback = onExportCallback;
        this.onDebugCallBack = onDebugCallBack;
        this.authObj = authObj;        
        this.populateEditor();
    }

    populateEditor() {
        if (this.validateInputNodeElement()) {
            //if Empty, initiate empty param element editor node
            this.nodeElement = new ParamElement("", "ParamElement", "", "", "root");
        } else {
            this.createContainerDivs();
            this.createComponents();    
            this.onChangeOfFormElements();        
        }

    }
    onChangeOfFormElements() {

        var inputs = document.querySelectorAll('[id^=uh_editor_]');
        var i = 0;
        for (i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('change', this.onSaveClick.bind(this));
        }
    }
    
    onSaveClick() {
        // 
        //console.log("FOrm is dirty");       

        this.showAutoSaved();

        if (this.onSaveCallback) {

            let nodeElement = this.saveParamElement();
            
            if (this.validateEditor(nodeElement)) {
                this.onSaveCallback(null, this, nodeElement);
            }

        }

        //this.resetFormIsDirty(this.#components);
        this.hideAutosaved();

    }
    
    validateEditor(nodeElement) {
        let validParents = this.createEligibleParentsList(this.authObj, nodeElement.elementId);       

        if (validParents != undefined && validParents.length > 0 && validParents.includes(this.#components.txtParentNode.val)) {
            nodeElement.elementParent = this.#components.txtParentNode.val;
            let style = "color: red; width: 100%; display: none;";
            document.getElementById('lblErrorMessage').setAttribute('style', style);
            return true;
        } else {
            let message = "Not a valid parent value";
            let style = "color: red; width: 100%;";
            document.getElementById('lblErrorMessage').setAttribute('style', style);
            document.getElementById('lblErrorMessage').innerText = message;
            
            return false;
        }
        return true;
    }

    saveParamElement() {
        this.nodeElement.elementId = this.#components.txtNode.val;
        this.nodeElement.elementDocumentType = this.#components.ddlDocumentType.selectedItem;
        this.nodeElement.elementPersist = this.#components.ddlDocumentType.selectedItem == undefined ? undefined: true;
        this.nodeElement.elementValues = this.#components.lstKeyValue.getOptions();
        return this.nodeElement;        

    }
    createEligibleParentsList(authObj, selectedElement) {
        let elementParentsList = [];
        let harvestorPrepareNode = authObj.prepare.harvestorPrepareNode;
        if (harvestorPrepareNode.length) {
            for (let i in harvestorPrepareNode) {
                let element = harvestorPrepareNode[i].elementId;
                let elementParent = harvestorPrepareNode[i].elementParent;
                elementParentsList.push({ 'element': element, 'elementParent': elementParent });
            }

            let childrenElemNamesList = [];
            childrenElemNamesList = this.getNestedChildrenNames(elementParentsList, selectedElement, childrenElemNamesList);
            let validParents = this.fetchValidParentsList(elementParentsList, childrenElemNamesList, selectedElement);

            return validParents;
        }

    }

    getNestedChildrenNames(elementParentsList, parent, childrenElemNamesList) {
        for (let i in elementParentsList) {
            if (elementParentsList[i].elementParent == parent) {
                var children = this.getNestedChildrenNames(elementParentsList, elementParentsList[i].element, childrenElemNamesList)
                if (children.length) {
                    elementParentsList[i].children = children;
                }
                childrenElemNamesList.push(elementParentsList[i].element);
            }
        }
        return childrenElemNamesList;
    }

    
    fetchValidParentsList(elementParentsList, childrenElemNamesList, selectedElement) {
        // adding selected element to the children list so as to remove it from the valid Parents list
        childrenElemNamesList.push(selectedElement);
        let validParentObjElements = elementParentsList.filter(function (item) {
            return !childrenElemNamesList.includes(item.element);
        });

        // reducing the valid list of element parent object to only list of valid parent name
        let validParentElemNames = validParentObjElements.reduce(function (validParentElemNames, item) {
            validParentElemNames.push(item.element);
            return validParentElemNames;
        }, []);
        // adding root as valid parent
        validParentElemNames.push("root");
        return validParentElemNames;
    }

   
    validateInputNodeElement() {
        return this.nodeElement  ==  null;
    }
    createComponents(){
        const lblStyle = "width: 85px;  font-weight: 550";
        const lblStyleSmall = "width: 45px;  font-weight: 550";
        const lblStyleSmallParent = "width: 85px;  font-weight: 550";
        //const lblStyleLarge = "width: 45px;  font-weight: 550; height: 30px";   
        const btnStyle = "margin-right:20px";
        const lblErrorMessage = "color: red; display:none";
        const lblInfo = "width: 100%; display:none";
        const imageStyle = "position: absolute;top: 100px;left: 240px;z-index: 100;";

        this.createLabel('divLblNodeId', { style: lblStyle, id: 'lblNodeId' }, 'Node id');
        this.#components.txtNode = new TextBox('divEleNodeId', 'uh_editor_txtNodeId', null, this.nodeElement.elementId, "",
            null, null);
        this.createLabel('divLblDocumentType', {style:lblStyle, id : 'lblDocumentType'}, 'Document Type');
        this.#components.ddlDocumentType = new DropDown('divEleDocumentType', 'uh_editor_ddlDocumentType', MetaData.getPrepareDocumentType ,this.nodeElement.elementDocumentType);         

        this.createLabel('divLblParentNode', { style: lblStyleSmallParent, id: 'lblParentNodeId' }, 'Parent');
        this.#components.txtParentNode = new TextBox('divEleParentNode', 'uh_editor_txtParentNode', '', this.nodeElement.elementParent, '');                

        /*this.createLabel('divLblKey', { style: lblStyleSmallParent, id: 'lblKey' }, 'Key');
        this.#components.txtKey = new TextBox('divEleKey', 'param_editor_txtKey', '', '', '');                

        this.createLabel('divLblValue', { style: lblStyleSmallParent, id: 'lblValue' }, 'Value');
        this.#components.txtValue = new TextBox('divEleValue', 'param_editor_txtValue', '', '', '');                

        this.createButton('divEleBtnAdd', { style: btnStyle, id: 'btnAdd' }, 'Add', { "click": this.onAddRowClick.bind(this) });
        */
        this.createLabel('divLblKeyValue', {style: lblStyleSmallParent, id: 'lblKeyValue'}, 'Key Value');
        this.#components.lstKeyValue = new KeyValueList('divEleKeyValue','param_keyValue', '',this.nodeElement.elementValues,this.onSaveClick.bind(this));

        // this.createImage("divLoading", "loading-image", imageStyle, "./loader.gif", "Loading..");
        this.createButton('divIconSave', { style: btnStyle, id: 'btnExport' }, 'Export', { "click": this.onExportClick.bind(this) });

        this.createLabel('divLblErrorMessage', { style: lblErrorMessage, id: 'lblErrorMessage' }, 'No matching element to highlight in this page for given (Selector-Selector type)');
    	this.createButton('divDebug', {style: btnStyle, id:'btnDebug'},'Debug', {"click": this.onDebugClick.bind(this)});
    

    }

    createContainerDivs() {
        const colStyle = "display:inline; width: 25%; min-width: 350px; margin-left: 25px";
        // my custom css style goes here
        const tblStyle = "height:100%";
        const classRow = "margin-top:20px";
        const classChildRow = "margin-top:5px";
        const classCol = "display: inline-block;";
        const pointAndClick = "display: inline-block;margin-left: 25px;"
        const classColEle = "display: inline-block;margin-left: auto;";
        const classKeyValueList = "display: inline-block;margin-left: 25px;"
        const showMoreButtonStyle = "display:inline-block;margin-left: 20px;margin-top: 0px; padding-top: 10px padding-top:2px; padding-left:65px;";
        const divImageStyle = "width: 100%;  height: 100%;  top: 0;  left: 0;  position: fixed;  display: none;  opacity: 0.7;  background-color: #fff;  z-index: 99;  text-align: center;";
        const editorHeader = ";border-bottom: 2px solid rgb(0 0 0 / 25%); padding-bottom:15px;width:90%";

       let  tblObj = {
        attr: { style: tblStyle },
        id: "tblEditorMain",       
        rows: [
            {
                attr: { style: classRow + editorHeader },
                col: [
                    {
                        attr: { style: classCol }, divs: [{ attr: { style: pointAndClick, id: "divIconSelector" } },
                        { attr: { style: classColEle, id: "divIconSave" } },
                        { attr: { style: classColEle, id: "divDebug" } }]
                    }
                ]
            },
            {
                attr: { style: classRow },
                col: [
                    {
                        attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblNodeId" } },
                        { attr: { style: classColEle, id: "divEleNodeId" } }]                        
                    },        
                    {
                        attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblDocumentType" } },
                        { attr: { style: classColEle, id: "divEleDocumentType" } }]                        
                    },                   
                    {
                        attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblParentNode" } },
                        { attr: { style: classColEle, id: "divEleParentNode" } }]
                    }
                ]
            },
            /*{
                attr: { style: classRow },
                col: [
                    {
                        attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblKey" } },
                        { attr: { style: classColEle, id: "divEleKey" } }]                        
                    },        
                    {
                        attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblValue" } },
                        { attr: { style: classColEle, id: "divEleValue" } }]                        
                    },                   
                    {
                        attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divEleBtnAdd" } },
                        { attr: { style: classColEle, id: "divLblBtnAdd" } }]
                    }
                ]
            },*/
            {
                attr: { style: classRow },
                col: [
                    {
                        attr: { style: classCol }, divs: [{ attr: { style: classKeyValueList, id: "divLblKeyValue" } }]
                    }
                ]
            },
            {
                attr: { style: classChildRow },
                col: [
                    {
                        attr: { style: classChildRow }, divs: [{ attr: { style: classKeyValueList, id: "divEleKeyValue" } }]
                    }
                ]
            },
            {
                attr: { style: classRow },
                col: [
                    { attr: { style: colStyle }, divs: [{ attr: { style: showMoreButtonStyle, id: "divIconShowMore" } }] },
                    { attr: { style: colStyle }, divs: [{ attr: { style: classCol, id: "divLblErrorMessage" } }] },
                    { attr: { style: colStyle }, divs: [{ attr: { style: divImageStyle, id: "divLoading" } }] }
                ]
            }

        ]
       }
        
       let divMain = this.createTable(tblObj);
       this.mountContainerToParent(divMain);
        
    }
            

    onAddRowClick(event) {

    }

    onExportClick(event) {
        this.onExportCallBack(event, this);
    }

    onDebugClick() {
        this.onDebugCallBack();
    }
	
}