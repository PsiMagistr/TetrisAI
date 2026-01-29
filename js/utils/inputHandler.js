class InputHandler {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.isBlocked = false;
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.downKeys = {
            "ArrowRight":()=>{
                this.eventBus.emit(EVENTS.PIECE.MOVE, {dx:1,dy:0});
            },
            "ArrowLeft":()=>{
                this.eventBus.emit(EVENTS.PIECE.MOVE, {dx:-1, dy:0});
            },
            "ArrowDown":()=>{
                this.eventBus.emit(EVENTS.PIECE.ACCELERATE, {mode:true});
            },
            "ArrowUp":()=>{
                this.eventBus.emit(EVENTS.PIECE.ROTATE, {});
            },
            "Space":()=>{
               this.eventBus.emit(EVENTS.GAME.INIT, {});
            },
        }
        this.upKeys = {
            "ArrowDown":()=>{
                this.eventBus.emit(EVENTS.PIECE.ACCELERATE, {mode:false});
            }
        }
        this.eventBus.on(EVENTS.INPUT.SET_BLOCKED, ({state})=>{
            this.isBlocked = state;
        })
        document.addEventListener("keydown", this.handleKeyDown);
        document.addEventListener("keyup", this.handleKeyUp);
    }

    handleKeyUp(event){
        if(this.isBlocked) return;
        if(event.code in this.upKeys){
            this.upKeys[event.code]();
        }
    }
    handleKeyDown(event) {
        if(this.isBlocked) return;
        if(event.code in this.downKeys){
            event.preventDefault();
            this.downKeys[event.code]();
        }
    }
}