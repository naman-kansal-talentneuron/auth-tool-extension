// this function will make context menu disappear when user scrolls the Project Tab Node Tree
const destroyContextMenu = () => {
	const contextMenu = document.getElementById("ul_cm");
	contextMenu && (contextMenu.style.display = "none");
}

export default class TreeView {
    constructor(parentElement, treeData, onClickHandler, addNodeHandler, deleteNodeHandler, selectedNodeEle, modifiedElement, cloneNodeHandler) {
        this.parentElement = parentElement;
        this.treeData = treeData;
        this.onClickHandler = onClickHandler;
        this.deleteNodeHandler = deleteNodeHandler;
        this.addNodeHandler = addNodeHandler;
        this.cloneNodeHandler = cloneNodeHandler;
        let dataObj = treeData.authScriptObject;
        let tree = {};

        let payload = dataObj.payload.harvestorPayloadNode;
        let prepare = dataObj.prepare.harvestorPrepareNode;
        let options = dataObj.options ? dataObj.options : {};

        let isPrepareRequired = prepare.length < 1;
        let isPayloadRequired = payload.length < 1;

        //Creating the tree
        tree = new CreateTree(parentElement, 'white', null, onClickHandler, selectedNodeEle);

        //Tree Context Menu Structure         
        let contex_menu = this.getContextMenu(addNodeHandler, deleteNodeHandler, tree, isPayloadRequired, isPrepareRequired, cloneNodeHandler);
        tree.setContexMenu(contex_menu);

        let sourceName = '<a class="source-name">' + dataObj.source + '</a>';

        //Add Source and StartURL
        let defaultContext  = dataObj.params != undefined && Object.keys(dataObj.params).length > 0 ? "context7" : "context1";
        tree.createNode(this.getDisplayText(sourceName), false, '', null, null, 'parent_context1', null, undefined, undefined, 'SourceName');
        tree.createNode(this.getDisplayText(dataObj.startUrl), false, '', null, null, defaultContext, null, undefined, undefined, 'StartURL');        

        //Add Params
        if (dataObj.params != undefined && Object.keys(dataObj.params).length > 0) {
            tree.createNode("Params", false, '', null, null, 'context5', null, undefined, undefined, 'Params');
        }
        
        //Add Settings
        tree.createNode( "Settings", false, '', null, null, defaultContext, null, undefined, undefined, 'Settings');

        //Add Options
        tree.createNode( "Options", false, '', null, null, defaultContext, null, undefined, undefined, 'OptionParams');

        // Add Prepare and Payload nodes
        let prepareParentList = this.setupTreeNodes(tree, prepare, 'prepare')
        let payLoadParentList = this.setupTreeNodes(tree, payload, 'payload')

        //Rendering the tree
        tree.drawTree();

        //Node Highlighter
        let newParentNodeList = modifiedElement != null && modifiedElement.category == 'prepare' ? prepareParentList : payLoadParentList;
        if (modifiedElement != null && modifiedElement != undefined) {
            let nodeEle = newParentNodeList[modifiedElement.elementId];
            tree.selectNode(nodeEle);
        }
        else if (selectedNodeEle != null && selectedNodeEle != undefined) {
            // document.getElementById("ul_" + selectedNodeEle.id).previousSibling.className = 'node_selected'
        }
        else if (payload[0] != undefined) {
            let firstNode = newParentNodeList[payload[0].elementId];
            tree.selectNode(firstNode);
        }
    }

    getDisplayText(text) {
        if (text && text.length > 43) {
            return text.substring(0, 40) + '...';
        }
        return text;
    }

