export default class Harvestor {

    constructor (source, proxy, type, startUrl, payload, params, prepareNodes, options,settings) {
        this.source = source;
        this.proxy = proxy;
        this.type = type;
        this.startUrl = startUrl;
        this.payload = payload;
        this.params = params;
        this.prepare = prepareNodes;       
        this.options = options; 
        this.settings = settings;
    }
    
}