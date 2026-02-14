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
        this._log(`${this.name} исцелен(а) на ${amount} единиц.`, "heal");
        return this.currentHp - startHp;
    }
    addEffect(effect){
       const activeEffect = this.activeEffects.find(currenTEffect => currenTEffect.id === effect.id);
       let message = "";
       if(activeEffect){
           if(effect.extension){
               activeEffect.duration = effect.duration;
               message = `Эффект ${activeEffect.name} обновлен. Длительность ${activeEffect.duration} ход(а).`;
           }
           else{
               message = `Эффект ${activeEffect.name} не может быть продлен. Длительность ${activeEffect.duration} ход(а).`;
           }
       }
       else{
           this.activeEffects.push(effect);
           effect.onApply();
           message = `Эффект ${effect.name} наложен на ${this.name}. Длительность ${effect.duration} ход(а).`;
       }
       this._log(message, `effect-start`);
    }
    async tickActiveEffects(){
        for(let effect of this.activeEffects){
            await delay(1000);
            if (this.isDead) break;
            effect.tick();
            if(effect.duration <= 0){
                effect.onRemove();
            }
        }
        this.activeEffects = this.activeEffects.filter((effect)=>effect.duration > 0);
    }
    removeRandomDebuff(){
        const debuffs = this.activeEffects.filter((effect)=>effect.type=="DEBUFF");
        let message = "";
        if(debuffs.length == 0){
            message = `Очищение не произошло. ${this.name} не имеет дебаффов`;
        }
        else{
            const randomIndex = Math.floor(Math.random() * debuffs.length);
            const id = debuffs[randomIndex].id;
            const effectName = debuffs[randomIndex].name;
            debuffs[randomIndex].onRemove();
            this.activeEffects = this.activeEffects.filter((effect)=>effect.id !== id);
            message = `${this.name} очищен(а) от ${effectName}.`;
        }
        this._log(message, `effect-cleaned`);
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



