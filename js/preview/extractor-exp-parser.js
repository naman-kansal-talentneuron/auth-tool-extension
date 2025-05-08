import MetaData from "../config/meta-data.js";

export default class ExtractorExpParser {


    VARIABLE_REGEX_PATTERN = /\$\[.*?\]/g;
    nodeData = [];
    validHParamsList = {};

    getExpressionVariables(parentNode, child, extractorList) {

        extractorList = [];
        this.validHParamsList = {};

        //Get the Nodes as Hierachy
        let isExists = this._getMatchedExtractorFields(parentNode, child, extractorList);
        if (!isExists) {
            // Field not found in current harvester. Continue with other harvester
            return null;
        }

        //Sort to make group at end and fields to starting
        extractorList = extractorList.sort(function (x, y) {
            if (x.isgroup === y.isgroup) {
                return 1;
            }
            if (x.isgroup) {
                return 1;
            }
            return -1;
        });

        //Parse the Nodes and set its dependent variables Nodes for processing
        this._parseNodes(extractorList);
        console.log(this.nodeData[child.fieldName]);

        //Align the Variable Nodes in Order of Execution
        let expParams = this._fetchVariables(this.nodeData[child.fieldName]);
        return expParams;
    }


    _fetchVariables(nodes) {

        let expParams = { variables : [], hParams : []};

        if (nodes.variables) {
            for (const [key, value] of Object.entries(nodes.variables)) {
                if (value.variables) {
                    let tmpExpParams = this._fetchVariables(value)
                    if( tmpExpParams.variables && tmpExpParams.variables.length){
                        expParams.variables.push(...tmpExpParams.variables);
                    }
                    if( tmpExpParams.hParams && tmpExpParams.hParams.length){
                        expParams.hParams.push(...tmpExpParams.hParams);
                    }

                } else {
                    expParams.variables.push(value);
                }                
            }
        }

        if (Array.isArray(nodes)) {
            for (const [key, value] of Object.entries(nodes)) {

                if (value.variables) {
                    this._fetchVariables(value);
                    value.variables = null;
                }

                if( value.hParams && value.hParams.length ){
                    expParams.hParams(value.hParams);
                }
                expParams.variables.push(value);
            }
        } else {
            expParams.variables.push(nodes);

            if( nodes.hParams && nodes.hParams.length ){
                expParams.hParams.push(nodes.hParams);
            }
        }

        return expParams;
    }

    _parseNodes(extractorList) {

        for (let field of extractorList) {
            if (!field.isgroup) {
                this.nodeData[field.fieldName] = this._getFieldWithExpNodes(field);
            } else {
                this._parseNodes(field.fields);
            }
        }
    }

    _getFieldWithExpNodes(field) {


        if (field.fieldMode != "expn" && field.fieldMode != "expn.xpath") {
            return field;
        }

        let expProcessed = field.fieldValue;
        let matchVariables = expProcessed.match(this.VARIABLE_REGEX_PATTERN);
        let expNodes = [];
        let hParams = [];
        if (matchVariables && matchVariables.length) {
            for (let evariable of matchVariables) {
                let extractorVName = '$' + evariable.substring(3, evariable.length - 2);
                if (extractorVName.includes("hparam")) {
                    hParams.push(extractorVName);
                } else if (this.nodeData[extractorVName] != null) {
                    expNodes[extractorVName] = this.nodeData[extractorVName];
                } else {
                    let errorMsg = `Expression ${expProcessed} processing failed. Variable : ${extractorVName} provided inside the node : ${field.fieldName} not found`;
                    throw errorMsg
                }
            }

            field.variables = expNodes;
            field.hParams = hParams;
        }

        return field;
    }

    _getMatchedExtractorFields(parent, child, matchedExtractors) {

        if (parent == child) {
            true;
        }

        if (matchedExtractors == null) {
            matchedExtractors = [];
        }

        let extractorFields = null;
        let selectorDefaultValue = "";
        let isExists = false;

        if (parent.isgroup && parent.fields && parent.fields.length) {
            extractorFields = parent.fields;
            selectorDefaultValue = this._getParentSelectorFieldValue(parent.fields);
        } else if (Array.isArray(parent)) {
            extractorFields = parent;
        }
        else {
            return isExists;
        }

        let tmpExtractorFields = [];
        extractorFields.forEach(field => {

            if (isExists) {
                return false;
            }

            if (this._isEqual(field, child)) {                
                isExists = true;
            } else {
                isExists = this._getMatchedExtractorFields(field, child, matchedExtractors);
            }

            if (!field.isgroup) {
                field.parent = parent;

                //Append __Selector Value into Field Value
                if (field.fieldName.toLowerCase() != "__selector") {
                    field.fieldValue = this._getFieldValueWithSelectorValue(selectorDefaultValue, field);
                }

                //Set Max No.Of Record for Evalution selected on __Sector itration
                field.noOfRecord = 1;
                if (selectorDefaultValue === "") {
                    field.noOfRecord = 10;
                }

                tmpExtractorFields.push(field);
            }

            if (isExists) {
                console.log(field.fieldName);
                if (parent.isgroup) {
                    matchedExtractors.push({ isgroup: true, fieldName: parent.fieldName, fields: tmpExtractorFields });
                }
                else {
                    matchedExtractors.push(...tmpExtractorFields);
                }
            }
        });

        return isExists;
    }

    _isEqual(field1, field2) {

        if (field1 && field2
            && field1.fieldName === field2.fieldName
            && field1.fieldMode === field2.fieldMode
            && field1.fieldValue === field2.fieldValue
            && field1.index === field2.index) {
            return true;
        }

        return false;
    }
  // Added xmlxpath for evaluating parent selector field
    _getParentSelectorFieldValue(extractorFields) {

        let xPathSelectorValue = "";

        if (!Array.isArray(extractorFields)) {
            return xPathSelectorValue;
        }

        if (extractorFields && extractorFields.length) {
            let selectorFields = extractorFields.filter(field => field.fieldName.toLowerCase() === "__selector"
                && ([...MetaData.XPATH_SELECTOR_FAMILY, "xpath.innerhtml"].includes(field.fieldMode)));
            if (selectorFields && selectorFields.length) {
                xPathSelectorValue = selectorFields[0].fieldValue;
            }
        }

        return xPathSelectorValue;

    }

    _getFieldValueWithSelectorValue(selectorValue, field) {


        let value = field.fieldValue;

        //EXPN AND EXPN CSS
        if (field.fieldMode == "expn" || field.fieldMode == "expn.css") {
            return field.fieldValue;
        }

        //Expn XPATH
        if (field.fieldMode == "expn.xpath") {
            //Append _selector value only if it has value
            if (selectorValue != "") {
                let xpathvalues = value.split('normalize-space(');
                if (xpathvalues.length == 2) {
                    value = 'normalize-space(' + selectorValue + xpathvalues[1].trim();
                }
            }
            return value;
        }
 
        //OTHERS
        //Added xmlxpath for evaluating firldselectorvalue
        let mode = '';
        if (MetaData.XPATH_SELECTOR_FAMILY.includes(field.fieldMode)) {
            if (value.includes("|")) {
                value = value.split('|').map((v) => {
                    return selectorValue + v
                }).join('|')
            } else {
                value = selectorValue + value;
            }
        }
        else if (field.fieldMode == 'xpath.innerhtml') {
            //Set Annotation xPath Value relative to __selector extractor value
            value = selectorValue + value;
        }

        return value;
    }

}