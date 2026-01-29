class BaseUi extends Subscriber{
    constructor(eventBus, rootSelector = document){
        super(eventBus);
        this.root =  typeof rootSelector === "string"?
            document.querySelector(rootSelector):rootSelector;
       if(!this.root) console.error(`BaseUi: No root element found ${rootSelector}`);
       console.log(`BaseUi: Root element found ${rootSelector}`);
    }
    getElementsBySelectors(objSelectors, context = this.root){
        const result = {};
        let currentContext = context;
        if(typeof objSelectors.elem === "string"){
            result.elem = currentContext.querySelector(objSelectors.elem);
            if(result.elem instanceof Element){
                currentContext = result.elem
            }
            else{
                throw new Error(`CRITICAL UI ERROR: Не удалось найти контейнер по селектору ${objSelectors.elem} внутри контекста ${context}`);
            }
        }
        for(let key in objSelectors){
            if(key === "elem" && typeof objSelectors.elem === "string"){
                continue;
            }
            const value = objSelectors[key];
            if(typeof value === 'string'){
                result[key] = currentContext.querySelector(value);
            }
            else if(typeof value === 'object' && value !== null){
                result[key] = this.getElementsBySelectors(value, currentContext);
            }
            else{
                result[key] = value;
            }
        }
        return result;
    }
    show() { this.root.classList.remove('hidden'); }
    hide() { this.root.classList.add('hidden'); }
}