const logMessages = {
    battle:{
        system:{
            startBattle:()=>({
                message:`Бой начался`,
                type:`system`,
            }),
            heroTurn:()=>({
                message:`Твой ход`,
                type:`system`,
            }),
            enemyTurn:()=>({
                message:`Ход противника`,
                type:`system`,
            }),
            endTurn:()=>({
                message:`Конец хода`,
                type:`system`,
            }),
            death:(personaName)=>({
                message:`${personaName} повержен(а)`,
                type:`system`,
            }),
            victory:()=>({
                message:`ПОБЕДА`,
                type:`system`,
            }),
            fail:()=>({
                message:`ПОРАЖЕНИЕ`,
                type:`system`,
            }),
        },
        spell:{
            damage:(casterName, targetName, spellName, damage)=>({
                message:`${casterName} применяет ${spellName}. ${targetName} получает ${Math.round(damage)} урона.`,
                type:"player-attack",
            }),
            heal:(targetName, spellName, actualHealed)=>({
                message:`${targetName} применяет ${spellName} ${targetName} исцелен(а) на ${Math.round(actualHealed)} ед.`,
                type:"heal",
            }),
            cleanseAllDebuffs:(targetName, spellName)=>({
                message:`${targetName} применяет ${spellName}. Он(а)  омыт(а) от порчи.`,
                type:"system",
            }),
            noDebuffs:(targetName, spellName)=>({
                message:`${targetName} применяет ${spellName}. Нет дебаффов.`,
                type:"system",
            }),
        },
        basic:{
            kick:(casterName, targetName, spellName, damage)=>({
                message:`${casterName} применяет ${spellName}. ${targetName} получает ${Math.round(damage)} урона.`,
                type:"player-attack",
            }),
        },
        effect:{
            damage:(targetName, effectName, damage)=>({
                message:`Применяется эффект ${effectName}. ${targetName} получает ${Math.round(damage)} урона.`,
                type:`effect`,
            }),
            heal:(targetName, effectName, actualHealed)=>({
                message:`Применяется эффект ${effectName}. ${targetName} исцелен(а) на ${Math.round(actualHealed)} ед.`,
                type:`effect-heal`,
            }),
            onApply:(targetName, effectName, duration)=>({
                message:`Эффект ${effectName} наложен на ${targetName}. Длительность ${duration} ход(а)`,
                type:`effect-info`,
            }),
            onRemove:(targetName, effectName)=>({
                message:`Эффект ${effectName} спал с ${targetName}.`,
                type:`effect-info`,
            }),
            onAttemptAtImposition:(targetName, effectName)=>({
                message:`Попытка наложения эффекта ${effectName} на ${targetName} была отражена.`,
                type:`effect-info`,
            })
        },
    },
}