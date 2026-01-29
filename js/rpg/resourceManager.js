const RESOURCES_MAP = {
    1:{"key":"T"},
    2:{"key":"L"},
    3:{"key":"J"},
    4:{"key":"I"},
    5:{"key":"Z"},
    6:{"key":"S"},
    7:{"key":"O"}
}
class ResourceManager extends Subscriber{
    constructor(eventBus) {
        super(eventBus);
        this.resources = {
            T:{
                label:"Атака (T)",
                value:0,
            },
            L:{
                label:"Поглощение (L)",
                value:0,
            },
            O:{
                label:"Лечение (O)",
                value:0,
            },
            J:{
                label:"Масштаб (J)",
                value:0,
            },
            S:{
                label:"Бафф (S)",
                value:0,
            },
            Z:{
                label:"Дебафф (Z)",
                value:0,
            },
            I:{
                label:"Скорость (I)",
                value:0,
            },
        }
        this.resourceRate = 10;
        this.eventOn(EVENTS.GAME.START, this.reset.bind(this));
        this.eventOn(EVENTS.RESOURCES.CALCULATE, this.handleCalculateResources.bind(this));
        this.eventOn(EVENTS.GAME.RESET, this.reset.bind(this));
        this.eventBus.emit(EVENTS.RESOURCES.UPDATE, this.resources);
    }
    calculateAndAddResources(clearedCellColors){
        const gainedBlocks = {}
        for(let colorIndex of clearedCellColors){
           if(colorIndex > 0){
               let key = RESOURCES_MAP[colorIndex].key;
               gainedBlocks[key] = (gainedBlocks[key] || 0)+1;
           }
        }
        for(const key in gainedBlocks){
            const resourceAmount = gainedBlocks[key] * this.resourceRate;
            this.resources[key].value  += resourceAmount;
        }
    }
    getResources(){
        return this.resources;
    }
    reset(){
        for(let key in this.resources){
            this.resources[key].value = 0;
        }
        this.eventBus.emit(EVENTS.RESOURCES.UPDATE, this.resources);
    }
    handleCalculateResources({clearedCellColors}){
        this.calculateAndAddResources(clearedCellColors);
        this.eventBus.emit(EVENTS.RESOURCES.UPDATE, this.resources);
    }
    spendResources(costResources){
        for(let key in costResources){
            this.resources[key].value -= costResources[key];
            if(this.resources[key].value < 0){
                this.resources[key].value = 0;
            }
        }
    }
}