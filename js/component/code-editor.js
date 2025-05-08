import BaseComponent from "./base-component.js";
import Utils from "../utils.js";

export default class CodeEditor extends BaseComponent {

    editorOptions = {
        mode:  "javascript",
        theme: "eclipse",
        lineNumbers: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        extraKeys: {
            "Ctrl-Space": "autocomplete",
            "F11": (cm) => {
                cm.setOption("fullScreen", !cm.getOption("fullScreen"));
            },
            "Esc": function(cm) {
                if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
            }
        },
        styleActiveLine: true,
    }

    constructor(parentElementId, id, value, onChange, editorOptions, isScript) {
        super(parentElementId);
        this.isScript = isScript;
        this.id = id;
        this.value = value;
        this.currentEditor = null;
        this.onChange = onChange;
        // overriding the defaults
        if(editorOptions !== {}) {
            this.editorOptions = {
                ...this.editorOptions,
                ...editorOptions
            }
           this.currentTheme = this.editorOptions.theme; 
        }
        this.renderControl();
    }

    renderControl() {
        // creating code editor instance
        if(document.getElementById(this.id) === null) {
            let textBox = document.createElement('TEXTAREA');
            textBox.setAttribute("id", this.id);
            this.mountComponent(textBox);
        }

        this.createCodeMirrorJsEditor();
    }

    setEditorTheme(isScript){
        isScript ? this.currentEditor.setOption("theme", this.currentTheme ? this.currentTheme : "eclipse") : this.currentEditor.setOption("theme", "default");
    }

    toggleBeautifier(isScript){
        this.currentEditor.setOption("lineNumbers", isScript ? true : false);
        this.value = this.getValue();
        
        if(!isScript){
            this.value = Utils.removeEmptySpace(this.getValue().replace(/\r?\n|\r/g, ""), ['"', "'" ,"{", "}"]);
        }
        this.setValue(this.value, isScript);
        this.setEditorTheme(isScript);
    }

    createCodeMirrorJsEditor() {
        this.currentEditor = CodeMirror.fromTextArea(
            document.getElementById(this.id),
            this.editorOptions
        );

        this.setValue(this.value, this.isScript);
        this.setEditorTheme(this.isScript);
        // adding an on-change event listener to save editor content after every change
        this.currentEditor.on("change", this.onChange);
    }

    getValue() {
        return this.currentEditor.getValue();
    }

    setValue(value, isScript) {

        this.value = value;

        if(isScript) {
            try{
                this.scriptStatus = {isError: false, error: ""};
                this.value = Utils.removeEmptySpace(js_beautify(value, {"indent_size": 2}), ['"', "'"])  
            } catch(e){
                this.scriptStatus = {isError: true, error: e};
                console.log("Error beautifying script due to invalid syntax");
            }
        }

        this.currentEditor.doc.setValue(this.value);
        this.currentEditor.save();
    }

    getEditorObject(){
        return this.currentEditor;
    }

    switchToFullscreen() {
        this.currentEditor.setOption("fullScreen", true);
    }

    exitFromFullscreen() {
        this.currentEditor.setOption("fullScreen", false);
    }
}