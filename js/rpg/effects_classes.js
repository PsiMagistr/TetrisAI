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
    create(config, caster, target){
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
            }
            return new EffectClass(params);
    }
}

class StatusEffect{
    constructor({id, name, target, power, duration}){
        this.id = id;
        this.target = target;
        this.name = name;
        this.power = power;
        this.duration = duration;
    }
    tick(){
        this.duration--;
        const message = `Эффект ${this.name} будет применен на ${this.target.name}. Осталось: ${this.duration} ход(а).`;
        this.target._log(message, `effect`);
    }
}
class BurnEffect extends StatusEffect{
    constructor({id, name, target, power, duration}) {
        super({id, name, target, power, duration});
    }
    tick() {
        super.tick();
        this.target.takeDamage(this.power);

    }
}

class HealEffect extends StatusEffect{
    constructor({id, name, target, power, duration}) {
        super({id, name, target, power, duration});
    }
    tick() {
        super.tick();
        const heal = this.target.heal(this.power);
    }
}

