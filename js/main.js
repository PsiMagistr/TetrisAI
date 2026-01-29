window.addEventListener("load", async function (){
    const GAME_CONFIG ={
        mainGrid:{width:10,height:20},
        previewGrid:{width:6,height:6},
        cellSize:30,
        colors:["#CCCCCC", "red", "blue", "green", "yellow", "orange", "#DB7093", "cyan", "#FAEBD7"],
    }
    const canvas =  document.querySelector("#game-board");
    const nextCanvas = document.querySelector("#next-piece-board");
    const battleCanvas = document.querySelector("#battle-canvas");
    const eventBus = new EventBus();
    const render = new Renderer(canvas, nextCanvas, eventBus, GAME_CONFIG.cellSize, GAME_CONFIG.colors);
    new BattleRenderer(battleCanvas, eventBus, GRAPHICS_CONFIG);
    new WindowUiManager(eventBus);
    new BattleUi(eventBus);
    //new UIManager(eventBus);
    new TetrisUi(eventBus);
    const resourceManager = new ResourceManager(eventBus);
    const assetsManager = new AssetManager();
    new BattleManager(eventBus, resourceManager, assetsManager, ASSETS_CONFIG.SPRITES, GRAPHICS_CONFIG);
    new AnimationManager(eventBus);
    new InputHandler(eventBus);
    ////////////////////////////////////////////
    let game = null;
    function gameInit(){
        const grid = new Grid(GAME_CONFIG.mainGrid.width, GAME_CONFIG.mainGrid.height);
        const previewGrid = new Grid(GAME_CONFIG.previewGrid.width, GAME_CONFIG.previewGrid.height);
        const pieceFactory = new PieceFactory();
        const config = {
            pieceLimit:20,
        }
        const game = new Game(eventBus, grid, previewGrid, pieceFactory, config);
        eventBus.emit(EVENTS.RENDER.STANDARD, game.getRenderState());
        return game;
    }

    function handleVisibilityChange() {
        if (game && !game.isAnimating) {
            if (document.hidden) {
                // ...
                if (game.loopRequestID) {
                    window.cancelAnimationFrame(game.loopRequestID);
                    game.loopRequestID = null;
                }
            }else {
                // ...
                if (game.loopRequestID === null) {
                    game.lastTime = null; // <--- ИСПРАВЛЕНИЕ
                    game.loopRequestID = window.requestAnimationFrame(game.loop);
                }
            }
        }
    }

    // Подписываемся на событие браузера

    function initializeGame(){
        console.log("Initializing game...");
        //if(game.isAnimating) return
        if (game && !game.isAnimating) {
            game.stopLoop();
            game.dispose();
        }
        game = gameInit();
        eventBus.emit(EVENTS.GAME.START, {});
    }

    function gameEnd(){
        if (game) {
            game.stopLoop()
            game.dispose();
            eventBus.emit(EVENTS.UI.OPEN_MODAL, {
                key:"menu",
                data:{
                    level:game.level,
                    lines:game.lines,
                    score:game.score,
                }
            }/*game.uiState()*/)
        }
    }
    eventBus.on(EVENTS.GAME.INIT, initializeGame); //"initializeGame"
    eventBus.on(EVENTS.GAME.END, gameEnd);
    //document.addEventListener("visibilitychange", handleVisibilityChange);
    game = gameInit();
    //



    //


})

