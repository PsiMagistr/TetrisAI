class BattleManager extends Subscriber{
    constructor(eventBus, resourceManager, assetManager, assetsConfig, graphicsConfig) {
        console.log("BattleManager constructor");
        super(eventBus);
        this.resourceManager = resourceManager;
        this.graphicsConfig = graphicsConfig;
        this.loopRequestID = null;
        this.lastTime = null;
        this.loopCounter = 0;
        this.loopInterval = 0;
        this.assetManager = assetManager;
        this.player = null;
        this.enemy = null;
        this.isPlayerTurn = true;
        this.loadingPromise = this.assetManager.preload(assetsConfig);
        this.animationSpellFactory = new AnimationSpellFactory();
        this.battleState = {
            resources:null,
        };
        this.spellExecutor = new spellExecutor(assetManager);
        this.loop = this.loop.bind(this);
        this.eventOn(EVENTS.GAME.LIMIT_REACHED, this.handleBattleStart.bind(this));
        this.eventOn(EVENTS.GAME.START, this.stopBattle.bind(this));
        this.eventOn(EVENTS.BATTLE.SURRENDER, this.handleSurrender.bind(this));
        this.eventOn(EVENTS.BATTLE.SPELL_SELECT, this.spellSelect.bind(this));
        this.eventOn(EVENTS.BATTLE.TOGGLE_MODIFIER_SPELL, this.toggle_modifier.bind(this));
        this.eventOn(EVENTS.BATTLE.APPLY_CAST, this.handleCast.bind(this));
        this.eventOn(EVENTS.BATTLE.DEATH, this.death.bind(this));
    }
    startLoop(){
        if(!this.loopRequestID){
            this.lastTime = performance.now();
            this.loopRequestID = window.requestAnimationFrame(this.loop);
        }
    }
    stopLoop(){
        if(this.loopRequestID){
            window.cancelAnimationFrame(this.loopRequestID);
            this.loopRequestID = null;
        }
    }
    stopBattle() {
        this.stopLoop();
        // Можно также очистить состояние, если нужно
        this.player = null;
        this.enemy = null;
        console.log("Battle loop stopped.");
    }
    loop(time){
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        this.loopCounter += deltaTime;
        if (this.loopCounter >= this.loopInterval) {
            this.loopCounter -= this.loopInterval;
            this.update(deltaTime);
            this.eventBus.emit(EVENTS.BATTLE.RENDER_FRAME, this.battleState);
        }
        this.loopRequestID = window.requestAnimationFrame(this.loop);
    }
    _prepareUnitConfig(dbData, isHero=false){
        const config = {
            name:dbData.name,
            maxHp:dbData.baseHp,
            currentHp:dbData.currentHp ?? dbData.baseHp,
            maxMp:dbData.maxMp ?? dbData.baseMp,
            currentMp:dbData.currentMp ?? dbData.baseMp,
            avatar:{
                x:dbData.offset.x,
                y:dbData.offset.y,
                sprite:this.assetManager.getPictureByKey(dbData.spriteKey),
                ... (dbData.visuals || {}),
            },
            spellList:dbData.spellList,
            stats:{...dbData.baseStats},
        }
        if(isHero){
            config.resources = this.resourceManager.getResources();
            config.type = "player";
        }
        else{
            const enemySpriteWidth = dbData.visuals?.width ||  this.graphicsConfig.units.defaultSize;
            config.avatar.x = this.graphicsConfig.canvas.width - enemySpriteWidth - dbData.offset.x;
            config.type = "enemy";
        }
        return config;
    }
    async handleBattleStart({level, lines, score}){
        try{
            //ЗДесь можно вызвать небольшой модальный блок загрузчика...
            await this.loadingPromise;
            //ЗДесь можно спрятать модальный блок загрузчика...
        }
        catch(error){
            console.error("An error occurred while loading assets");
            return
        }
        const HeroData = HEROES["PRINCESS"];
        const EnemyData = ENEMIES["KNIGHT"];

        this.player = new Hero(this.eventBus, this._prepareUnitConfig(HeroData,true));
        this.enemy = new Unit(this.eventBus,this._prepareUnitConfig(EnemyData));

        this.battleState = {
            player: this.player,
            enemy:this.enemy,
            animations:[],
        }
        this.spellBuilder = new SpellBuilder(this.resourceManager, this.player);        ;
        this.eventBus.emit(EVENTS.UI.OPEN_MODAL, {
            key:"battle",
            data:{
                 level:level,
                 lines:lines,
                 score:score,
                 spellList:this.player.spellList.map((id)=>SPELLS_DATABASE[id])
                     .filter((spell)=>spell)
                     .map((spell)=>({
                        id:spell.id,
                        name:spell.name,
                        type:spell.type,
                        icon:spell.icon,
                        baseCost:spell.baseCost,
                     })),
            }
        });
        this.checkPlayerTurn()?this._playerTurn():this._enemyTurn();
        this.eventBus.emit(EVENTS.RESOURCES.UPDATE, this.resourceManager.getResources());
        this.eventBus.emit(EVENTS.UI.CLEAR_LOG, {});
        this._log("Бой начался", "system");
        this.startLoop(); //Стартуем игровой цикл
    }
    handleSurrender(){
        console.log("Сдача. Возврат в меню.");
        this.stopBattle();
        this.eventBus.emit(EVENTS.UI.CLOSE_ALL_MODALS, {});
        this.eventBus.emit(EVENTS.GAME.RESET,{})
    }
    spellSelect({spellId}){
        this.spellBuilder.setBaseSpell(spellId);
        const spellPreview = this.spellBuilder.build();
        this.eventBus.emit(EVENTS.UI.UPDATE_SPELL_PREVIEW, spellPreview);
    }
    toggle_modifier({modifierId}){
        const spellPreview = this.spellBuilder
            .toggleModifier(modifierId)
            .build();
        this.eventBus.emit(EVENTS.UI.UPDATE_SPELL_PREVIEW, spellPreview);
    }
    handleCast(){
        if (!this.isPlayerTurn || this.player.isDead || this.enemy.isDead) return;
        this.eventBus.emit(EVENTS.UI.SET_INTERFACE_INTERACTIVITY, {isActive:false});
        console.log("!+++++++++++++++!");
        const spell = this.spellBuilder.build();
        console.log(spell.effect);
        if(!spell || !spell.isValid){
            console.log("Не хватает ресурсов.");
            return;
        }
        const cost = {...spell.totalCost};
        const mp = cost.MP;
        this.player.spendMp(mp);
        delete cost.MP;
        this.resourceManager.spendResources(cost);
        this.eventBus.emit(EVENTS.RESOURCES.UPDATE, this.resourceManager.getResources());
        const animationContainer = this.animationSpellFactory.createSpellAnimation(
            this.player,
            this.enemy,
            spell.animationChain,
            this.onHit.bind(this, spell, this.player, this.enemy),
        )
        this.battleState.animations.push(animationContainer);
    }
    async _playerTurn(){
            await delay(1000);
            this._log("Ваш ход!", "system");
            await this.player.tickActiveEffects();
            if(this.player.isDead || this.enemy.isDead) return;
            this.spellBuilder.reset();
            this.eventBus.emit(EVENTS.UI.SET_INTERFACE_INTERACTIVITY, {isActive:true});
            this.isPlayerTurn = true;
    }
    async _enemyTurn(){
        this.eventBus.emit(EVENTS.UI.SET_INTERFACE_INTERACTIVITY, {isActive:false});
        await delay(1000);
            this._log("Ход противника!", "system");
            await this.enemy.tickActiveEffects();
            if(this.player.isDead || this.enemy.isDead) return;
            const spellList = this.enemy.spellList;
            if (!spellList || spellList.length === 0) {
                console.warn("У врага нет заклинаний! Пропуск хода.");
                this._playerTurn();
                return;
            }
            const randomId = spellList[Math.floor(Math.random() * spellList.length)];
            const aiBuilder = new SpellBuilder(null, this.enemy);
            aiBuilder.setBaseSpell(randomId);
            aiBuilder.toggleModifier("Z");
            const enemySpell = aiBuilder.build();
            if(!enemySpell.isValid){
                this._log(`${this.enemy.name} пытается использовать ${enemySpell.name}, но не хватает манны.`, "enemy-action");
                this._playerTurn();
                return;
            }
            const cost = {...enemySpell.totalCost};
            const mp = cost.MP;
            this.enemy.spendMp(mp);
            const animationContainer = this.animationSpellFactory.createSpellAnimation(
                this.enemy,       // Caster
                this.player,      // Target
                enemySpell.animationChain || [], // Цепочка из базы данных
                this.onHit.bind(this, enemySpell, this.enemy, this.player) // Коллбэк
            );
            this.battleState.animations.push(animationContainer);
            this.isPlayerTurn = false;
    }
    _log(message, type){
        this.eventBus.emit(EVENTS.UI.ADD_LOG, {message, type});
    }
    checkPlayerTurn(){
        let result = true;
        if(this.player.stats.speed > this.enemy.stats.speed){
            result = true;
        }
        else if(this.player.stats.speed < this.enemy.stats.speed){
            result = false;
        }
        else{
            const variants = [true, false];
            result = Math.floor(Math.random() * variants.length);
        }
        return result;
    }
    onHit(spell, caster, target){
        this._log(`${caster.name} применил(а) "${spell.name}". Входящая сила:${spell.power}`, `${caster.type}-action`);
        this.spellExecutor.applySpellMechanic(spell, caster, target, spell.power);
        if(this.player.isDead || this.enemy.isDead) return;
        this._log("Конец хода", "system");
        caster.type == "player"?this._enemyTurn():this._playerTurn();
    }
    update(deltaTime){
        const animations = this.battleState.animations;
        for(const animation of animations){
            animation.move(deltaTime);
        }
        this.battleState.animations = animations.filter(anim => !anim.isDeleted);
    }
    death(persona){
        const finalText = persona.type == "enemy"?"ПОБЕДА!":"ПОРАЖЕНИЕ!";
        this.player.clearAllEffects();
        this.enemy.clearAllEffects();
        this._log(`${persona.name} повержен(а)`, "system");
        this._log(`${finalText}`, "system");
    }
}