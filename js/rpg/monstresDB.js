const ENEMIES = {
    KNIGHT:{
        name:"Темный рыцарь",
            baseHp:100,
            currentHp:100,
            baseMp:100,
            currentMp:100,
            baseStats:{atk:8, def:0,speed:1, immunityToDebuffs:false},
        spriteKey:"KNIGHT",
            offset:{x:50,y:40},
        spellList:["HEAVY_BLOW"],
        /*visuals: {
            width: 100,
            height: 100,
            hpBarWidth: 200, // У босса полоска шире
            mpBarWidth: 200,
        }*/
    },
}