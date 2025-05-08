import  ProjectTab  from "./container/project-tab.js";

export default function  LoadProjectTab() {

    let sourceProjectName = sessionStorage["selectedProject"] != "null" ? sessionStorage["selectedProject"] : sessionStorage["newProject"]
    let projectTab = new ProjectTab(localStorage["rootPath"], sourceProjectName);
}