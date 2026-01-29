function inArray(x, y, array){
    return x >= 0 && x < array[0].length && y >= 0 && y < array.length;
}

function clamp(value, min, max){
     return Math.max(min, Math.min(max, value));
}

class Subscriber{
    constructor(eventBus){
        this.eventBus = eventBus;
        this.unsubscribers = new Map();
    }
    eventOn(eventName, callback, key = Symbol()){
        const unsubscriber = this.eventBus.on(eventName, callback);
        this.unsubscribers.set(key, unsubscriber);
    }
    offByKey(key){
        const unsubscriber =  this.unsubscribers.get(key);
        if(unsubscriber){
            unsubscriber();
            this.unsubscribers.delete(key);
        }
    }
    dispose(){
        this.unsubscribers.forEach((unsubscriber) => unsubscriber());
        this.unsubscribers.clear();
    }
}