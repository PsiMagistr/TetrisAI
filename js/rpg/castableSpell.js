class CastableSpell{
    constructor(config){
        this.id = config.id;
        this.name = config.name;
        this.type = config.type;
        this.icon = config.icon;
        this.totalCost = config.totalCost;
        this.power = config.power;
        this.effect = config.effect;
        this.isValid = config.isValid;
        this.modifiers = config.modifiers; //Добавил модификаторы
        this.modifiersState = config.modifiersState;
        this.animationChain = config.animationChain;
        console.log("CastableSpell constructor");
    }
    getDescription(){
        let desc = `${this.name}: Сила ${this.power}`;
        if(this.effect){
            desc += `+ ${this.effect.id} (${this.effect.duration})`;
        }
        return desc;
    }
}