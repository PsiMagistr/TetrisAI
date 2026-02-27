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
        this.stats = config.stats || { atk: 10, def: 0, immunityToDebuffs:false,};
        this.avatar = config.avatar;
        this.spellList = config.spellList || [];
        this.isDead = false;
        this.immunityToDebuffs = false;
        this.activeEffects = [];
        this.type = config.type;

    }
    takeDamage(damage, context){
        // Константа баланса.
        // 50 значит, что при 50 защиты урон режется в 2 раза.
        const ARMOR_COEFF = 50;
        // 1. Считаем коэффициент прохождения урона (от 1.0 до 0.0)
        // Если защита отрицательная (дебаффы), формула тоже сработает корректно (урон вырастет)
        const damageMultiplier = ARMOR_COEFF / (ARMOR_COEFF + Math.max(0, this.stats.def));

        // 2. Считаем итоговый урон
        // Math.ceil гарантирует, что если удар был, хотя бы 1 хп снимется (если урон > 0)
        let actualDamage = damage * damageMultiplier;


        // Дальше твой стандартный код
        this.currentHp = clamp(this.currentHp - actualDamage, 0, this.maxHp);
        if (this.currentHp <= 0.01) {
            this.currentHp = 0;
            this.isDead = true;
            this.onDeath(); // Если есть метод для событий смерти
        }
        if(this.isDead) return;
        let message = "";
        let text_type = "";
        if(context.type === "SPELL"){
            message = `${context.caster.name} применяет ${context.name} ${this.name} получает ${Math.round(actualDamage)} урона.`
            text_type = "player-attack";
        }
        else if(context.type === "EFFECT"){
            message = `Применяется эффект ${context.name}  ${this.name} получает ${Math.round(actualDamage)} урона.`
            text_type = "effect";
        }
        else{
            message = `${context.caster.name} использует ${context.name} ${this.name} получает ${Math.round(actualDamage)} урона.`;
            text_type = "player-attack";
        }
        this._log(`${message}`, text_type);
        this.eventBus.emit(EVENTS.BATTLE.FLOATING_TEXT, {
            target:this,
            value:actualDamage,
            type:"DAMAGE",
        })
        return actualDamage;
    }
    spendMp(amount){
        this.currentMp = clamp(this.currentMp - amount, 0, this.maxMp);
    }
    heal(amountPercent, context){
        const startHp = this.currentHp;
        // Считаем от МАКСИМУМА
        const healValue = this.maxHp * (amountPercent / 100);

        this.currentHp = clamp(this.currentHp + healValue, 0, this.maxHp);

        const actualHealed = this.currentHp - startHp;
        let message = "";
        if(context.type === "SPELL"){
            message = `${this.name} применяет заклинание ${context.name} ${this.name} исцелен(а) на ${Math.round(actualHealed)} ед. здоровья)`;
        }
        else{
            message = `Применяется эффект ${context.name}  ${this.name} исцелен(а) ${Math.round(actualHealed)} ед.`
        }
        // В логе пишем реальную цифру
        this._log(message, "heal");
        this.eventBus.emit(EVENTS.BATTLE.FLOATING_TEXT, {
            target:this,
            value:actualHealed,
            type:"HEAL",
        })
        return actualHealed;
    }
    addEffect(effect){
       if(this.isDead) return;
       let message = "";
       let isDebuff = false
       if(this.stats.immunityToDebuffs && effect.type === "DEBUFF"){
           message = `Попытка наложения эффекта ${effect.name} на ${this.name} была отражена.`;
           isDebuff = true;
       }
       else{
           const activeEffect = this.activeEffects.find(currenTEffect => currenTEffect.id === effect.id);
           if(activeEffect){
               if(effect.extension){
                   activeEffect.duration = effect.duration;
                   message = `Эффект ${activeEffect.name} обновлен. Длительность ${activeEffect.duration} ход(а).`;
               }
               else{
                   message = `Эффект ${activeEffect.name} не может быть обновлен. Длительность ${activeEffect.duration} ход(а).`;
               }
           }
           else{
               this.activeEffects.push(effect);
               effect.onApply();
               message = `Эффект ${effect.name} наложен на ${this.name}. Длительность ${effect.duration} ход(а).`;
           }
       }
       this._log(message, `effect-start`);
       if(isDebuff){
           this.eventBus.emit(EVENTS.BATTLE.FLOATING_TEXT, {
               target:this,
               value:effect.name,
               type:"DEBUFFER",
           })
       }
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
            message = `${this.name} не имеет дебаффов`;
        }
        else{
            const randomIndex = Math.floor(Math.random() * debuffs.length);
            const id = debuffs[randomIndex].id;
            const effectName = debuffs[randomIndex].name;
            debuffs[randomIndex].onRemove();
            this.activeEffects = this.activeEffects.filter((effect)=>effect.id !== id);
            message = `${this.name} очищен(а) от ${effectName}.`;
        }
        this._log(message, `effect`);
    }
    onDeath(){
        this.eventBus.emit(EVENTS.BATTLE.DEATH, this);
    }
    clearAllEffects(){
        this.activeEffects = [];
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



