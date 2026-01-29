class AnimationManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.eventBus.on(EVENTS.ANIMATION.START, ({count, time, indexes, matrix})=>{
             return this.start(count, time, indexes, matrix);
        })
    }
    start(count, time, indexes, matrix){
        let cnt = count;
        this.matrixForAnimation = matrix;
        this.blinkedLineIndexes = indexes;
        return new Promise((resolve) => {
            this.eventBus.emit(EVENTS.RENDER.SET_MODE, {mode:"animation"});
            const recursion = ()=>{
                this.animation(cnt);
                cnt--;
                if(cnt === 0){
                    this.eventBus.emit(EVENTS.RENDER.SET_MODE, {mode:"game"})
                    return resolve();
                }
                setTimeout(recursion, time)
            }
            setTimeout(recursion, time);
        })

    }
    animation(cnt){
        this.eventBus.emit(EVENTS.RENDER.ANIMATION_STEP, {
            matrix: this.matrixForAnimation,
            indexes: this.blinkedLineIndexes,
            count: cnt
        });
    }
}


