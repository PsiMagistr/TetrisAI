class WindowUiManager extends BaseUi{
    constructor(eventBus){
        super(eventBus, document.body);
        this.selectors = {
            overlay:"#game-overlay",
            screens:{
                menu:{
                    window:"#game-menu",
                    modalText:"#modal-text",
                    modalStartButton:"#modal-button",
                },
                battle:{
                     window:"#battle-modal",
                },
            }
        }
        this.ui = this.getElementsBySelectors(this.selectors);
        this.ui.screens.menu.modalStartButton.addEventListener("click", this.startHandler.bind(this));
        this.eventOn(EVENTS.UI.OPEN_MODAL, this.openModal.bind(this));
        this.eventOn(EVENTS.GAME.START, this._closeAll.bind(this));
        this.eventOn(EVENTS.UI.CLOSE_ALL_MODALS, this._closeAll.bind(this));
    }
    _closeAll(){
        if(this.ui.overlay){
            this.ui.overlay.classList.add('hidden');
        }
        Object.values(this.ui.screens).forEach((screen)=>{
            if(screen.window){
                screen.window.classList.add('hidden');
            }
        })
    }
    openModal({key, data={} }){
        const modals = {
            menu:()=>{
                this.ui.screens.menu.modalText.textContent = `Уровень: ${data.level}, Линии:${data.lines}, Очки:${data.score}`///...................
            },
            battle:()=>{
                console.log(`.......`)//////////....................
                console.log(data);
            }
        }
        const targetModal = this.ui.screens[key];
        this._closeAll();
        if(!targetModal?.window){
            console.error(`MainUiManager: Окно "${key}" не найдено`);
            return;
       }
       this.ui.overlay.classList.remove("hidden");
       targetModal.window.classList.remove('hidden');
       if(modals[key]){
            modals[key]();
       }
    }
    startHandler(){
        //if(this.isBlocked) return;
        //this._closeAll()
        this.eventBus.emit(EVENTS.GAME.INIT, {})
    }
}