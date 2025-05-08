import PythonEditorTab from "./container/python-editor-tab.js"

export default function loadCodeEditor() {
    
    sessionStorage["currentTab"] = "pythonEditor";
    let sourceProjectName = sessionStorage["selectedProject"] != "null" ? sessionStorage["selectedProject"] : sessionStorage["newProject"]
    new PythonEditorTab(sourceProjectName);
}