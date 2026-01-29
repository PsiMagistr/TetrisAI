class TetrisUi extends BaseUi{
    constructor(eventBus){
        super(eventBus, "#tetris-wrapper");
        this.isBlocked = false;
        this.resourcesCache = {};
        this.selectors = {
            stats:{
                score:"#score",
                lines:"#lines",
                level:"#level",
            },
            resources: {
                container: "#resources-container", // Сама боковая колонка
                panel: "#main-resources-panel"     // Внутренний список
            },
            buttons: {
                start: "#start-button"
            }

        }
        this.ui = this.getElementsBySelectors(this.selectors);
        this.eventOn(EVENTS.RESOURCES.UPDATE, this.updateResources.bind(this));
        this.eventBus.on(EVENTS.UI.UPDATE_STATS, this.updateStats.bind(this));
        this.eventBus.on(EVENTS.INPUT.SET_BLOCKED,({state})=>{
            this.isBlocked = state;
        });
        this.ui.buttons.start.addEventListener("click", this.startHandler.bind(this));
    }
    _createResourcePanel(){//Panels
        if (!this.root) throw new Error("Нет элемента tetrisWrapper");
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
        this.root.appendChild(aside);
        this.ui.resourcesContainer = aside;
        this.ui.resources.panel = resourcesPanel;
        return resourcesPanel;
    }
    addDivElement(id, resource_panel){
        console.log(id)
        const newDiv = document.createElement("div");
        newDiv.id = id;
        resource_panel.appendChild(newDiv);
        return newDiv;
    }
    updateStats({level, lines, score}){
        this.ui.stats.level.textContent = level;
        this.ui.stats.lines.textContent = lines;
        this.ui.stats.score.textContent = score;
    }
    updateResources(resources){
        if(Object.keys(resources).length == 0) return;
        if (!this.ui.resources.panel) {
            this._createResourcePanel();
        }
        if (this.ui.resources.container){
            this.ui.resources.container.classList.remove("hidden");
        }
        for(let key in resources){
            const id = `resource-${key}`;
            if(!this.resourcesCache[key]){
                const newDiv = this.addDivElement(id, this.ui.resources.panel);
                this.resourcesCache[key] = newDiv;
            }
            this.resourcesCache[key].textContent = `${resources[key].label}:${resources[key].value}`;
        }
        console.log("RESOURSES")
        console.log(resources)
    }
    startHandler(){
        if(this.isBlocked) return;
        this.eventBus.emit(EVENTS.GAME.INIT, {})
    }
}