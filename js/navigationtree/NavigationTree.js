import TreeView from './TreeView.js'

export default class NavigationTree {

    constructor(parentId, navigationObj, onClickHandler,addNodeHandler,deleteNodeHandler,selectedNodeEle, modifiedElement, cloneNodeHandler) {
        document.getElementById(parentId).innerHTML = "";
        this.treeView = new TreeView(parentId,navigationObj,onClickHandler,addNodeHandler,deleteNodeHandler,selectedNodeEle, modifiedElement, cloneNodeHandler);
    }

    enableTree( isActive){

        if( this.treeView.parentElement){
            if( isActive){            
            document.querySelector( "#" + this.treeView.parentElement ).classList.remove( 'treenode-disabled');
            }else{
                document.querySelector( "#" + this.treeView.parentElement ).classList.add( 'treenode-disabled');
            }
        }
        
    }
}