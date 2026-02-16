class spellExecutor {
    constructor(assetManager) {
        this.assetManager = assetManager;
        this.effectFactory = new EffectFactory();;
        this.actions = {
            ATTACK:(caster, target, power)=>{               ;
                target.takeDamage(power);
            },
            HEAL:(caster, target, power)=>{
                caster.heal(power);
            }
        }
    }
    applySpellMechanic(spell, caster, target, power){
        if(this.actions[spell.type]){
            const config = spell.effect;
            const sprite = this.assetManager.getPictureByKey("SPELL_EFFECTS");
            let effect;
            this.actions[spell.type](caster, target, power);
            if(config !== null){
                effect = this.effectFactory.create(config, sprite, caster, target);
                effect.target.addEffect(effect);
            }
        }
    }
}