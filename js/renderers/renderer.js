class Renderer extends Subscriber{
    constructor(canvas, nextCanvas, eventBus, size, colors){
        super(eventBus);
        this.canvas = canvas;
        this.nextCanvas = nextCanvas;
        this.ctx = this.canvas.getContext('2d');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.eventBus = eventBus;
        this.size = size;
        this.colors = colors;
        this.renderCallBack = ({matrix, piece, nextMatrix, nextPiece})=>{
            this.draw(matrix, piece, nextMatrix, nextPiece);
        }
        this.animationRenderCallback = ({matrix, indexes, count})=>{
            let matrixToDraw;
            if(count % 2 == 0){
                matrixToDraw = matrix;
            }
            else{
                matrixToDraw = this.prepareBlinkMatrix(matrix, indexes);
            }
            this.drawGrid(this.ctx, matrixToDraw);
        }
        this.modeCallback = ({mode})=>{
            this.dispose();
            this.eventOn(EVENTS.RENDER.SET_MODE, this.modeCallback);
            this.eventOn(EVENTS.RENDER.FORCE, this.renderCallBack);
            if(mode === "animation"){
                this.eventOn(EVENTS.RENDER.ANIMATION_STEP, this.animationRenderCallback);
            }else if(mode === "game"){
                this.eventOn(EVENTS.RENDER.STANDARD, this.renderCallBack);
            }
        }
        this.eventOn(EVENTS.RENDER.STANDARD, this.renderCallBack);
        this.eventOn(EVENTS.RENDER.FORCE, this.renderCallBack);
        this.eventOn(EVENTS.RENDER.SET_MODE, this.modeCallback); //"set-render-mode"
    }
    drawCell(ctx, x, y, colorIndex){
        const space = 1;
        ctx.fillStyle = this.colors[colorIndex];
        ctx.fillRect(x * (this.size+space), y * (this.size+space), this.size, this.size);
    }
    drawGrid(ctx, matrix){
        for(let y=0; y < matrix.length; y++){
            for(let x=0; x < matrix[y].length; x++){
                this.drawCell(ctx, x, y, matrix[y][x]);
            }
        }
    }
    drawPiece(ctx, matrix, piece){
        if(piece === null) return;
        for(let y =0; y < piece.body.length; y++){
            for(let x =0; x < piece.body[y].length; x++){
                let gridX = piece.x + x;
                let gridY = piece.y + y;
                if(inArray(gridX, gridY, matrix) && piece.body[y][x] !== 0){
                    this.drawCell(ctx, gridX, gridY, piece.body[y][x]);
                }
            }
        }
    }
    draw(matrix, piece, nextMatrix, nextPiece){
        this.drawGrid(this.ctx, matrix);
        this.drawPiece(this.ctx, matrix, piece);
        this.drawGrid(this.nextCtx, nextMatrix);
        this.drawPiece(this.nextCtx, nextMatrix, nextPiece);
    }
    prepareBlinkMatrix(matrix, blinkedIndexes, blinkColorIndex = 8){
        let blinkedMatrix = matrix.map((row)=>[...row]);
        const blinkedRow =new Array(blinkedMatrix[0].length).fill(8);
        for(let i = 0; i < blinkedIndexes.length; i++){
            const blinkedIndex = blinkedIndexes[i];
            blinkedMatrix[blinkedIndex] = blinkedRow;
        }
        return blinkedMatrix;
    }
}