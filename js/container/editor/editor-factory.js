import CRCFieldEditor from "./crc-field-editor.js";
import CRCNodeEditor from "./crc-node-editor.js";
import ExtractorFieldEditor from "./extractor-field-editor.js";
import ExtractorGroupEditor from "./extractor-group-editor.js";
import HarvesterNodeEditor from "./harvester-node-editor.js";
import ParamElementEditor from "./param-element-editor.js";
import ParamsEditor from "./params-editor.js";
import StartURLEditor from "./start-url-editor.js";
import SourceNameEditor from "./source-name-editor.js";
import BlankEditor from "./blank-editor.js";
import OptionParamsEditor from "./option-params-editor.js";
import SettingsEditor from "./settings-editor.js";

export default class EditorFactory {

  static createEditor(parentElement, type, nodeAttributes, authObj,  onSaveCallback,  onExportCallBack, togglePointAndClickClick,onTxtSelectorChange, onValidateCallBack, navTreeUpdateCallBack, onTraverseCallBack, onDebugCallBack, onTransformCallBack) {

    switch (type) {
      case "Harvester":
        return new HarvesterNodeEditor(parentElement, nodeAttributes, authObj,  onSaveCallback, onExportCallBack, togglePointAndClickClick, onTxtSelectorChange, onValidateCallBack,navTreeUpdateCallBack, onTraverseCallBack, onDebugCallBack);
      case "ExtractorGroup":
          return new ExtractorGroupEditor(parentElement, nodeAttributes,authObj, onSaveCallback,  onExportCallBack, togglePointAndClickClick, onTxtSelectorChange, onValidateCallBack, navTreeUpdateCallBack, onTraverseCallBack, onDebugCallBack);
      case "Extractor":
        return new ExtractorFieldEditor(parentElement, nodeAttributes,authObj, onSaveCallback,  onExportCallBack, togglePointAndClickClick, onTxtSelectorChange, onValidateCallBack,navTreeUpdateCallBack, onTraverseCallBack, onDebugCallBack, onTransformCallBack);
      case "CRCNode" :
        return new CRCNodeEditor(parentElement,nodeAttributes,authObj,onSaveCallback, onExportCallBack, onValidateCallBack, navTreeUpdateCallBack, onDebugCallBack);
      case "CRCField" :
        return new CRCFieldEditor(parentElement, nodeAttributes,authObj, onSaveCallback, onExportCallBack, togglePointAndClickClick, onTxtSelectorChange, onValidateCallBack, navTreeUpdateCallBack, onDebugCallBack);
      case "StartURL" :
        return new StartURLEditor(parentElement, nodeAttributes,authObj, onSaveCallback, onExportCallBack, onValidateCallBack, onDebugCallBack);
      case "Params":
        return new ParamsEditor(parentElement, nodeAttributes,authObj, onSaveCallback, onExportCallBack, onValidateCallBack, onDebugCallBack, navTreeUpdateCallBack);
      case "ParamElement" :
        return new ParamElementEditor(parentElement, nodeAttributes, authObj, onSaveCallback, onExportCallBack, onDebugCallBack);    
 	    case "SourceName":
        return new SourceNameEditor(parentElement, nodeAttributes,authObj, onSaveCallback, onExportCallBack, onValidateCallBack, onDebugCallBack);
      case "OptionParams":
          return new OptionParamsEditor(parentElement, nodeAttributes,authObj, onSaveCallback, onExportCallBack, onValidateCallBack, onDebugCallBack);
      case "Settings":
          return new SettingsEditor(parentElement, nodeAttributes,authObj, onSaveCallback, onExportCallBack, onValidateCallBack, onDebugCallBack);
	    default:        
        return new BlankEditor(parentElement, onExportCallBack, onValidateCallBack, onDebugCallBack);    }

  }

  static createEditor_v1(parentElement, type, nodeAttributes, authObj, callBackRefObj) {

    switch (type) {
      case "Harvester":
        return new HarvesterNodeEditor(parentElement, nodeAttributes, authObj, callBackRefObj);
      default:        
        return new BlankEditor(parentElement, onExportCallBack, onValidateCallBack, onDebugCallBack);    }

  }

}