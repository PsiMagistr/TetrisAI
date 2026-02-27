class spellExecutor {
    constructor(assetManager) {
        this.assetManager = assetManager;
        this.effectFactory = new EffectFactory();
        this.actions = {
            ATTACK:(caster, target, power, context)=>{
                target.takeDamage(power, context);
            },
            HEAL:(caster, target, power, context)=>{
                caster.heal(power, context);
            },
            DEFENCE:(caster, target, power)=>{
                caster.removeRandomDebuff();
            },
            EMPTY:(caster, target, power)=>{

            },
        }
    }
    applySpellMechanic(spell, caster, target, power){
        if(this.actions[spell.type]){
            const config = spell.effect;
            const sprite = this.assetManager.getPictureByKey("SPELL_EFFECTS");
            let effect;
            const context = {
                type:"SPELL",
                name:spell.name,
                caster:caster,
            }
            this.actions[spell.type](caster, target, power, context);
            if(config !== null){
                effect = this.effectFactory.create(config, sprite, caster, target);
                effect.target.addEffect(effect);
            }
        }
    }
}