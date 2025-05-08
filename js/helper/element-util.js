
export default class ElementUtils { 


    prepareParentElement( parentEle, className, content){
        
        const elementDiv = document.createElement("div");
        elementDiv.innerHTML = content ? content : "";
        elementDiv.setAttribute("style", "color: #333333; margin-bottom: 10px;")
        className && elementDiv.classList.add( className);
        parentEle && parentEle.appendChild( elementDiv);
        
        return elementDiv;
    }

     createLabelWithElement(parentEle, attr, innerHTML) {
        let lbl = document.createElement('label');
        this.setAttributes(lbl, attr);
        lbl.innerHTML = innerHTML;
        parentEle.appendChild(lbl);
        return lbl;
    }

    createDropdownWithElement(parentEle, attr, options, onChangeEvent){
        let dropdown = document.createElement('SELECT');
        this.setAttributes(dropdown, attr);

        for(var key in options) {        
            let option = document.createElement('OPTION');
            option.innerHTML = options[key];
            dropdown.appendChild(option);            
        }

        this.registerEvents(dropdown, { "change" : onChangeEvent.bind(this)});
        parentEle.appendChild(dropdown);

        return dropdown;
    }

    createInputWithElement(parentEle, attr, value, onChangeEvent, eventType) {
        eventType = eventType != undefined ? eventType : "change"
        let input = document.createElement('INPUT');
        this.setAttributes(input, attr);
        input.value = value;
        onChangeEvent && this.registerEvents(input, { [eventType] : onChangeEvent.bind(this)});
        parentEle.appendChild(input);
        return input;
    }

    setAttributes(el, arrAttrs) {
        if (el != null && el != 'undefined') {
            for (var key in arrAttrs) {
                el.setAttribute(key, arrAttrs[key]);
            }
        }
    }

    registerEvents(el, arrEvents) {
        for (var key in arrEvents) {
          el.addEventListener(key, arrEvents[key]);
        }
      }

      createButton(parentId, attr, innerHtml, events) {
        let btn = document.createElement('button');
        this.setAttributes(btn, attr);
        this.registerEvents(btn, events);
        btn.innerHTML = innerHtml;
        document.getElementById(parentId).appendChild(btn);

    }

    createLabel(parentId, attr, innerHTML) {
        let lbl = document.createElement('label');
        this.setAttributes(lbl, attr);
        lbl.innerHTML = innerHTML;
        document.getElementById(parentId).appendChild(lbl);
        return lbl;
    }

}