    setupTreeNodes(tree, nodedata, category) {
        let isExpanded = true;
        let parent = {};
        let newParentNode = {};
        let newParentNodeList = [];

        if (nodedata.length > 0) {

            //Add Master Node Payload or Prepare

            let payloadNode = tree.createNode(category, isExpanded, '', null, null, category + '_context', {}, 0, 0, category, 'root');

            for (var i = 0; i < nodedata.length; i++) {
                let parentList = this.getParentNode(nodedata, nodedata[i]);
                newParentNode = newParentNodeList[parent.elementId];
                if (parentList.length == 0) {
                    // Root node  // IsValidSelector
                    // let harvestorName = '<a class="broken-node">'+nodedata[i].elementId+ '</a>';
                    let harvestorName = nodedata[i].elementId;
                    let rootNode = tree.createNode(this.getDisplayText(harvestorName), isExpanded, '', payloadNode, null, category + '_context2', nodedata[i], i, i, 'Harvester', category);
                    newParentNodeList[rootNode.text] = rootNode;

                    if (nodedata[i].elementDocumentType !== undefined && nodedata[i].document != undefined && nodedata[i].document.document != undefined) {
                        let fieldArr = nodedata[i].document.document.documentDetails;

                        this.renderExtractorNodes(rootNode, nodedata[i], fieldArr, i, isExpanded, category);

                    }

                    if (nodedata[i].elementCRCFields !== undefined) {
                        let CRCArr = nodedata[i].elementCRCFields.crcFieldsArr;
                        let CRCNode = rootNode.createChildNode(this.getDisplayText('CRC-' + nodedata[i].elementCRCFields.document), false, '', null, 'context4', nodedata[i].elementCRCFields.document, i, j, 'CRC', category);

                        if (CRCArr) {
                            for (var j = 0; j < CRCArr.length; j++) {
                                // let crcFieldName = '<a class="broken-node">'+CRCArr[j].fieldName+ '</a>';
                                let crcFieldName = CRCArr[j].fieldName;
                                let node2 = CRCNode.createChildNode(this.getDisplayText(crcFieldName), false, '', null, 'context3', CRCArr[j], i, j, 'CRCField', category);
                            }
                        }
                    }

                } else {
                    // Creating child nodes
                    parent = parentList[0];
                    newParentNode = newParentNodeList[parent.elementId];
                    // let harvestorName = '<a class="broken-node">'+nodedata[i].elementId+ '</a>';
                    let harvestorName = nodedata[i].elementId;
                    let childNode = newParentNode.createChildNode(this.getDisplayText(harvestorName), isExpanded, '', payloadNode, category + '_context2', nodedata[i], i, i, 'Harvester', category);
                    newParentNodeList[childNode.text] = childNode;
                    //Todo nodedata[i].elementDocumentType !== undefined &&  -- Removed as temp. It needs fix
                    if (nodedata[i].document != undefined && nodedata[i].document.document != undefined) {
                        let document = nodedata[i].document.document.documentDetails;

                        this.renderExtractorNodes(childNode, nodedata[i], document, i, isExpanded, category);


                    }
                    if (nodedata[i].elementCRCFields !== undefined) {
                        let CRCArr = nodedata[i].elementCRCFields.crcFieldsArr;
                        let CRCNode = childNode.createChildNode(this.getDisplayText('CRC-' + nodedata[i].elementCRCFields.document), false, '', null, 'context4', nodedata[i].elementCRCFields.document, i, j, 'CRC', category);

                        for (var j = 0; j < CRCArr.length; j++) {
                            // let crcFieldName = '<a class="broken-node">'+CRCArr[j].fieldName+ '</a>';
                            let crcFieldName = CRCArr[j].fieldName;
                            let node2 = CRCNode.createChildNode(this.getDisplayText(crcFieldName), false, '', null, 'context3', CRCArr[j], i, j, 'CRCField', category);
                        }
                    }
                }
            }

        }

        return newParentNodeList;
    }

    renderExtractorNodes(parentTreeNode, parentNode, fieldArr, counter, isExpanded, category) {

        for (var j = 0; j < fieldArr.length; j++) {

            let extractorName = fieldArr[j].fieldName;

            let fieldsRootNode = null;
            if (fieldArr[j].isgroup) {

                fieldsRootNode = parentTreeNode.createChildNode('<a class="extractor-group">' + this.getDisplayText(extractorName) + '</a>', isExpanded, '', parentNode, 'context3_group', fieldArr[j], counter, j, 'ExtractorGroup', category);

                this.renderExtractorNodes(fieldsRootNode, fieldArr[j], fieldArr[j].fields, counter, isExpanded, category)
            }
            else {
                let node2 = parentTreeNode.createChildNode('<a class="extractor-node">' + this.getDisplayText(extractorName) + '</a>', isExpanded, '', parentNode, 'context3', fieldArr[j], counter, j, 'Extractor', category);
            }
        }
    }

