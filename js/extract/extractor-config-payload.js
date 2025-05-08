import Utils from "../utils.js";

export default class ExtractorConfigPayload {

    static getExtractorFileObject(document, documentTypeName) {

        let obj = ExtractorConfigPayload.getExtractorObject(document.documentDetails);

        switch (documentTypeName) {
            case 'job':
                return { job: obj };
            case 'listing':
                return { listing: obj };
            default:
                return { [documentTypeName] : obj }

        }
    }

    static getExtractorObject(fieldArr) {

        let obj = {};

        fieldArr.forEach(item => {

            let extractorName = item.fieldName;

            if (item.isgroup) {

                obj[extractorName] = ExtractorConfigPayload.getExtractorObject(item.fields)

            }
            else {
                obj[item.fieldName] = { value: item.fieldValue, mode: item.fieldMode }
            }
        })

        return obj;
    }

}