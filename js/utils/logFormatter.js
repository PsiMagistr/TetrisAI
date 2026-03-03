const logMessages = {
    battle:{
        spell:{
            damage:(casterName, targetName, spellName, damage)=>({
                message:`${casterName} применяет ${spellName} ${targetName} получает ${Math.round(damage)} урона.`,
                type:"player-attack",
            }),
            heal:(targetName, spellName, actualHealed)=>({
                message:`${targetName} применяет ${spellName} ${targetName} исцелен(а) на ${Math.round(actualHealed)} ед.`,
                type:"heal",
            }),
        },
        effect:{
            damage:(targetName, effectName, damage)=>({
                message:`Применяется эффект ${effectName}. ${targetName} получает ${Math.round(damage)} урона.`,
                type:`effect`,
            }),
            heal:(targetName, effectName, actualHealed)=>({
                message:`Применяется эффект ${effectName}. ${targetName} исцелен(а) на ${Math.round(actualHealed)} ед.`,
                type:`heal`,
            }),
        },
    },
}