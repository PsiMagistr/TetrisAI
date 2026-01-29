const UI_SELECTORS = {
    elem:"#main-container",
    tetrisWrapper:"#tetris-wrapper",
    overlay: "#game-overlay",
    resourcesContainer:"#resources-container",
    resourcesPanel: "#main-resources-panel",
    screens:{
       // menu:"#game-menu",
        menu:{
            window:"#game-menu",
            modalText:"#modal-text",
            modalStartButton:"#modal-button",
        },
        battle:{
            window:"#battle-modal",
            spellsContainer:"#spells-container",
            modifiersPanel:"#modifiers-panel",
            statisticsText:"#statistics",
            log: "#battle-log",
            surrender:"#btn-surrender",
            previewName:"#preview-name",
            previewPower:"#preview-power",
           /* effectTarget:"#effect-target",
            effectName:"#effect-name",
            effectPower:"#effect-power",
            effectDuration:"#effect-duration",
            effectType:"#effect-type",*/
            previewEffectsGrid:{
                target:"#effect-target",
                name:"#effect-name",
                power:"#effect-power",
                duration:"#effect-duration",
                type:"#effect-type",
            },
            previewEffectBlock:"#preview-effect-block",
            totalCost:"#total-cost",
        },
    },
    stats:{
        score:"#score",
        lines:"#lines",
        level:"#level",
    },
    buttons:{
        start:"#start-button",
    },

}
class UIManager extends Subscriber{
    constructor(eventBus) {
        super(eventBus);
        this.ui = this.getElementsBySelectors(UI_SELECTORS);
        this.isBlocked = false;
        this.resourcesCache = {};
        this.ui.buttons.start.addEventListener("click", this.startHandler.bind(this));
        this.ui.screens.menu.modalStartButton.addEventListener("click", this.startHandler.bind(this));
        this.ui.screens.battle.surrender.addEventListener("click", this.surrender.bind(this));
        this.eventBus.on(EVENTS.UI.UPDATE_STATS, this.update.bind(this)); // /*"update"*/
        this.eventBus.on(EVENTS.INPUT.SET_BLOCKED,({state})=>{
            this.isBlocked = state;
        });
        this.eventOn(EVENTS.RESOURCES.UPDATE, this.updateResources.bind(this));
        this.eventOn(EVENTS.UI.OPEN_MODAL, this.openModal.bind(this));
        this.eventOn(EVENTS.GAME.START, this._closeAll.bind(this));
        this.eventOn(EVENTS.UI.ADD_LOG, this.addBattleLog.bind(this));
        this._initSpellContainerListener();
        this._initModifierContainerListener();
        this.eventOn(EVENTS.UI.UPDATE_SPELL_PREVIEW, this.updateSpellPreview.bind(this));

    }
    _initSpellContainerListener(){
        const container = this.ui.screens.battle.spellsContainer;
        if(!container) return;
        container.addEventListener("click", (e)=>{
            const btn = e.target.closest(".spell-btn");
            if(!btn) return;
            const modifiersPanel = this.ui.screens.battle.modifiersPanel;
            modifiersPanel.classList.remove("hidden")
            const allBtns = document.querySelectorAll(".spell-btn");
            allBtns.forEach((btn)=>{
                btn.classList.remove("selected");
            });
            btn.classList.add("selected");
            const spellId = btn.dataset.id;
            if(spellId){
                this.eventBus.emit(EVENTS.BATTLE.SPELL_SELECT, {spellId});
            }
        });
    }
    _hideAllModals(){
        Array.from(this.ui.overlay.children).forEach((child) => {
            child.classList.add("hidden");
        })
    }
    getElementsBySelectors(objSelectors, context= document) {
        const result = {};
        let currentContext = context;
        if(typeof objSelectors.elem === "string"){
            result.elem = currentContext.querySelector(objSelectors.elem);
            if(result.elem instanceof Element){
                    currentContext = result.elem
            }
            else{
                throw new Error(`CRITICAL UI ERROR: Не удалось найти контейнер по селектору ${objSelectors.elem} внутри контекста ${context}`);
            }
        }
        for(let key in objSelectors){
            if(key === "elem" && typeof objSelectors.elem === "string"){
                continue;
            }
            const value = objSelectors[key];
            if(typeof value === 'string'){
                result[key] = currentContext.querySelector(value);
            }
            else if(typeof value === 'object' && value !== null){
                result[key] = this.getElementsBySelectors(value, currentContext);
            }
            else{
                result[key] = value;
            }
        }
        return result;
    }
    _capitalize(string) {
        if (!string) return ''; // Защита от пустой строки
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    openModal({key, data={} }){
        if(key !== "menu") return
        const targetModal = this.ui.screens[key];
        if(!targetModal){
            console.error(`Ошибка: Окно с ключом "${key}" не найдено в UI_SELECTORS.screens`);
            return;
        }
        this._hideAllModals();
        this.ui.overlay.classList.remove("hidden");//Показываем оверлей.
        targetModal.window.classList.remove("hidden");//Показываем модальное окно
        const updateMethodName = `_update${this._capitalize(key)}Content`;
        if(typeof this[updateMethodName] === "function"){
            this[updateMethodName](targetModal, data);
        }else{
            console.log(`Метода ${updateMethodName} нет.`)
        }

    }
     _createSpellButton(spellsList) {
        const container = this.ui.screens.battle.spellsContainer;
        if (!container) return;

        container.innerHTML = "";
        const fragment = document.createDocumentFragment();

        spellsList.forEach((spell, index) => {
            const btn = document.createElement("button");
            btn.classList.add("spell-btn", "base-spell");

            // ID для логики
            btn.dataset.id = spell.id;

            // Иконка (в будущем можно брать из конфига: spell.icon || "✨")
            const spellIcon = document.createElement("span");
            spellIcon.classList.add("spell-icon");
            // Временная заглушка иконки по типу (Атака/Лечение)
            if (spell.type === "ATTACK") spellIcon.textContent = "🔥";
            else if (spell.type === "HEAL") spellIcon.textContent = "💚";
            else spellIcon.textContent = "✨";

            // Правая часть (Инфо)
            const spellInfo = document.createElement("div");
            spellInfo.classList.add("spell-info");

            // Название
            const spellName = document.createElement("span");
            spellName.classList.add("spell-name");
            spellName.textContent = spell.name;

            // Контейнер для цен (чтобы бейджи были в ряд)
            const costContainer = document.createElement("div");
            costContainer.classList.add("spell-cost-container");

            // Генерация бейджей
            for (const [resKey, amount] of Object.entries(spell.baseCost)) {
                const badge = document.createElement("span");
                // Добавляем класс типа ресурса для цвета
                badge.classList.add("spell-cost-badge", `type-${resKey}`);
                badge.textContent = `${resKey}:${amount}`;
                costContainer.appendChild(badge);
            }

            spellInfo.appendChild(spellName);
            spellInfo.appendChild(costContainer);

            btn.appendChild(spellIcon);
            btn.appendChild(spellInfo);
            fragment.appendChild(btn);
        });

        container.appendChild(fragment);
    }


    _updateMenuContent(targetModal, {level, lines, score}){
       targetModal.modalText.textContent = `Линии:${lines} Уровень:${level} Очки:${score}`;
    }
    _updateBattleContent(targetModal, {level, lines, score, spellList}){//
        targetModal.statisticsText.textContent = `Линии:${lines} Уровень:${level} Очки:${score}`;
        if (targetModal.log) {
            targetModal.log.innerHTML = '<div class="log-entry system">--- Начало боя ---</div>';
        }
        this._createSpellButton(spellList);
        this.ui.screens.battle.modBtns = Array.from(this.ui.screens.battle.modifiersPanel.querySelectorAll("button"));
        for(const btn of this.ui.screens.battle.modBtns){
            btn.disabled = true;
        }
    }
    _closeAll(){
        this.ui.overlay.classList.add("hidden");
        this._hideAllModals();
    }
    update({level, lines, score}){
        this.ui.stats.level.textContent = level;
        this.ui.stats.lines.textContent = lines;
        this.ui.stats.score.textContent = score;
    }
    addBattleLog({message, type="system"}){
        const logContainer = this.ui.screens.battle.log;
        if(!logContainer)return;
        const entry = document.createElement("div");
        entry.classList.add("log-entry", type);
        entry.textContent = message;
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    _createResourcePanel(){//Panels
        if (!this.ui.tetrisWrapper) throw new Error("Нет элемента tetrisWrapper");
        const span = document.createElement("span");
        span.classList.add("info-title");
        span.textContent = "РЕСУРСЫ";
        const resourcesPanel = document.createElement("div");
        resourcesPanel.classList.add("info-box","test");
        resourcesPanel.id = "main-resources-panel";
        const infoBox = document.createElement("div");
        infoBox.classList.add("info-box");
        const aside = document.createElement("aside");
        aside.classList.add("side-panel");
        aside.id = "resources-container";
        infoBox.appendChild(span);
        infoBox.appendChild(resourcesPanel);
        aside.appendChild(infoBox);
        this.ui.tetrisWrapper.appendChild(aside);
        this.ui.resourcesContainer = aside;
        this.ui.resourcesPanel = resourcesPanel;
        return resourcesPanel;
    }
    addDivElement(id, resource_panel){
        console.log(id)
        const newDiv = document.createElement("div");
        newDiv.id = id;
        resource_panel.appendChild(newDiv);
        return newDiv;
    }
    updateResources(resources){
        if(Object.keys(resources).length == 0) return;
        if (!this.ui.resourcesPanel) {
            this._createResourcePanel();
        }
        if (this.ui.resourcesContainer){
            this.ui.resourcesContainer.classList.remove("hidden");
        }
        for(let key in resources){
            const id = `resource-${key}`;
            if(!this.resourcesCache[key]){
                const newDiv = this.addDivElement(id, this.ui.resourcesPanel);
                this.resourcesCache[key] = newDiv;
            }
            this.resourcesCache[key].textContent = `${resources[key].label}:${resources[key].value}`;
        }
    }
    surrender(){
       this._closeAll();
       this.eventBus.emit(EVENTS.BATTLE.SURRENDER,{});
    }
    startHandler(){
        if(this.isBlocked) return;
        //this._closeAll()
        this.eventBus.emit(EVENTS.GAME.INIT, {})
    }
    updateSpellPreview(spellData){
        const battle = this.ui.screens.battle;
        console.log("*************");
        const modifiers = spellData.modifiers;
        const state = spellData.modifiersState;
        const changeModifier = (btn) =>{
            const key = btn.dataset.mod;
            const isActive =  Boolean(state[key]);
            const bage = btn.querySelector("span");
            btn.classList.toggle("active", isActive);
            if(!bage) return
            if(isActive){
                bage.textContent = `+${state[key]}`;
                bage.style.display = "block";
            }
            else{
                bage.style.display = "none";
            }
        }

        const btns = battle.modBtns;
        const btnsObj = {};
        for(const btn of btns){
            btnsObj[btn.dataset.mod] = btn;
            const mod = btn.dataset.mod;
            const modConfig = modifiers[mod];
            if(modConfig){
                btnsObj[mod].disabled = !modifiers[mod].enabled;
                changeModifier(btnsObj[mod]);
            }
        }
       const cost  = Object.entries(spellData.totalCost)
           .map(([k,v])=>`${k}:${v}`).join(", ");

        if(spellData.effect){
            for(const key in battle.previewEffectsGrid){
                battle.previewEffectsGrid[key].textContent = spellData.effect[key];
            }
        }
        else{
            for(const key in battle.previewEffectsGrid){
                battle.previewEffectsGrid[key].textContent = "--";
            }
        }
       battle.previewName.textContent = `Выбор:${spellData.name}`;
       battle.previewPower.textContent = `${spellData.power}`;
       battle.totalCost.textContent = cost;
       if (modifiers.I?.enabled && btnsObj.I){
            const isEffectActive = state.S || state.Z;
            btnsObj.I.disabled = !isEffectActive;
           if (!isEffectActive) {
               btnsObj.I.classList.remove("active");
               const badge = btnsObj.I.querySelector(".badge");
               if (badge) badge.style.display = "none";
           }
       }
    }
    _getSpellCostDescription(spellData){
        let effectDescription = "нет";
        const dictionary = {
            id:"айди",
            name:"Название",
            type:"Тип",
            target:"Цель",
            duration:"Длительность",
            power:"Сила",
        }
        if(spellData.effect){
            effectDescription = "";
            for(const [k, v] of Object.entries(spellData.effect)){
                effectDescription += `${dictionary[k]}:${v} `;
            }
        }
        let cost = "";
        for(const [k, v] of Object.entries(spellData.totalCost)){
            cost += `${k}:${v}, `;
        }
        let description = `${spellData.name} Сила:${spellData.power} Эффект: (${effectDescription}) Цена:${cost}`;
        return description
    }
    _initModifierContainerListener(e){
        this.ui.screens.battle.modifiersPanel.addEventListener("click", (e)=>{
            const btn = e.target.closest(".mod-btn");
            if(btn && !btn.disabled){
                this.eventBus.emit(EVENTS.BATTLE.TOGGLE_MODIFIER_SPELL,{modifierId:btn.dataset.mod});
            }
        })
    }
}