    getContextMenu(addNodeHandler, deleteNodeHandler, tree, isPayloadRequired, isPrepareRequired, cloneNodeHandler) {

        let isExpanded = true;

        let parentElement = [];

        if (isPrepareRequired) {
            parentElement.push({
                text: 'Add Prepare',
                icon: '../../images/add1.png',
                action: function (node) {
                    tree.createNode("prepare", true, '', null, null, 'prepare_context', {}, 0, 0, 'root');
                    addNodeHandler(node, 'payload');
                }
            });
        }

        if (isPayloadRequired) {
            parentElement.push({
                text: 'Add Payload',
                icon: '../../images/add1.png',
                action: function (node) {
                    tree.createNode("payload", true, '', null, null, 'payload_context', {}, 0, 0, 'root');
                    addNodeHandler(node, 'payload');
                }
            });

        }

        return {

            'parent_context1': {
                elements: parentElement
            },
            'payload_context': {
                elements: [
                    {
                        text: 'Add Harvester Node',
                        icon: '../../images/add1.png',
                        action: function (node) {
                            node.createChildNode('New Harvester Node', false, '', null, 'payload_context2', null, null, null, 'Harvester', 'payload');
                            addNodeHandler(node, 'Harvester', 'payload');
                        }
                    }
                ]
            },
            'prepare_context': {
                elements: [
                    {
                        text: 'Add Harvester Node',
                        icon: '../../images/add1.png',
                        action: function (node) {
                            node.createChildNode('New Harvester Node', false, '', null, 'prepare_context2', null, null, null, 'Harvester', 'prepare');
                            addNodeHandler(node, 'Harvester', 'prepare');
                        }
                    }
                ]
            },
            'context1': {
                elements: [
                    {
                        text: 'Add Param',
                        icon: '../../images/add1.png',
                        action: function (node) {
                            let node1 = tree.createNode('Params', isExpanded, '', null, null, 'context5', null);
                            tree.drawTree();
                            addNodeHandler(node, 'Params');
                        }
                    }
                ]
            },
            'prepare_context2': {
                elements: [
                    {
                        text: 'Add Harvester Node',
                        icon: '../../images/add1.png',
                        action: function (node) {
                            node.createChildNode('New Harvester Node', false, '', null, 'prepare_context2', null, null, null, 'Harvester', 'prepare');
                            addNodeHandler(node, 'Harvester', 'prepare');
                        }
                    },
                    {
                        text: 'Delete Node',
                        icon: '../../images/delete.png',
                        action: function (node) {
                            deleteNodeHandler(node);
                        }
                    }
                ]
            },
            'payload_context2': {
                elements: [
                    {
                        text: 'Add Harvester Node',
                        icon: '../../images/add1.png',
                        action: function (node) {
                            node.createChildNode('New Harvester Node', false, '', null, 'payload_context2', null, null, null, 'Harvester', 'payload');
                            addNodeHandler(node, 'Harvester', "payload");
                        }
                    },
                    {
                        text: 'Add Extractor Group',
                        icon: '../../images/add1.png',
                        action: function (node) {
                            node.createChildNode('New Extractor Group', isExpanded, '', null, 'context3_group', null, null, null, 'Harvester', 'payload');
                            addNodeHandler(node, 'ExtractorGroup', node.category);
                        }
                    },
                    {
                        text: 'Add Extractor Node',
                        icon: '../../images/add1.png',
                        action: function (node) {
                            node.createChildNode('New Extractor Node', isExpanded, '', null, 'context3', null, null, null, 'Harvester', 'payload');
                            addNodeHandler(node, 'Extractor', node.category);
                        }
                    },
                    {
                        text: 'Add CRC',
                        icon: '../../images/add1.png',
                        action: function (node) {
                            node.createChildNode('New CRC Node', false, '', null, 'context3');
                            addNodeHandler(node, 'CRC');
                        }
                    },
                    {
                        text: 'Delete Node',
                        icon: '../../images/delete.png',
                        action: function (node) {
                            deleteNodeHandler(node);
                        }
                    }
                ]
            },
            'context3_group': {
                elements: [
                    {
                        text: 'Add Extractor Group',
                        icon: '../../images/add1.png',
                        action: function (node) {
                            node.createChildNode('New Extractor Group', isExpanded, '', null, 'context3_group', null, null, null, 'Harvester', 'payload');
                            addNodeHandler(node, 'ExtractorGroup', 'payload');
                        }
                    },
                    {
                        text: 'Add Extractor Node',
                        icon: '../../images/add1.png',
                        action: function (node) {
                            node.createChildNode('New Extractor Node', isExpanded, '', null, 'context3', null, null, null, 'Harvester', 'payload');
                            addNodeHandler(node, 'Extractor', 'payload');
                        }
                    },
                    {
                        text: 'Delete Node',
                        icon: '../../images/delete.png',
                        action: function (node) {
                            deleteNodeHandler(node);
                        }
                    }
                ]
            },
            'context3': {
                elements: [
                    {
                        text: 'Clone Node',
                        icon: '../../images/add1.png',
                        action: function (node) {
                            node.parent.createChildNode(node.currentContext.fieldName + '-clone', isExpanded, '', null, 'context3', null, null, null, 'Harvester', 'payload');
                            cloneNodeHandler(node, 'Extractor', 'payload');
                        }
                    },
                    {
                        text: 'Delete Node',
                        icon: '../../images/delete.png',
                        action: function (node) {
                            deleteNodeHandler(node);
                        }
                    }
                ]
            },
            'context4': {
                elements: [
                    {
                        text: 'Add CRC Field',
                        icon: '../../images/add1.png',
                        action: function (node) {
                            node.createChildNode('New CRC Field', false, '', null, 'context4');
                            addNodeHandler(node, 'CRCField');
                        }
                    },
                    {
                        text: 'Delete Node',
                        icon: '../../images/delete.png',
                        action: function (node) {
                            deleteNodeHandler(node);
                        }
                    }
                ]
            },
            'context5': {
                elements: [
                    {
                        text: 'Delete Param',
                        icon: '../../images/delete.png',
                        action: function (node) {
                            deleteNodeHandler(node);
                        }
                    }
                ]
            },
            'context6': {
                elements: [
                    {
                        text: 'Add Harvester Node',
                        icon: '../../images/add1.png',
                        action: function (node) {
                            let node1 = tree.createNode('New Harvester Node', isExpanded, '', null, null, 'context2', null);
                            tree.drawTree();
                            addNodeHandler(node, 'Harvester');
                        }
                    }
                ]
            },
            'context7': {
                elements: []
            }
        };
    }

