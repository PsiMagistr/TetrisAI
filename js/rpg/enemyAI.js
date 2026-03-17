class EnemyAI{
    constructor(caster, target){
        this.target = target;
        this.caster = caster;
        this.evaluators = {
            ATTACK:this._evalAttack.bind(this),
            HEAL:this._evalHeal.bind(this),
            DEFENCE:this._evalDefence.bind(this),
        }
    }
    getBestAction(){
        const spellList = this.caster.spellList;
        if(!spellList || spellList.length === 0) return null;
        let bestSpell = null;
        let maxUtility = -1;
        console.log(`--- [ИИ] ${this.caster.name} АНАЛИЗИРУЕТ СИТУАЦИЮ ---`);
        for(const spellId of spellList) {
            const aiBuilder = new SpellBuilder(null, this.caster);
            aiBuilder.setBaseSpell(spellId);
            const spell = aiBuilder.build();
            if(!spell || spell.isValid){
                continue;
            }
            const utilityScore = this._calculateUtility(spell);
            console.log(`[ИИ] ${spell.name} -> Оценка: ${Math.round(utilityScore)}`);
            if(utilityScore > maxUtility){
                maxUtility = utilityScore;
                bestSpell = spell;
            }
        }
        console.log(`--- [ИИ] ИТОГОВЫЙ ВЫБОР: ${bestSpell ? bestSpell.name : "Пропуск хода"} ---`);
        return bestSpell;
    }
    _calculateUtility(spell){
        let score = 10;
        const evaluator = this.evaluators[spell.type];
        if(evaluator){
            score += evaluator(spell);
        }
        score += this._evalEffects(spell);
        score += this._evalManaCost(spell);
        score += Math.random() * 10;
        return Math.max(0, score);
    }
    _evalAttack(spell){
        let score = 40;
        score += (spell.power * 0.5);
        if(spell.power >= this.target.currentHp){
            score += 1000;
        }
        return score;
    }
    _evalHeal(spell){
        const myHpPct = this.target.currentHp / this.target.maxHp;
        if (myHpPct > 0.8) return 0;
        let score = (1 - myHpPct) * 100;
        const missingHp = this.caster.maxHp - this.caster.currentHp;
        if (spell.power > missingHp + 20) {
            score -= 15;
        }
        return score;
    }
    _evalDefence(spell){
        const myHpPct = this.caster.currentHp / this.caster.maxHp;
        let score = myHpPct < 0.5 ? 50 : 20;
        const hasDebuffs = this.caster.activeEffects.some(e => e.type === "DEBUFF");
        if (hasDebuffs) score += 40;
        return score;
    }
    _evalEffects(spell){
        if (!spell.effect) return 0;
        let scoreOffset = 0;
        const eff = spell.effect;
        if (eff.type === "DEBUFF" && eff.target === "ENEMY") {
            const targetHasIt = this.target.activeEffects.some(e => e.id === eff.id);
            if (!targetHasIt) {
                scoreOffset += 35; // Игрок чист, надо отравить!
            } else {
                scoreOffset -= 20; // Уже отравлен, штрафуем спелл
            }
        }
        if (eff.type === "BUFF" && eff.target === "SELF") {
            const iHaveIt = this.caster.activeEffects.some(e => e.id === eff.id);
            if (!iHaveIt) {
                scoreOffset += 35; // Хотим повесить на себя щит/реген
            } else {
                scoreOffset -= 20; // Уже висит, не тратим ману
            }
        }
        return scoreOffset;
    }
    _evalManaCost(spell){
        let scoreOffset = 0;
        const mpCost = spell.totalCost.MP || 0;
        const myMpPct = this.caster.currentMp / this.caster.maxMp;
        if (myMpPct < 0.3 && mpCost > 15) {
            // Если маны меньше 30% и спелл дорогой - сильно штрафуем
            scoreOffset -= 30;
        }
        return scoreOffset;
    }
}