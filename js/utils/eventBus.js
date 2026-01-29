class EventBus{
    constructor(){
        this.listeners = {}
    }
    on(eventName, callback){
        if(!this.listeners[eventName]){
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
        return ()=>{
            this.off(eventName, callback);
        }
    }
    emit(eventName, data){
        if(!this.listeners[eventName]){
            return;
        }
        const listenersCopy = [...this.listeners[eventName]];
        //console.log(`[EVENTBUS] --- Начало emit для: ${eventName}. Слушателей в копии: ${listenersCopy.length} ---`);

        listenersCopy.forEach((callback, index)=>{
            // Пытаемся получить имя функции (для именованных функций и привязанных методов)
            // Bound-функции часто не имеют имени, но мы попытаемся
            const callbackName = callback.name || 'Анонимная функция/Привязанный метод';

           // console.log(`[EVENTBUS] -> Вызываем слушателя ${index + 1}: ${callbackName} для события: ${eventName}`);

            // 🛑 Здесь происходит фактический вызов колбэка
            callback(data);
        });

        //console.log(`[EVENTBUS] --- Завершение emit для: ${eventName} ---`);
    }
    async emitAsync(eventName, data){
        if(!this.listeners[eventName]){
            return Promise.resolve();
        }
        const callBackPromises = this.listeners[eventName].map((callback)=>{
            return Promise.resolve(callback(data));
        })
        await Promise.all(callBackPromises);
    }
    /*off(eventName, callback){
        if(!this.listeners[eventName]){
            return;
        }
        this.listeners[eventName] = this.listeners[eventName].filter(listener => listener !== callback);
    }*/
    off(eventName, callback){
        if(!this.listeners[eventName]){
            return;
        }

        // 1. Находим индекс нужного обработчика
        const listeners = this.listeners[eventName];
        const index = listeners.findIndex(listener => listener === callback);

        // 2. Если нашли, удаляем его на месте (splice)
        if (index > -1) {
            listeners.splice(index, 1);
        }

        // Опционально: очистить пустой массив для чистоты
        if (listeners.length === 0) {
            delete this.listeners[eventName];
        }
    }
}