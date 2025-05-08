import TextArea from "../../component/text-area.js";
import ElementUtil from "../../helper/element-util.js"
import Utils from "../../utils.js"
import MetaData from "../../config/meta-data.js"

export default class PythonEditor {

   #component = {
    environment : {},
    environmentUrl : ""
    }

   constructor(sourceName, content, onSaveCallback, onExportCallBack) {
       this.elementUtil = new ElementUtil();
       this.onSaveCallback = onSaveCallback;
       this.onExportCallBack = onExportCallBack;
       this.sourceName = sourceName;
       this.scriptContent = content;
       this.isComponentLoaded = false;
       this.renderOptions();
   }

   /**
    * Renders the component and handles default imports if applicable.
    */
   renderOptions() {
       this.createComponents();
       this.scriptContent == "" && this.setDefaultImports();
       this.#component.codeEditor.setValue(this.scriptContent);
       this.isComponentLoaded = true;
   }

   /**
    * @description: onchange method, invoked whenever code editor content changes.
    *               disables run/validate button if no content present.
    * @param {cm : code mirror reference, element : button to disable}
    */
   editorAreaOnChange(cm, element, origin){
       this.isComponentLoaded && origin === "codeEditor" && Utils.disableEnableButton(document.getElementById("editorBtnSave"), false)
       if(cm.getValue().trim() === "") { Utils.disableEnableButton(element, true) } 
       else if(element.disabled != false) { Utils.disableEnableButton(element, false) }
   }

   /**
    * @description: Enables/disables editor buttons to avoid making concurrent api calls.
    * @param {*} isDisabled : to enable the buttons post successful api call.
    */
   handleEditorButtons(isDisabled){

       this.#component.codeEditor.getValue() === "" || isDisabled ? Utils.disableEnableButton(document.getElementById('editorBtnValidate'), true) 
               : Utils.disableEnableButton(document.getElementById('editorBtnValidate'), false)
       this.#component.codeEditorMain.getValue() === "" || isDisabled ? Utils.disableEnableButton(document.getElementById('btnRun'), true) 
               : Utils.disableEnableButton(document.getElementById('btnRun'), false)

       Utils.disableEnableButton(document.getElementById('btnLoadModules'), isDisabled);
   }

   /**
    * @description: Creates all core components in the python ide window.
    */
   createComponents(){
       const lblStyleInline = "font-size: small; display:inline; width: 10%;  font-weight: 550; padding : 10px 10px 5px 0";
       const eleStyleInlineEx = "border-radius: 6px; padding-left: 7px; border-color: rgb(0 0 0 / 25%); display:inline; width: 80px;  font-weight: 400; margin-left:7px ; margin-right: 30px";
       this.elementUtil.createLabel("editor-header",{id: 'lblFileName'}, this.sourceName+ ".py");
       this.#component.editorArea = new TextArea('editor-container','divEditorTextArea', 'editorInput',"", "",25,15);
       this.#component.expressionArea = new TextArea('expressionContainer','divCallMethodTextArea', 'editorInput',"", "Execute Method Here..",8,15,null ,null,null,null, true);
       this.createConsoleBlock(document.getElementById("output-container"));
       this.elementUtil.createButton('console-header', {id: 'btnRun' }, 'Run Expression', { "click": this.onRunClick.bind(this) });
       this.elementUtil.createButton('editor-header', {id: 'editorBtnValidate' }, 'Validate Syntax', { "click": this.onValidateClick.bind(this) });
       this.elementUtil.createButton('editor-header', {id: 'editorBtnExport' }, 'Export', { "click": this.onExportClick.bind(this) });
       this.elementUtil.createButton('editor-header', {id: 'editorBtnSave' }, 'Save', { "click": this.onSaveClick.bind(this) });
       this.elementUtil.createButton('console-header', {id: 'btnLoadModules' }, 'Reload Common Modules', { "click": this.onLoadModulesClick.bind(this) });
       // URL to connect     
       this.elementUtil.createLabelWithElement(document.getElementById('console-header'), { style:lblStyleInline, id:'lblpyserverUrl'}, 'Env to connect');
       this.#component.environment = this.elementUtil.createDropdownWithElement(document.getElementById('console-header'), { style:eleStyleInlineEx}, ["Prod", "QA"], this.onUrlSelectionChange.bind(this));
       
       this.#component.codeEditor = CodeMirror.fromTextArea(
         document.getElementById("divEditorTextArea"),
         {
           mode: { name: "python", singleLineStringErrors: false },
           theme: "eclipse",
           lineNumbers: true,
           indentUnit: 4,
           styleActiveLine: true,
           matchBrackets: true,
           autoCloseBrackets: true,
           extraKeys: {
            "Ctrl-Space": "autocomplete",
           },
         }
       );

       this.#component.codeEditorMain = CodeMirror.fromTextArea(
         document.getElementById("divCallMethodTextArea"),
         {
           mode: "python",
           theme: "eclipse",
           lineNumbers: true,
           indentUnit: 4,
           placeholder:
             "Evaluate Expression here.. \n\nSample Expression: #['" +
             this.sourceName +
             "'].<method name>(<parameter>)",
           styleActiveLine: true,
           matchBrackets: true,
           autoCloseBrackets: true,
           extraKeys: {
            "Ctrl-Space": "autocomplete",
           },
         }
       );

       this.#component.codeEditorMain.on("changes", (cm) => {this.editorAreaOnChange(cm, document.getElementById('btnRun'))})
       this.#component.codeEditor.on("changes", (cm) => {this.editorAreaOnChange(cm, document.getElementById('editorBtnValidate'), "codeEditor")})
       this.#component.codeEditorMain.setSize("100%", "83px");

       this.handleEditorButtons(false);
       this.onUrlSelectionChange();
       Utils.disableEnableButton(document.getElementById("editorBtnSave"), true)
   }

   /**
    * @description : Creates output block to display the result of the operations.
    * @param {*} parentElement : Parent element to which the block to be attached.
    */
   createConsoleBlock(parentElement){
    let container = document.createElement("div");
    container.setAttribute("id", "container-output");
    let header = document.createElement("div");
    header.setAttribute("id", "output-header");
    header.innerHTML =  "Output Console<br><br>"
    let content = document.createElement("div");
    content.setAttribute("id", "output-block");
    container.appendChild(header);
    container.appendChild(content);
    parentElement.appendChild(container);
   }

   /**
    * @description: Sets default imports statements, in case of new file.
    */
   setDefaultImports(){
       this.scriptContent = localStorage["pythonImport-git"] == "" ? 
                   JSON.parse(localStorage["pythonImport-config"]) : localStorage["pythonImport-git"];
   }

   /**
    * @description: Makes an api call to validate the syntax of the code typed in.
    *               Displays the list of errors post validation, if any.
    */
    onValidateClick(e){

       this.processingLoader(true, e)
       this.handleEditorButtons(true);

       document.getElementById("output-block").innerHTML = "Validating Syntax.."
       var onSuccess = this.displayMessage.bind(this);
       var onError = this.displayErrorMessage.bind(this)
       $.ajax({
           type: "POST",
           url:  this.#component.environmentUrl  + "validate_code",
           data: JSON.stringify({ text: this.#component.codeEditor.getValue() }),
           contentType: "application/json; charset=utf-8",
           dataType: "json",
           success: onSuccess,
           error: onError
       });
   }

         /**
       * Sets the environment of python-editor and the respective url to connect.
       */
         onUrlSelectionChange(){          
          for(var e of MetaData.getPythonEvaluatorUrl()){
            if(this.#component.environment.value === e.name){
              this.#component.environmentUrl = e.value;         
              break;
            }
          }
        }


   /**
    * @description: Makes an api call to run the expression typed in. 
    *               Makes eval call at the back end.
    *               Displays the list of errors post validation, if any.
    */
   onRunClick(e){

       this.handleEditorButtons(true);
       this.processingLoader(true, e)

       document.getElementById("output-block").innerHTML = "Evaluating Expression.."
       var onSuccess = this.displayMessage.bind(this)
       var onError = this.displayErrorMessage.bind(this)
       
       $.ajax({
           type: "POST",
           url: this.#component.environmentUrl + "evaluate_exp",
           data: JSON.stringify({ 
               customScript: this.#component.codeEditor.getValue(), 
               expression: this.#component.codeEditorMain.getValue(), 
               sourceName : this.sourceName
           }),
           contentType: "application/json; charset=utf-8",
           dataType: "json",
           success: onSuccess,
           error: onError
       });
   }

   /**
    * @description: Loads common utils from the remote directory 
    *               and makes it available for execution of expression
    */
   onLoadModulesClick(e){
       this.processingLoader(true, e)
       var onSuccess = this.displayMessage.bind(this)
       var onError = this.displayErrorMessage.bind(this)

       $.ajax({
           type: "GET",
           url:  this.#component.environmentUrl + "load_commonutils",
           success: onSuccess,
           error: onError
       });
   }

   displayErrorMessage() {
       this.handleEditorButtons(false);
       this.processingLoader(false)
       document.getElementById("output-block").innerHTML = "Error occurred while processing. Please try again."
   }


   displayMessage(data, e){
       this.handleEditorButtons();
       this.processingLoader(false)
       var message = ""

       if(data.length != undefined){
           let error = [];
           let warning = [];

           for(var i = 0; i < data.length; i++)
           {
             if(data[i] != null){
               data[i].isError ? error.push(data[i].message) : warning.push(data[i].message) 
             }
           }

           if(error.length > 0) {
             message += "<span style='color:red'>ERROR</span><br><br>"
             error.forEach(e => {message += (e + "<br>")})
           }
           if(warning.length > 0){
             message += "<br><span style='color:yellow'>WARNING</span><br><br>"
             warning.forEach(e => {message += (e + "<br>")})
           }
           document.getElementById("output-block").innerHTML = message;
       } else {
           message = data.message;
           document.getElementById("output-block").innerText = message;
       }
   }

   
   onSaveClick(e){
       this.processingLoader(true, e)
       Utils.disableEnableButton(document.getElementById("editorBtnSave"), true)

       this.onSaveCallback(this.#component.codeEditor.getValue())

       setTimeout(() => {
           this.processingLoader(false)
       }, 1000)
   }

   // Downloads the content to a file.
   onExportClick(e){
    this.processingLoader(true, e)

    this.onExportCallBack();

    setTimeout(() => {
        this.processingLoader(false)
    }, 1000)
   }

   // Shows loader next to button
   processingLoader(active, e) {

    var loader = document.querySelector("#exportLoader");
       // Add dynamic Loader to Export
       if (!loader) {
         var parent = e.target;
         var loader = document.createElement('div');
         loader.id = "exportLoader"
         parent.appendChild(loader);
       }
       if(active){
        loader.classList.add("processing-loader")
       } else{
        loader.classList.remove("processing-loader");
        document.getElementById("exportLoader").remove();
       }
     }  

}