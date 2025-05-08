import MetaData from "../../config/meta-data.js";
import ShowErrDialog from "../../component/showError-dialog.js";
import ElementUtil from "../../helper/element-util.js";

export default class ProxyDialogUtil {

    dialogReference = null;
    proxy = null;
    PREVIEW_PROXY = "preview-proxy";
    proxyDropDown = {
        proxy : null,
    }

    constructor(){
        this.elementUtil = new ElementUtil();
        this.resumeProxy();
    }

    getProxyFromStorage() {
        return JSON.parse(window.localStorage.getItem(this.PREVIEW_PROXY));
    }

    setProxyToStorage(proxy){
        window.localStorage.setItem(this.PREVIEW_PROXY, JSON.stringify(proxy));
    }

    resumeProxy(){

        //Check Proxy exists in Session Storage
        let proxyValue = this.getProxyFromStorage();
        if(proxyValue!== null && proxyValue!== ""){
            this.proxy = proxyValue;
        }
         //if not set default one
        else{
        this.proxy = null;
        } 
        return this.proxy;
        
    }
    
    proxyDropDownData(){
        let proxyDD = {};
        let data = {};
        MetaData.getProxyOptions().forEach(item => {
            proxyDD[item.label] = (item.label);
             data = {
                host: item.value.split(':')[0],
                port: item.value.split(':')[1] 
            }
        })
        return proxyDD;
        
    }

    showProxyDialog(onProxyChangeCallback) {

        let dialogRenderBodyCallback = () => { return this.dialogRenderBodyCallback(); }
        let onContinueClick = () => {
            //store to storage
            this.setProxyToStorage(this.proxy);
            onProxyChangeCallback (this.proxy);
        }
        let buttonGroup = [];
        buttonGroup = [{ name: "Continue", isAutoClose: true, callback: () => onContinueClick() },
        { name: "Cancel", isAutoClose: true }]
    
        this.dialogReference = new ShowErrDialog({
          okButtonText: "",
          errorText: "",
          warningText: " ",
          renderHtmlCallBack: dialogRenderBodyCallback,
          registerButtonGroupObject: buttonGroup
        });
            
        this.dialogReference.confirm();
    }

    dialogRenderBodyCallback = () => {

        let parentDialogEle = this.elementUtil.prepareParentElement(null, "proxyDialogContainer", "");
    
        return this.getDialogElement(parentDialogEle);
    }

    
    getDialogElement(parentDialogEle){

        let proxyDD = this.proxyDropDownData();
        const headerLblStyle = "width: 100%; font-size:large; text-align: center; font-weight: 900;";
        const lblStyleInline = "font-size: small; width: 60px;  font-weight: 550; padding : 10px 10px 5px 0; word-wrap: break-word;";
        const eleStyleInlineEx = "border-radius: 6px; padding-left: 7px; border-color: rgb(0 0 0 / 25%); display:inline; width: 150px;  font-weight: 400; margin-left:7px ; margin-top:15px; margin-right: 30px";

        this.elementUtil.createLabelWithElement(parentDialogEle, { id: "divFieldBrTg", style: headerLblStyle }, "Macro Preview Parameter");
        this.elementUtil.createLabelWithElement(parentDialogEle,{ id: "lblField", style: lblStyleInline},"Proxy :");
        this.proxyDropDown.proxy = this.elementUtil.createDropdownWithElement(parentDialogEle,{ id:"ddlPreviewMacrosProxy",style: eleStyleInlineEx },proxyDD,this.onProxySelectionChange.bind(this));
        this.setProxyDialogLabelData();
        return parentDialogEle;
    }

    setProxyDialogLabelData(){
        if(this.proxy !== null && this.proxy !== ""){
            for(var e of MetaData.getProxyOptions()){
                if(e.value == this.proxy.ip + ":" + this.proxy.port){
                    this.proxyDropDown.proxy.value = e.label;
                }
            }
        }
    }

    onProxySelectionChange(changedProxy){
        if(this.proxy === null || this.proxy === ""){
            this.proxy = {};
        }
        for(var e of MetaData.getProxyOptions()){
            
            if(changedProxy.target.value === e.label){
                let data = {
                    host: e.value.split(':')[0],
                    port: e.value.split(':')[1] 
                }                
               this.proxy.ip = data.host;
               this.proxy.port = data.port;
                break;
            }
        }

    }

}