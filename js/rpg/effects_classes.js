/*
* 
* id
* name
* duration
* power
* target
* type
* */

class EffectFactory{
    constructor(){}
    create(config, sprite, caster, target){
        const effectsList = {
            BURN:BurnEffect,
            REGEN:HealEffect,
        }
        const EffectClass = effectsList[config.id];
        if(!EffectClass) throw new Error("EffectClass not found");
            const params = {
                id: config.id,
                name:config.name,
                type:config.type,
                power:config.power,
                duration:config.duration,
                target:config.target == "SELF"?caster:target,
                extension:config.extension || false,
                iconIndex:config.iconIndex,
                sprite:sprite || null,
            }
            return new EffectClass(params);
    }
}

class StatusEffect{
    constructor({id, name, sprite, target, power, duration, extension, iconIndex}){
        this.id = id;
        this.target = target;
        this.name = name;
        this.power = power;
        this.duration = duration;
        this.extension = extension;
        this.sprite = sprite;
        this.iconIndex = iconIndex;
    }
    tick(){
        this.duration--;
        const message = `Эффект ${this.name} будет применен на ${this.target.name}. Осталось: ${this.duration} ход(а).`;
        this.target._log(message, `effect`);
    }
    onApply(){

    }
    onRemove(){

    }
}
class BurnEffect extends StatusEffect{
    constructor({id, name, sprite, target, power, duration, extension, iconIndex}) {
        super({id, name, sprite, target, power, duration, extension, iconIndex});
    }
    tick() {
        super.tick();
        this.target.takeDamage(this.power);
    }
}

class HealEffect extends StatusEffect{
    constructor({id, name, sprite, target, power, duration, extension, iconIndex}) {
        super({id, name, sprite, target, power, duration, extension, iconIndex});
    }
    tick() {
        super.tick();
        const heal = this.target.heal(this.power);
    }
}

