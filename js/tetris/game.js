//////////////////////////////////////
class Game extends Subscriber {
    constructor(eventBus, grid, previewGrid, pieceFactory, config = {}) {
        super(eventBus);
        this.lastTime = null;// performance.now();
        this.dropCounter = 0;
        this.grid = grid;
        this.previewGrid = previewGrid;
        this.pieceFactory = pieceFactory;
        this.bagGenerator = this.pieceFactory.bagGenerator();
        this.loopRequestID = null;
        this.currentPiece = null;
        this.nextPiece = null;
        this.level = 1;
        this.lines = 0;
        this.score = 0;
        this.levelByLines = 10;
        this.isAnimating = false;
        this.piecesDropped = 0;
        this.speeds = [10,500, 400, 300, 200, 100, 90, 80, 70, 60, 50, 40];
        this.dropInterval = this.speeds[this.level];
        this.pieceLimit = config.pieceLimit || Infinity;
        this.setupSubscribtions();
        this.isRunning = false;
        this.eventBus.emit(EVENTS.UI.UPDATE_STATS, this.uiState());
    }
    getRenderState() {
        return {
            matrix: this.grid.matrix,
            piece: this.currentPiece,
            nextMatrix: this.previewGrid.matrix,
            nextPiece: this.nextPiece,
        };
    }

    moveHandler({dx, dy}) {
        this.move(dx, dy);
    }

    accelerationHandler({mode}){
        this.applyAcceleration(mode);
    }

    rotateHandler({}) {
        this.rotate();
    }

    setupSubscribtions() {
        this.eventOn(EVENTS.PIECE.MOVE, this.moveHandler.bind(this), "move");//"move"
        this.eventOn(EVENTS.PIECE.ROTATE, this.rotateHandler.bind(this), "rotate");
        this.eventOn(EVENTS.PIECE.ACCELERATE, this.accelerationHandler.bind(this), "accelerate");
        this.eventOn(EVENTS.PIECE.LOCK, this.lockPiece.bind(this), "lockPiece");
        this.eventOn(EVENTS.GAME.START,this.start.bind(this), "gameStartKey");
        this.eventOn(EVENTS.GAME.RESET, this.resetGame.bind(this), "gameResetKey");
    }

