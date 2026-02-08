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
    _getSpellConfig(spellId){
        if(SPELLS_DATABASE[spellId]){
            return SPELLS_DATABASE[spellId];
        }
        if(MOB_SPELLS_DATABASE[spellId]){
            return MOB_SPELLS_DATABASE[spellId];
        }
        return null;
    }
    setBaseSpell(spellId){
        const spellConfig = this._getSpellConfig(spellId);
        if(!spellConfig){
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
        const spellConfig = this._getSpellConfig(this.currentSpellId);
        if(!spellConfig) return this;
        const mod = spellConfig.modifiers[key];
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

    _mergeCost(draft, costObject){
        if(!costObject) return
        for(const [resKey, value] of Object.entries(costObject)){
            if(value === 0) continue; // Добавил эту строчку
            draft.totalCost[resKey] = (draft.totalCost[resKey] || 0) + value;
        }
    }
    _applyScale(draft){
        if(draft.spellConfig.modifiers.J?.enabled){
            const costObj = draft.spellConfig.modifiers.J.costs[draft.state.J];
            this._mergeCost(draft, costObj);
            draft.scaleMult = draft.spellConfig.modifiers.J.levels[draft.state.J];
        }
    }
    _applyEffect(draft){
        if(draft.spellConfig.modifiers.I?.enabled){
            if(draft.state.S || draft.state.Z){
                const costObj = draft.spellConfig.modifiers.I.costs[draft.state.I];
                this._mergeCost(draft,costObj);
                draft.bonusDuration = draft.spellConfig.modifiers.I.levels[draft.state.I];
            }
        }
        const effKey = draft.state.Z? "Z":(draft.state.S?"S":null);
        draft.finalPower = Math.floor(draft.spellConfig.basePower * draft.scaleMult);
        if(effKey && draft.spellConfig.modifiers[effKey]?.enabled){
            const mod  = draft.spellConfig.modifiers[effKey];
            this._mergeCost(draft, mod.cost);
            draft.activeEffect = {
                id:mod.effectId,
                name:mod.name,
                type : mod.type,
                target:mod.target,
                duration: (mod.baseDuration || 1) + draft.bonusDuration,
                power: Math.floor(draft.finalPower * (mod.effectPower || 0)),
                extension:mod.extension || false,
            }
        }
    }
    build(){
        let spellConfig = this._getSpellConfig(this.currentSpellId);
        if(!spellConfig) return null;
        const draft = {
            spellConfig:spellConfig,
            state:this.state,
            finalPower:spellConfig.basePower,
            totalCost:{...spellConfig.baseCost},
            scaleMult:1.0,
            activeEffect:null,
            bonusDuration:0,
            isValid:false,
        }
        //J
        this._applyScale(draft);
        this._applyEffect(draft);
        draft.isValid = this._checkResources(draft.totalCost);
        return new CastableSpell({
            id: draft.spellConfig.id,
            name: draft.spellConfig.name,
            type: draft.spellConfig.type,
            icon: draft.spellConfig.icon,
            totalCost: draft.totalCost,
            power: draft.finalPower,
            effect: draft.activeEffect,
            modifiers:draft.spellConfig.modifiers,
            modifiersState:{...this.state},
            animationChain:draft.spellConfig.animationChain,
            isValid:draft.isValid,
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