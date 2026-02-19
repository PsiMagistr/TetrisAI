const MOB_SPELLS_DATABASE = {
    HEAVY_BLOW:{
        id:"HEAVY_BLOW",
        name:"Тяжелый удар",
        type:"ATTACK",
        baseCost:{MP:5},
        basePower:10,
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
        modifiers:{
            J:{
                enabled:false,
            },
            I:{
                enabled:true,
                levels:[0, 1, 2],
                costs:[{MP:0},{MP:0},{MP:0}],
                behavior:"cycle",
            },
            Z:{
                enabled:true,
                effectId: "BLEEDING",
                name:"Кровотечение",
                target: "ENEMY", // <--- Явно указываем цель
                type: "DEBUFF",
                cost:{Z:0},
                baseDuration: 3,
                effectPower: 0.2,
                extension:false,
                iconIndex:3,
                behavior:"toggle",
            },
            S:{
                enabled:false,
            }
        }
    },
}