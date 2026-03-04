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
            BLEEDING:BleedingEffect,
            PURITY:PurityEffect,
            NATURE_POWER:NaturePowerEffect,
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
    constructor({id, name, type, sprite, target, power, duration, extension, iconIndex}){
        this.id = id;
        this.target = target;
        this.name = name;
        this.type = type;
        this.power = power;
        this.duration = duration;
        this.extension = extension;
        this.sprite = sprite;
        this.iconIndex = iconIndex;
    }
    tick(){
        this.duration--;
    }
    onApply(){
        this.target.eventBus.emit(EVENTS.BATTLE.FLOATING_TEXT, {
            target:this.target,
            value:this.name,
            type:"APPLY",
        })
        const logData = logMessages.battle.effect.onApply(this.target.name, this.name, this.duration);
        this.target._log(logData.message, logData.type);

    }
    onRemove(isSlient = false){
        this.target.eventBus.emit(EVENTS.BATTLE.FLOATING_TEXT, {
            target:this.target,
            value:this.name,
            type:"REMOVE",
        })
        if(isSlient) return
        const logData = logMessages.battle.effect.onRemove(this.target.name, this.name);
        this.target._log(logData.message, logData.type);
    }
}
class BurnEffect extends StatusEffect{
    constructor({id, name, type, sprite, target, power, duration, extension, iconIndex}) {
        super({id, name, type, sprite, target, power, duration, extension, iconIndex});
    }
    tick() {
        super.tick();
        const context = {
            type:"EFFECT",
            name:this.name,
            caster:this.target,
        }
        this.target.takeDamage(this.power, context);
    }
}

class BleedingEffect extends StatusEffect{
    constructor({id, name, type, sprite, target, power, duration, extension, iconIndex}) {
        super({id, name, type, sprite, target, power, duration, extension, iconIndex});
    }
    tick() {
        super.tick();
        const context = {
            type:"EFFECT",
            name:this.name,
            caster:this.target,
        }
        this.target.takeDamage(this.power, context);
    }
}

class HealEffect extends StatusEffect{
    constructor({id, name, type, sprite, target, power, duration, extension, iconIndex}) {
        super({id, name, type, sprite, target, power, duration, extension, iconIndex});
    }
    tick() {
        super.tick();
        const context = {
            type:"EFFECT",
            name:this.name,
            caster:this.target,
        }
        this.target.heal(this.power, context);
    }
}

class ShieldEffect extends StatusEffect{
    constructor({id, name, type, sprite, target, power, duration, extension, iconIndex}) {
        super({id, name, type, sprite, target, power, duration, extension, iconIndex});
    }
    onApply() {
       this.target.stats.def += this.power;
       //if(this.power > 0) this.target._log(`Защита ${this.target.name} увеличена на ${this.power}`,`effect`);
       super.onApply();
    }
    onRemove(isSlient = false) {
        this.target.stats.def -= this.power;
        super.onRemove();
    }
}

class PurityEffect extends StatusEffect{
    constructor({id, name, type, sprite, target, power, duration, extension, iconIndex}) {
        super({id, name, type, sprite, target, power, duration, extension, iconIndex});
    }
    onApply() {
        this.target.stats.immunityToDebuffs = true;
        super.onApply();
    }
    onRemove(isSlient = false) {
        this.target.stats.immunityToDebuffs = false;
        super.onRemove(isSlient);
    }
}

class NaturePowerEffect extends StatusEffect{
    constructor({id, name, type, sprite, target, power, duration, extension, iconIndex}) {
        super({id, name, type, sprite, target, power, duration, extension, iconIndex});
    }
    onApply() {
        this.target.stats.naturePower = true;
        super.onApply();
    }
    onRemove(isSlient = false) {
        this.target.stats.naturePower = false;
        super.onRemove(isSlient);
    }
}