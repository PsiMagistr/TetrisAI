class Unit extends Subscriber{
    constructor(eventBus, config) {
        super(eventBus);
        if(!config){
            throw new Error("Unit creation failed: Config is required");
        }
        if (!config.avatar || !config.avatar.sprite) {
            throw new Error(`Unit "${config.name || 'Unknown'}" missing avatar or sprite`);
        }
        this.id = crypto.randomUUID();
        this.name = config.name || "Unit";
        this.maxHp = config.maxHp || 100;
        this.currentHp = config.currentHp ?? this.maxHp;
        this.maxMp = config.maxMp || 100;
        this.currentMp = config.currentMp ?? this.maxMp;
        this.stats = config.stats || { atk: 10, def: 0 };
        this.avatar = config.avatar;
        this.spellList = config.spellList || [];
        this.isDead = false;
        this.activeEffects = [];
        this.type = config.type;
    }
    takeDamage(damage){
        const actualDamage = Math.max(0, damage - this.stats.def);
        this.currentHp = clamp(this.currentHp - actualDamage, 0,this.maxHp);
        if(this.currentHp == 0){
            this.isDead = true;
        }
        this._log(`${this.name} атакован(а) на ${actualDamage} урона.`, "player-attack");
        return actualDamage;
    }
    spendMp(amount){
        this.currentMp = clamp(this.currentMp - amount, 0, this.maxMp);
    }
    heal(amount){
        const startHp = this.currentHp;
        this.currentHp = clamp(this.currentHp + amount, 0, this.maxHp);
        return this.currentHp - startHp;
    }
    addEffect(effectData){
        const existing = this.activeEffects.find(effect => effect.id === effectData.id);
        if(!existing){
            this.activeEffects.push({...effectData});
        }
    }
    processActiveEffects(){
        const effectExecuters = {
            HEAL:(effect)=>{
                const actualHeal = this.heal(effect.power);
                const message = `На игроке ${this.name} эффект ${effect.name} на ${actualHeal} ед.`;
                this._log("system", message);
            },
            BURN:(effect)=>{
                const actualDamage = this.takeDamage(effect.power);
                const message = `На игроке ${this.name} эффект ${effect.name} на ${actualDamage}`;
                this._log("system", message);
            }
        }
        if(this.activeEffects.length == 0) return
            this.activeEffects.forEach((effect)=>{
                if(effect.duration > 0){
                    if(effectExecuters[effect.id]){
                        effectExecuters[effect.id](effect);
                    }
                    effect.duration--;
                }
            });
        this.activeEffects = this.activeEffects.filter((effect)=>effect.duration > 0);
    }
    _log(message, type){
        this.eventBus.emit(EVENTS.UI.ADD_LOG, {type, message});
    }
}

class Hero extends Unit{
    constructor(eventBus, config) {
        super(eventBus, config);
        this.resources = config.resources || null;
    }
}



