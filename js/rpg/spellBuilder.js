class SpellBuilder {
    constructor(resourceManager, caster){
        this.resourceManager = resourceManager;
        this.caster = caster;
        this.reset();
    }
    reset(){
        this.currentSpellId = null;
        this.state = {
            J:0, // индекс массива значений J . levels
            I:0, // индекс массива значений I . levels
            Z:false,
            S:false,
        }
        return this;
    }
    setBaseSpell(spellId){
        if(!SPELLS_DATABASE[spellId] && !MOB_SPELLS_DATABASE[spellId]){
            console.error(`SpellBuilder: Заклинание ${spellId} не найдено`);
            return this;
        }
        this.reset();
        this.currentSpellId = spellId;
        return this;
    }
    setScaleLevel(level){
        this.state.J = level;
        return this;
    }
    setDurationLevel(level){
        this.state.I = level;
        return this;
    }
    setDebuff(enabled){
        this.state.Z = enabled;
        if(enabled) this.state.S = false;
        return this;
    }
    setBuff(enabled){
        this.state.S = enabled;
        if(enabled) this.state.Z = false;
        return this;
    }
    toggleModifier(key){
        if(!this.currentSpellId) return this;
        let spell = SPELLS_DATABASE[this.currentSpellId];
        if(!spell){
           spell = MOB_SPELLS_DATABASE[this.currentSpellId];
        }
        const mod = spell.modifiers[key];
        if(!mod || !mod.enabled) return this;
        if(key === "J" || key === "I"){
            const nextLevel = (this.state[key] + 1) % mod.levels.length;
            if(key === "J") this.setScaleLevel(nextLevel);
            if(key === "I") this.setDurationLevel(nextLevel);
        }
        else{
            const nextState = !this.state[key];
            if(key === "Z")  this.setDebuff(nextState);
            if(key === "S") this.setBuff(nextState);
        }
        return this
    }

    build(){
        if(!this.currentSpellId) return null;
        //const spell = SPELLS_DATABASE[this.currentSpellId];
        let spell = SPELLS_DATABASE[this.currentSpellId];
        if(!spell){
            spell = MOB_SPELLS_DATABASE[this.currentSpellId];
        }
        const st = this.state;
        let totalCost = {...spell.baseCost};
        const mergeCost = (costObject)=>{
            if(!costObject) return
            for(const [resKey, value] of Object.entries(costObject)){
                if(value === 0) continue; // Добавил эту строчку
                totalCost[resKey] = (totalCost[resKey] || 0) + value;
            }
        }
        //J
        let scaleMult = 1.0;
        if(spell.modifiers.J?.enabled){
            const costObj = spell.modifiers.J.costs[st.J];
            mergeCost(costObj);
            scaleMult = spell.modifiers.J.levels[st.J];
        }
        //I
        let bonusDur = 0;
        if(spell.modifiers.I?.enabled){
            if (st.S || st.Z){
                const costObj = spell.modifiers.I.costs[st.I];
                mergeCost(costObj);
                bonusDur = spell.modifiers.I.levels[st.I];
            }
        }
        let activeEffect = null;
        const effKey = st.Z? "Z":(st.S?"S":null); //Или бафф, или дебафф.
        const finalPower = Math.floor(spell.basePower * scaleMult);
        if(effKey && spell.modifiers[effKey]?.enabled){
            const mod  = spell.modifiers[effKey];
            mergeCost(mod.cost);
            activeEffect = {
                id:mod.effectId,
                name:mod.name,
                type : mod.type,
                target:mod.target,
                duration: (mod.baseDuration || 1) + bonusDur,
                power: Math.floor(finalPower * (mod.effectPower || 0)),
                extension:mod.extension || false,
            }

        }
        const isValid = this._checkResources(totalCost);
        return new CastableSpell({
            id: spell.id,
            name: spell.name,
            type: spell.type,
            icon: spell.icon,
            totalCost: totalCost,
            power: finalPower,
            effect: activeEffect,
            modifiers:spell.modifiers,
            modifiersState:{...this.state},
            animationChain:spell.animationChain,
            isValid:isValid,
        });
    }
    _checkResources(cost) {
        let casterRes = null;
        if(this.resourceManager){
            casterRes = this.resourceManager.getResources();
        }
        for (const [key, amt] of Object.entries(cost)) {
            if(key === "MP"){
                if(this.caster.currentMp < amt)  return false;
            }
            else if(casterRes === null){
                return false;
            }
            else if (!casterRes[key] || casterRes[key].value < amt) return false;
        }
        return true;
    }
}