class BattleUi extends BaseUi{
    constructor(eventBus){
        super(eventBus, "#battle-modal");
        this.selectors = {
            spellsContainer:"#spells-container",
            modifiersPanel:"#modifiers-panel",
            statisticsText:"#statistics",
            log: "#battle-log",
            surrender:"#btn-surrender",
            previewName:"#preview-name",
            previewPower:"#preview-power",
            previewEffectsGrid:{
                target:"#effect-target",
                name:"#effect-name",
                power:"#effect-power",
                duration:"#effect-duration",
                type:"#effect-type",
            },
            battleResourcesContainer:"#battle-resources-container",
            previewEffectBlock:"#preview-effect-block",
            totalCost:"#total-cost",
            castBtn:"#cast-btn",
        }
        this.ui = this.getElementsBySelectors(this.selectors);
        this.eventOn(EVENTS.RESOURCES.UPDATE, this._updateResources.bind(this));
        this.eventOn(EVENTS.UI.OPEN_MODAL, this._onOpenModal.bind(this));
        this.eventOn(EVENTS.UI.UPDATE_SPELL_PREVIEW, this.updateSpellPreview.bind(this));
        this.eventOn(EVENTS.UI.ADD_LOG, this._addLog.bind(this));
        this.eventOn(EVENTS.UI.SET_INTERFACE_INTERACTIVITY, this.setInterfaceInteractivity.bind(this));
        this.eventOn(EVENTS.UI.CLEAR_LOG, this._clearLog.bind(this));
        this.ui.surrender.addEventListener("click", this.surrender.bind(this));
        this._initSpellContainerListener();
        this._initModifierContainerListener();
        this._btnCastListener();
    }
    _onOpenModal({key, data}){
        if(key !== "battle") return;
        const spellList = data.spellList;
        this.ui.statisticsText.textContent = `Линии:${data.lines} Уровень:${data.level} Очки:${data.score}`;
       /* if (targetModal.log) {
            targetModal.log.innerHTML = '<div class="log-entry system">--- Начало боя ---</div>';
        }*/
        this._createSpellButton(spellList);
        this.ui.modBtns = Array.from(this.ui.modifiersPanel.querySelectorAll("button"));
        for(const btn of this.ui.modBtns){
            btn.disabled = true;
            btn.classList.remove("active");
        }
    }
    _initSpellContainerListener(){
        const container = this.ui.spellsContainer;
        if(!container) return;
        container.addEventListener("click", (e)=>{
            const btn = e.target.closest(".spell-btn");
            if(!btn) return;
            const modifiersPanel = this.ui.modifiersPanel;
            modifiersPanel.classList.remove("hidden")
            const allBtns = document.querySelectorAll(".spell-btn");
            allBtns.forEach((btn)=>{
                btn.classList.remove("selected");
            });
            //btn.classList.add("selected");
            const spellId = btn.dataset.id;
            if(spellId){
                this.eventBus.emit(EVENTS.BATTLE.SPELL_SELECT, {spellId});
            }
        });
    }
    _createSpellButton(spellsList) {
        const container = this.ui.spellsContainer;
        if (!container) return;
        container.innerHTML = "";
        const fragment = document.createDocumentFragment();
        spellsList.forEach((spell) => {
            const btn = document.createElement("button");
            btn.classList.add("spell-btn");
            btn.disabled = true;
            btn.title = spell.name;
            btn.dataset.id = spell.id;
            // --- ЛОГИКА ИКОНКИ ---
            // Проверяем, есть ли путь к картинке и похож ли он на путь (содержит / или .)
            const hasIconImage = spell.icon && (spell.icon.includes("/") || spell.icon.includes("."));

            if (hasIconImage) {
                // ВАРИАНТ 1: Есть картинка -> создаем <img>
                const img = document.createElement("img");
                img.src = spell.icon;
                img.alt = spell.name;
                img.classList.add("spell-icon-img"); // Специальный класс для картинки

                // Обработчик ошибки: если картинка не загрузилась, показать заглушку
                img.onerror = () => {
                    img.style.display = 'none';
                    const fallback = document.createElement("span");
                    fallback.className = "spell-icon";
                    fallback.textContent = "❌"; // Или эмодзи по типу
                    btn.insertBefore(fallback, btn.firstChild);
                };

                btn.appendChild(img);
            } else {
                // ВАРИАНТ 2: Нет картинки -> ставим эмодзи
                const iconSpan = document.createElement("span");
                iconSpan.classList.add("spell-icon");

                let iconChar = "✨";
                if (spell.type === "ATTACK") iconChar = "🔥";
                if (spell.type === "HEAL") iconChar = "💚";

                // Если в базе записан просто эмодзи, используем его
                if (spell.icon && !hasIconImage) iconChar = spell.icon;

                iconSpan.textContent = iconChar;
                btn.appendChild(iconSpan);
            }
            // ---------------------

            // 2. ЦЕНА (Мини-бейдж)
            const costsWrapper = document.createElement("div");
            costsWrapper.className = "spell-btn-costs-wrapper";
            for(const [key, val] of Object.entries(spell.baseCost)) {
                const costBadge = document.createElement("span");
                costBadge.className = `spell-btn-cost type-${key}`;
                costBadge.textContent = `${key}:${val}`;
                costsWrapper.appendChild(costBadge);
               // btn.appendChild(costBadge);
            }
            if (costsWrapper.children.length > 0) {
                btn.appendChild(costsWrapper);
            }
            fragment.appendChild(btn);
        });

        container.appendChild(fragment);
        this.ui.spellBtns = container.querySelectorAll(".spell-btn");
    }
    updateSpellPreview(spellData){
        if(!spellData) return;
        const battle = this.ui;
        console.log("*************");
        const modifiers = spellData.modifiers;
        const state = spellData.modifiersState;
        console.log(state);
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
                btnsObj[mod].disabled = !modifiers[mod].enabled
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
        battle.previewName.textContent = `${spellData.name}`;
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
        for(const spellButton of this.ui.spellBtns){
            if(spellButton.dataset.id === spellData.id){
                spellButton.classList.add("selected");
            }
            else{
                spellButton.classList.remove("selected");
            }
        }
        battle.castBtn.disabled = !spellData.isValid;
    }
    resetInterface(){
        const btnModifiers = document.querySelectorAll(".mod-btn");
        for(const btnModifier of btnModifiers){
            btnModifier.disabled = true;
            btnModifier.classList.remove("active");
            const badge = btnModifier.querySelector(".badge");
            if(badge){
                badge.style.display = "none";
            }
        }
       this.ui.previewPower.textContent = "--";
       this.ui.previewName.textContent = "Выбор:";
       this.ui.totalCost.textContent = "";
       for(const key in this.ui.previewEffectsGrid){
           this.ui.previewEffectsGrid[key].textContent = "--";
       }
    }
    _initModifierContainerListener(e){
        this.ui.modifiersPanel.addEventListener("click", (e)=>{
            const btn = e.target.closest(".mod-btn");
            if(btn && !btn.disabled){
                this.eventBus.emit(EVENTS.BATTLE.TOGGLE_MODIFIER_SPELL,{modifierId:btn.dataset.mod});
            }
        })
    }
    surrender(){
        this.eventBus.emit(EVENTS.BATTLE.SURRENDER,{});
    }
    _btnCastListener(){
        this.ui.castBtn.addEventListener("click", (e)=>{
            this.eventBus.emit(EVENTS.BATTLE.APPLAY_CAST,{});
        })
    }
    _updateResources(resources){
        this.ui.battleResourcesContainer.innerHTML = "";
        const fragment = document.createDocumentFragment();
        for(const [key, v] of Object.entries(resources)){
            const span = document.createElement("span");
            span.classList.add(`res-badge`,`type-${key}`);
            span.textContent = `${key}:${v.value}`;
            fragment.appendChild(span);
        }
        this.ui.battleResourcesContainer.appendChild(fragment);
    }
    _addLog({message, type}){
        if(!this.ui.log) throw new Error("Нет элемента лога");
        const div = document.createElement("div");
        div.classList.add("log-entry", type);
        div.textContent = `${message}`;
        this.ui.log.appendChild(div);
        this.ui.log.scrollTop = this.ui.log.scrollHeight;
    }
    setInterfaceInteractivity({isActive}){
        const btns = this.ui.spellsContainer.querySelectorAll(".spell-btn");
        if(btns.length === 0) return
        btns.forEach(btn=>{
            btn.disabled = !isActive;
            btn.classList.remove("selected");
        })
       this.resetInterface();
       this.ui.castBtn.disabled = true;
    }
    _clearLog(){
        if(!this.ui.log) throw new Error("Нет элемента лога");
        this.ui.log.innerHTML = "";
    }
}