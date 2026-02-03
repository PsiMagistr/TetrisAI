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
    }
}
class BurnEffect extends StatusEffect{
    constructor({id, name, target, power, duration}) {
        super({id, name, target, power, duration});
    }
    tick() {
        const actualDamage = this.target.takeDamage(this.power);
        const message = `На игроке ${this.target.name} эффект ${this.name} на ${actualDamage}`;
        this.target._log(message, "enemy-action");
        super.tick();
    }
}