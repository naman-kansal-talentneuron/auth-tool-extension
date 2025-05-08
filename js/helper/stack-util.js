export default class StackUtil {

    //Stack List
    _stack = [];
    //To avoid duplicate push
    _previousnode = null;
    //To Identify whether Pushed is done after Pop Action
    _isPushed = false;
    //To Identify whether Stack reached Top element or not
    _isTop = false;
    
    constructor() {}

    // Takes any node as input that to be pushed into the stack.
    push(node){
        
        let nodeAsJson = JSON.stringify(node);
        if( this._stack.length && nodeAsJson == this._stack[this._stack.length]){
            console.log( 'skip last available node same as incoming node')
            return;
        }
        
        
        if( this._previousnode != nodeAsJson){
            this._stack.push( nodeAsJson);
            this._previousnode =  nodeAsJson;   
            this._isPushed = true;         
        }
        this._isTop = false;
    }

    // Removes the most recent node and returns it.
    pop(){

        //Retain Orginal Node from Pop
        if( this._stack.length == 1){
            this._isTop = true;
            return JSON.parse(this._stack[0]);
        }

        //Pop out last node incase if first pop after push
        if( this._isPushed && this._stack.length > 1){
            this._stack.pop();
        }

        this._isTop = false;
        this._isPushed = false;
                
        return JSON.parse(this._stack.pop());
    }

    // Returns the entire stack.
    length(){
        //Length should be 0 if stack reached orginal state
        return this._isTop ? 0 : this._stack.length;
    }

}