    getParentNode(list, selectedElement) {
        if (selectedElement.elementParent == "root") {
            // If rootNode then return empty array
            return [];
        } else {
            // return the node which has elementId = selectedElement.parent
            return list.filter((item, index) => {
                return item.elementId == selectedElement.elementParent;
            });
        }
    }
}

///// Creating the tree component
// p_div: ID of the div where the tree will be rendered;
// p_backColor: Background color of the region where the tree is being rendered;
// p_contextMenu: Object containing all the context menus. Set null for no context menu;
// function createTree(p_div, p_backColor, p_contextMenu) {
class CreateTree {
    constructor(p_div, p_backColor, p_contextMenu, onClickHandler, selectedNodeEle) {
        var tree = {
            name: 'tree',
            div: p_div,
            ulElement: null,
            childNodes: [],
            backcolor: p_backColor,
            contextMenu: p_contextMenu,
            selectedNode: null,
            nodeCounter: 0,
            contextMenuDiv: null,
            rendered: false,
            activeNode: selectedNodeEle,
            ///// Creating a new node
            // p_text: Text displayed on the node;
            // p_expanded: True or false, indicating wether the node starts expanded or not;
            // p_icon: Relative path to the icon displayed with the node. Set null if the node has no icon;
            // p_parentNode: Reference to the parent node. Set null to create the node on the root;
            // p_tag: Tag is used to store additional information on the node. All node attributes are visible when programming events and context menu actions;
            // p_contextmenu: Name of the context menu, which is one of the attributes of the p_contextMenu object created with the tree;
            createNode: function (p_text, p_expanded, p_icon, p_parentNode, p_tag, p_contextmenu, p_currentContext, p_parentIndex, p_selectedIndex, p_nodeType, p_category, isActiveNode) {
                let v_tree = this;
                let node = {
                    id: 'node_' + this.nodeCounter,
                    text: p_text,
                    icon: p_icon,
                    parent: p_parentNode,
                    expanded: p_expanded,
                    childNodes: [],
                    tag: p_tag,
                    contextMenu: p_contextmenu,
                    elementLi: null,
                    currentContext: p_currentContext,
                    selectedIndex: p_selectedIndex,
                    parentIndex: p_parentIndex,
                    nodeType: p_nodeType,
                    category: p_category,
                    isActiveNode : isActiveNode,
                    ///// Removing the node and all its children
                    removeNode: function () { v_tree.removeNode(this); },
                    ///// Expanding or collapsing the node, depending on the expanded value
                    toggleNode: function (p_event) { v_tree.toggleNode(this); },
                    ///// Expanding the node
                    expandNode: function (p_event) { v_tree.expandNode(this); },
                    ///// Expanding the node and its children recursively
                    expandSubtree: function () { v_tree.expandSubtree(this); },
                    ///// Changing the node text
                    // p_text: New text;
                    setText: function (p_text) { v_tree.setText(this, p_text); },
                    // p_setCurrentContext: setCurrentContext
                    setCurrentContext: function (p_currentContext) { v_tree.setText(this, p_currentContext); },
                    ///// Collapsing the node
                    collapseNode: function () { v_tree.collapseNode(this); },
                    ///// Collapsing the node and its children recursively
                    collapseSubtree: function () { v_tree.collapseSubtree(this); },
                    ///// Deleting all child nodes
                    removeChildNodes: function () { v_tree.removeChildNodes(this); },
                    ///// Creating a new child node;
                    // p_text: Text displayed;
                    // p_expanded: True or false, indicating wether the node starts expanded or not;
                    // p_icon: Icon;
                    // p_tag: Tag;
                    // p_contextmenu: Context Menu;
                    createChildNode: function (p_text, p_expanded, p_icon, p_tag, p_contextmenu, p_currentContext, p_parentIndex, p_selectedIndex, p_nodeType, p_category) {
                        //// Checks if the current node is the active node and sets the isActiveNode to highlight the node.     
                         isActiveNode = (p_currentContext && v_tree.activeNode && (p_nodeType === "Extractor" || p_nodeType === "ExtractorGroup") &&  
                                 p_nodeType == v_tree.activeNode.nodeType &&
                                 p_selectedIndex == v_tree.activeNode.selectedIndex &&
                                 p_tag == v_tree.activeNode.parent.currentContext) ? true : false;
                                                 
                        return v_tree.createNode(p_text, p_expanded, p_icon, this, p_tag, p_contextmenu, p_currentContext, p_parentIndex, p_selectedIndex, p_nodeType, p_category, isActiveNode);
                    }
                }

                this.nodeCounter++;

                if (this.rendered) {

                    if (p_parentNode == undefined) {
                        this.drawNode(this.ulElement, node);
                        this.adjustLines(this.ulElement, false);
                    }
                    else {
                        var v_ul = p_parentNode.elementLi.getElementsByTagName("ul")[0];
                        if (p_parentNode.childNodes.length == 0) {
                            let v_img = '';
                            if (p_parentNode.expanded) {
                                p_parentNode.elementLi.getElementsByTagName("ul")[0].style.display = 'block';
                                v_img = p_parentNode.elementLi.getElementsByTagName("img")[0];
                                v_img.style.visibility = "visible";
                                v_img.src = '../../images/collapse.png';
                                v_img.id = 'toggle_off';
                            }
                            else {
                                p_parentNode.elementLi.getElementsByTagName("ul")[0].style.display = 'none';
                                v_img = p_parentNode.elementLi.getElementsByTagName("img")[0];
                                v_img.style.visibility = "visible";
                                v_img.src = '../../images/expand.png';
                                v_img.id = 'toggle_on';
                            }
                        }
                        this.drawNode(v_ul, node);
                        this.adjustLines(v_ul, false);
                    }
                }

                if (p_parentNode == undefined) {
                    this.childNodes.push(node);
                    node.parent = this;
                }
                else
                    p_parentNode.childNodes.push(node);

                return node;
            },
            setContexMenu: function (context_Menu) {
                this.contextMenu = context_Menu;
            },
            ///// Render the tree;
            drawTree: function () {
                this.rendered = true;

                var div_tree = document.getElementById(this.div);
                div_tree.innerHTML = '';

                let ulElement = createSimpleElement('ul', this.name, 'tree');
                this.ulElement = ulElement;

                for (var i = 0; i < this.childNodes.length; i++) {
                    this.drawNode(ulElement, this.childNodes[i]);
                }

                // div_tree.appendChild(ulElement);
                div_tree.append(ulElement);

                this.adjustLines(document.getElementById(this.name), true);

            },
            ///// Drawing the node. This function is used when drawing the Tree and should not be called directly;
            // p_ulElement: Reference to the UL tag element where the node should be created;
            // p_node: Reference to the node object;
            drawNode: function (p_ulElement, p_node) {

                let v_tree = this;

                var v_icon = null;

                if (p_node.icon != null)
                    v_icon = createImgElement(null, 'icon_tree', p_node.icon);

                var v_li = document.createElement('li');
                p_node.elementLi = v_li;

                let className = p_node.category === 'root' ? 'root_node' : p_node.isActiveNode ? ('node_selected ' + p_node.nodeType) : ('node ' + p_node.nodeType);
                var v_span = createSimpleElement('span', null, className);

                var v_exp_col = null;

                if (p_node.childNodes.length == 0) {
                    v_exp_col = createImgElement('toggle_off', 'exp_col', '../../images/collapse.png');
                    v_exp_col.style.visibility = "hidden";
                }
                else {
                    if (p_node.expanded) {
                        v_exp_col = createImgElement('toggle_off', 'exp_col', '../../images/collapse.png');
                    }
                    else {
                        v_exp_col = createImgElement('toggle_on', 'exp_col', '../../images/expand.png');
                    }
                }

                v_span.ondblclick = function () {
                    v_tree.doubleClickNode(p_node);
                };

                v_exp_col.onclick = function () {
                    v_tree.toggleNode(p_node);
                };

                v_span.onclick = function () {
                    onClickHandler(p_node.currentContext, p_node.parentIndex, p_node.selectedIndex, p_node.nodeType, p_node, this.selectedNode);
                    // v_tree.selectNode(p_node); 
                };

                v_span.oncontextmenu = function (e) {
                    v_tree.selectNode(p_node);
                    v_tree.nodeContextMenu(e, p_node);
                };

                if (v_icon != undefined)
                    v_span.appendChild(v_icon);

                let v_a = createSimpleElement('a', null, null);
                v_a.innerHTML = p_node.text;
                v_span.appendChild(v_a);
                v_li.appendChild(v_exp_col);
                v_li.appendChild(v_span);

                p_ulElement.appendChild(v_li);

                var v_ul = createSimpleElement('ul', 'ul_' + p_node.id, null);
                v_li.appendChild(v_ul);

                if (p_node.childNodes.length > 0) {

                    if (!p_node.expanded)
                        v_ul.style.display = 'none';

                    for (var i = 0; i < p_node.childNodes.length; i++) {
                        this.drawNode(v_ul, p_node.childNodes[i]);
                    }
                }
            },
            ///// Changing node text
            // p_node: Reference to the node that will have its text updated;
            // p_text: New text;
            setText: function (p_node, p_text) {
                p_node.elementLi.getElementsByTagName('span')[0].lastChild.innerHTML = p_text;
                p_node.text = p_text;
            },
            ///// Setting current context: current node
            setCurrentContext: function (p_node, p_currentContext) {
                p_node.currentContext = p_currentContext;
            },
            ///// Expanding all tree nodes
            expandTree: function () {
                for (var i = 0; i < this.childNodes.length; i++) {
                    if (this.childNodes[i].childNodes.length > 0) {
                        this.expandSubtree(this.childNodes[i]);
                    }
                }
            },
            ///// Expanding all nodes inside the subtree that have parameter 'p_node' as root
            // p_node: Subtree root;
            expandSubtree: function (p_node) {
                this.expandNode(p_node);
                for (var i = 0; i < p_node.childNodes.length; i++) {
                    if (p_node.childNodes[i].childNodes.length > 0) {
                        this.expandSubtree(p_node.childNodes[i]);
                    }
                }
            },
            ///// Collapsing all tree nodes
            collapseTree: function () {
                for (var i = 0; i < this.childNodes.length; i++) {
                    if (this.childNodes[i].childNodes.length > 0) {
                        this.collapseSubtree(this.childNodes[i]);
                    }
                }
            },
            ///// Collapsing all nodes inside the subtree that have parameter 'p_node' as root
            // p_node: Subtree root;
            collapseSubtree: function (p_node) {
                this.collapseNode(p_node);
                for (var i = 0; i < p_node.childNodes.length; i++) {
                    if (p_node.childNodes[i].childNodes.length > 0) {
                        this.collapseSubtree(p_node.childNodes[i]);
                    }
                }
            },
            ///// Expanding node
            // p_node: Reference to the node;
            expandNode: function (p_node) {
                if (p_node.childNodes.length > 0 && p_node.expanded == false) {
                    if (this.nodeBeforeOpenEvent != undefined)
                        this.nodeBeforeOpenEvent(p_node);

                    var img = p_node.elementLi.getElementsByTagName("img")[0];

                    p_node.expanded = true;

                    img.id = "toggle_off";
                    img.src = '../../images/collapse.png';
                    let elem_ul = img.parentElement.getElementsByTagName("ul")[0];
                    elem_ul.style.display = 'block';

                    if (this.nodeAfterOpenEvent != undefined)
                        this.nodeAfterOpenEvent(p_node);
                }
            },
            ///// Collapsing node
            // p_node: Reference to the node;
            collapseNode: function (p_node) {
                if (p_node.childNodes.length > 0 && p_node.expanded == true) {
                    var img = p_node.elementLi.getElementsByTagName("img")[0];

                    p_node.expanded = false;
                    if (this.nodeBeforeCloseEvent != undefined)
                        this.nodeBeforeCloseEvent(p_node);

                    img.id = "toggle_on";
                    img.src = '../../images/expand.png';
                    let elem_ul = img.parentElement.getElementsByTagName("ul")[0];
                    elem_ul.style.display = 'none';

                }
            },
            ///// Toggling node
            // p_node: Reference to the node;
            toggleNode: function (p_node) {
                if (p_node.childNodes.length > 0) {
                    if (p_node.expanded)
                        p_node.collapseNode();
                    else
                        p_node.expandNode();
                }
            },
            ///// Double clicking node
            // p_node: Reference to the node;
            doubleClickNode: function (p_node) {
                this.toggleNode(p_node);
            },
            ///// Selecting node
            // p_node: Reference to the node;
            selectNode: function (p_node) {
                var span = p_node.elementLi.getElementsByTagName("span")[0];
                var rootNodeClass = p_node.category == 'root' ? 'root_node ' : '';
                span.className = rootNodeClass + 'node_selected';
                if (this.selectedNode != null && this.selectedNode != p_node) {
                    this.selectedNode.elementLi.getElementsByTagName("span")[0].className = rootNodeClass + 'node';
                }
                this.selectedNode = p_node;
            },
            ///// Deleting node
            // p_node: Reference to the node;
            removeNode: function (p_node) {
                var index = p_node.parent.childNodes.indexOf(p_node);

                if (p_node.elementLi.className == "last" && index != 0) {
                    p_node.parent.childNodes[index - 1].elementLi.className += "last";
                    p_node.parent.childNodes[index - 1].elementLi.style.backgroundColor = this.backcolor;
                }

                p_node.elementLi.parentNode.removeChild(p_node.elementLi);
                p_node.parent.childNodes.splice(index, 1);

                if (p_node.parent.childNodes.length == 0) {
                    var v_img = p_node.parent.elementLi.getElementsByTagName("img")[0];
                    v_img.style.visibility = "hidden";
                }

            },
            ///// Deleting all node children
            // p_node: Reference to the node;
            removeChildNodes: function (p_node) {

                // if (p_node.childNodes.length > 0) {
                //     var v_ul = p_node.elementLi.getElementsByTagName("ul")[0];

                //     var v_img = p_node.elementLi.getElementsByTagName("img")[0];
                //     v_img.style.visibility = "hidden";

                //     p_node.childNodes = [];
                //     v_ul.innerHTML = "";
                // }

                // if (p_node.childNodes.length > 0) {
                var v_ul = p_node.elementLi.getElementsByTagName("ul")[0];

                var v_img = p_node.elementLi.getElementsByTagName("img")[0];
                v_img.style.visibility = "hidden";

                // p_node.childNodes = [];
                v_ul.innerHTML = "";
                var x = document.querySelectorAll("ul.menu");
                // Set the background color of the first <p> element with class="example" (index 0)
                x.forEach((item, index) => {
                    item.style.display = "none";
                })

                // ele.style.visibility = 'hidden';
                // }
            },
            ///// Rendering context menu when mouse right button is pressed over a node. This function should no be called directly
            // p_event: Event triggered when right clicking;
            // p_node: Reference to the node;
            nodeContextMenu: function (p_event, p_node) {
                if (p_event.button == 2) {
                    p_event.preventDefault();
                    p_event.stopPropagation();

                    if (p_node.contextMenu != undefined) {

                        let v_tree = this;

                        var v_menu = this.contextMenu[p_node.contextMenu];

                        var v_div;
                        if (this.contextMenuDiv == null) {
                            v_div = createSimpleElement('ul', 'ul_cm', 'menu');
                            document.body.appendChild(v_div);
                        }
                        else
                            v_div = this.contextMenuDiv;

                        v_div.innerHTML = '';

                        var v_left = p_event.pageX - 5;
                        var v_right = p_event.pageY - 5;

                        v_div.style.display = 'block';
                        v_div.style.position = 'absolute';
                        v_div.style.left = v_left + 'px';
                        v_div.style.top = v_right + 'px';

                        for (var i = 0; i < v_menu.elements.length; i++) (function (i) {

                            var v_li = createSimpleElement('li', null, null);

                            var v_span = createSimpleElement('span', null, null);
                            v_span.onclick = function () { v_menu.elements[i].action(p_node) };

                            var v_a = createSimpleElement('a', null, null);
                            var v_ul = createSimpleElement('ul', null, 'sub-menu');

                            v_a.appendChild(document.createTextNode(v_menu.elements[i].text));

                            v_li.appendChild(v_span);

                            if (v_menu.elements[i].icon != undefined) {
                                var v_img = createImgElement('null', 'null', v_menu.elements[i].icon);
                                v_li.appendChild(v_img);
                            }

                            v_li.appendChild(v_a);
                            v_li.appendChild(v_ul);
                            v_div.appendChild(v_li);

                            if (v_menu.elements[i].submenu != undefined) {
                                var v_span_more = createSimpleElement('div', null, null);
                                v_span_more.appendChild(createImgElement(null, 'menu_img', '../../images/right.png'));
                                v_li.appendChild(v_span_more);
                                v_tree.contextMenuLi(v_menu.elements[i].submenu, v_ul, p_node);
                            }

                        })(i);

                        this.contextMenuDiv = v_div;

                        document.getElementById("style-3").addEventListener("scroll", destroyContextMenu, { once: true });
                    }
                }
            },
            ///// Recursive function called when rendering context menu submenus. This function should no be called directly
            // p_submenu: Reference to the submenu object;
            // p_ul: Reference to the UL tag;
            // p_node: Reference to the node;
            contextMenuLi: function (p_submenu, p_ul, p_node) {

                let v_tree = this;

                for (var i = 0; i < p_submenu.elements.length; i++) (function (i) {

                    var v_li = createSimpleElement('li', null, null);

                    var v_span = createSimpleElement('span', null, null);
                    v_span.onclick = function () { p_submenu.elements[i].action(p_node) };

                    var v_a = createSimpleElement('a', null, null);
                    var v_ul = createSimpleElement('ul', null, 'sub-menu');

                    v_a.appendChild(document.createTextNode(p_submenu.elements[i].text));

                    v_li.appendChild(v_span);

                    if (p_submenu.elements[i].icon != undefined) {
                        var v_img = createImgElement('null', 'null', p_submenu.elements[i].icon);
                        v_li.appendChild(v_img);
                    }

                    v_li.appendChild(v_a);
                    v_li.appendChild(v_ul);
                    p_ul.appendChild(v_li);

                    if (p_submenu.elements[i].p_submenu != undefined) {
                        var v_span_more = createSimpleElement('div', null, null);
                        v_span_more.appendChild(createImgElement(null, 'menu_img', '../../images/right.png'));
                        v_li.appendChild(v_span_more);
                        v_tree.contextMenuLi(p_submenu.elements[i].p_submenu, v_ul, p_node);
                    }

                })(i);
            },
            ///// Adjusting tree dotted lines. This function should not be called directly
            // p_node: Reference to the node;
            adjustLines: function (p_ul, p_recursive) {
                var tree = p_ul;

                var lists = [];

                if (tree.childNodes.length > 0) {
                    lists = [tree];

                    if (p_recursive) {
                        for (var i = 0; i < tree.getElementsByTagName("ul").length; i++) {
                            var check_ul = tree.getElementsByTagName("ul")[i];
                            if (check_ul.childNodes.length != 0)
                                lists[lists.length] = check_ul;
                        }
                    }

                }

                for (var i = 0; i < lists.length; i++) {
                    var item = lists[i].lastChild;

                    while (!item.tagName || item.tagName.toLowerCase() != "li") {
                        item = item.previousSibling;
                    }

                    item.className += "last";
                    item.style.backgroundColor = this.backcolor;

                    item = item.previousSibling;

                    if (item != null)
                        if (item.tagName.toLowerCase() == "li") {
                            item.className = "";
                            item.style.backgroundColor = 'transparent';
                        }
                }
            }
        }

        window.onclick = function () {
            if (tree.contextMenuDiv != null)
                tree.contextMenuDiv.style.display = 'none';
        }

        return tree;
    }
}

// Helper Functions

//Create a HTML element specified by parameter 'p_type'
function createSimpleElement(p_type, p_id, p_class) {
    let element = document.createElement(p_type);
    if (p_id != undefined)
        element.id = p_id;
    if (p_class != undefined)
        element.className = p_class;
    return element;
}

//Create img element
function createImgElement(p_id, p_class, p_src) {
    let element = document.createElement('img');
    if (p_id != undefined)
        element.id = p_id;
    if (p_class != undefined)
        element.className = p_class;
    if (p_src != undefined)
        element.src = p_src;
    return element;
}
