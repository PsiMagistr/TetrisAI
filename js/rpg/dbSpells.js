const SPELLS_DATABASE = {
    FIREBALL:{
        id:"FIREBALL",
        name:"Огненный шар",
        type:"ATTACK",
        baseCost:{T:5, MP:10}, // Основа
        basePower:10,
        icon:"./assets/spells/icons/fireball.png",
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
                callback: null,
                duration: 800,
            },
        ],
        modifiers:{
            J:{//Масштаб
                enabled:true,
                levels:[1.0, 1.25, 1.50, 2.0],
                costs:[{J:0, MP:0},{J:5, MP:0},{J:10, MP:0},{J:15, MP:0}],
            },
            I:{//Длительность
                enabled:true,
                levels:[0, 1, 2],
                costs:[{I:0, MP:0},{I:10, MP:100},{I:30, MP:0}],
            },
            Z:{//Дебафф
                enabled:true,
                effectId: "BURN",
                name:"Горение",
                target: "ENEMY", // <--- Явно указываем цель
                type: "DEBUFF",
                cost:{Z:10},
                baseDuration: 1,
                effectPower: 0.2
            },
            S:{//Бафф.
              enabled: false,
            }
        },
    },
    HEAL_LIGHT:{
        id:"HEAL_LIGHT",
        name:"Исцеление",
        type:"HEAL",
        icon:"./assets/spells/icons/healing.png",
        baseCost: { O: 15, MP:30,},
        basePower: 40,
        modifiers:{
            J:{
                enabled:true,
                levels:[1.0, 1.25, 1.50, 2.0],
                costs:[{J:0, MP:0},{J:5, MP:0},{J:10, MP:0},{J:15, MP:0}],
            },
            Z:{
                enabled:false,
            },
            I:{
                enabled:true,
                levels:[0, 1, 2],
                costs:[{I:0, MP:0},{I:10, MP:0},{I:30, MP:0}],
            },
            S: {
                enabled: true,
                name:"Регенерация",
                effectId: "REGEN",
                target: "SELF", // <--- Цель: Игрок
                type: "BUFF",
                cost: {S:10,MP:10},
                baseDuration: 1, // Висит 2 хода + бонусы от I
                effectPower: 0.5 // Лечит 50% от силы заклинания каждый ход
            }
        },
    },

}



