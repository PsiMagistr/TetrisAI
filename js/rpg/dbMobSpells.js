const MOB_SPELLS_DATABASE = {
    HEAVY_BLOW:{
        id:"HEAVY_BLOW",
        name:"Тяжелый удар",
        type:"ATTACK",
        baseCost:{MP:5},
        basePower:20,
        animationChain:[
            {
                type:"jerk",
                startFrom:"caster",
                distance:30,
                duration:300,
                caster:null,
            },
            {
                type:"fireball",
                startFrom:"caster",
                casterX: 0,
                casterY:0,
                speed:15,
                size:10,
                color:"#e74c3c",
                targetX:0,
                callback:null,
            },
            {
                type:"flashEffect",
                duration: 1000,
                callback: null,
                isUseCallback:true,
            }
        ],
        fixedEffect:{
            name:"Кровотечение",
            effectId: "BLEEDING",
            target: "ENEMY",
            type: "DEBUFF",
            baseDuration: 2,
            effectPower: 0.2,
            iconIndex:3,
            extension:false,
        },
    },
    POWER_DARKNESS: {
        id: "POWER_DARKNESS",
        name: "Сила тьмы",
        type: "HEAL",
        icon: "./assets/spells/icons/healing.png",
        baseCost: {MP: 5,},
        basePower: 12,
        animationChain: [
            {
                type: "overlayEffect",
                startFrom: "caster",
                duration: 1000,
                size: 50,
                color: "red",
                callback: null,
                isUseCallback: true,
            },
        ],
    },
}