    loop = (time) => {
        /*if (!this.isRunning) {
            this.loopRequestID = null;
            return;
        }*/
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.eventBus.emit(EVENTS.PIECE.MOVE, {dx: 0, dy: 1});
            if(this.loopRequestID == null) return
            this.dropCounter -= this.dropInterval;
        }
        this.eventBus.emit(EVENTS.RENDER.STANDARD, this.getRenderState());
        this.loopRequestID = window.requestAnimationFrame(this.loop);
    }

    spawnNewPiece() {
        if (this.nextPiece == null) {
            const currentType = this.bagGenerator.next().value;
            const nextType = this.bagGenerator.next().value;
            this.currentPiece = this.pieceFactory.generatePieceByType(currentType, this.grid.width, this.grid.height);
            this.nextPiece = this.pieceFactory.generatePieceByType(nextType, this.previewGrid.width, this.previewGrid.height, true);

        } else {
            const nextType = this.bagGenerator.next().value;
            this.currentPiece = this.pieceFactory.generatePieceByType(this.nextPiece.type, this.grid.width, this.grid.height);
            this.nextPiece = this.pieceFactory.generatePieceByType(nextType, this.previewGrid.width, this.previewGrid.height, true);
        }
    }

    move(dx, dy) {
        if (this.currentPiece === null) return;
        const moved = this.currentPiece.move(dx, dy);
        if (!this.grid.isCollision(moved)) {
            this.currentPiece = moved;
            if (dy === 1) {
                this.dropCounter = 0;
            }
        } else if (dy == 1) {
            this.eventBus.emit(EVENTS.PIECE.LOCK, {piece: this.currentPiece});
        }
    }

    applyAcceleration(mode){
        this.dropCounter = 0;
        if(mode){
            this.dropInterval = this.speeds[0];
        }
        else{
            let level = this.level < this.speeds.length? this.level:this.speeds.length - 1;
            this.dropInterval = this.speeds[level];
        }
    }

    rotate() {
        if (this.currentPiece === null) return;
        const rotated = this.currentPiece.rotate();
        if (!this.grid.isCollision(rotated)) {
            this.currentPiece = rotated;
        }
    }

    async handleClearance(blinkedIndexes,shouldResume = true){
        this.eventBus.emit(EVENTS.INPUT.SET_BLOCKED, {state: true});
        this.isAnimating = true;
        this.stopLoop();
        await this.eventBus.emitAsync(EVENTS.ANIMATION.START, {
            count: 30,
            time: 100,
            indexes: blinkedIndexes,
            matrix: this.grid.matrix
        });
        // Подсчет ресурсов здесь.
        const clearedCellColors = this.grid.getClearedLineColors();
        this.eventBus.emit(EVENTS.RESOURCES.CALCULATE, {clearedCellColors:clearedCellColors});
        const previousLevelThreshold = Math.floor(this.lines / this.levelByLines);
        this.lines += this.grid.deleteLines();
        const newLevelThreshold = Math.floor(this.lines / this.levelByLines);
        if(newLevelThreshold > previousLevelThreshold){
            this.level = newLevelThreshold + 1;
            //console.log("Seledka " + this.level)
        }
        this.eventBus.emit(EVENTS.RENDER.FORCE, this.getRenderState()); //Надо или нет - проясним
        this.eventBus.emit(EVENTS.UI.UPDATE_STATS, this.uiState());
        this.eventBus.emit(EVENTS.INPUT.SET_BLOCKED, {state: false});
        this.isAnimating = false;
        if(shouldResume){
            this.startLoop();
        }

    }

    async lockPiece({piece}) {
        this.grid.matrix = this.grid.getMergedMatrix(piece);
        this.piecesDropped++;
        const isLimitReached = this.piecesDropped >= this.pieceLimit;
        const blinkedIndexes = this.grid.getBlinkedIndexes();
        const linesCleared = blinkedIndexes.length > 0;// Использование флага для ясности
        if (linesCleared) {
            await this.handleClearance(blinkedIndexes, !isLimitReached);
        }
        if(isLimitReached){
             console.log(this.piecesDropped);
             this.stopLoop();
             //this.eventBus.emit("battleTrigger", this.uiState());
             this.eventBus.emit(EVENTS.GAME.LIMIT_REACHED, this.uiState())
             return;
        }
        this.spawnNewPiece();
        if (this.grid.isCollision(this.currentPiece)) {
            this.eventBus.emit(EVENTS.RENDER.FORCE, this.getRenderState());
            this.stopLoop();
            this.eventBus.emit(EVENTS.GAME.END, {});//gameEnd"
        }
    }

    uiState() {
        return {
            level: this.level,
            lines: this.lines,
            score: this.score
        }
    }
    start() {
        if(!this.startLoop()) return;
        this.spawnNewPiece();
    }

    startLoop(){
        if (this.loopRequestID !== null) {
            return false
        }
        //if (this.isRunning) { // Проверяем НОВЫЙ ФЛАГ
        // return
        // }
        this.isRunning = true;
        this.dropCounter = 0;
        this.lastTime = performance.now();
        this.dropInterval = this.speeds[this.level];
        this.loopRequestID = window.requestAnimationFrame(this.loop);
        return true;
    }

    stopLoop() {
        if (this.loopRequestID) {
            window.cancelAnimationFrame(this.loopRequestID);
            this.loopRequestID = null;
        }
        this.isRunning = false;

    }
    resetGame(){
        this.stopLoop();
        this.grid = new Grid(this.grid.width, this.grid.height);
        this.previewGrid = new Grid(this.previewGrid.width, this.previewGrid.height);
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.piecesDropped = 0;
        this.currentPiece = null;
        this.nextPiece = null;
        this.eventBus.emit(EVENTS.RENDER.STANDARD, this.getRenderState());
        this.eventBus.emit(EVENTS.UI.UPDATE_STATS, this.uiState());
    }
}



