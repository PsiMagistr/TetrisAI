class Grid{
    constructor(gw, gh){
        this.matrix = new Array(gh).fill(0).map(()=>new Array(gw).fill(0));
        this.width = gw;
        this.height = gh;
    }
    /*static inArray(x, y, array){
        return x >= 0 && x < array[0].length && y >= 0 && y < array.length;
    }*/

    getMergedMatrix(piece){
        const result = this.matrix.map(row => [...row]);
        for(let y=0; y < piece.body.length; y++){
            for(let x=0; x < piece.body[y].length; x++){
                const color = piece.body[y][x];
                const gridY = piece.y + y;
                const gridX = piece.x + x;
                if(inArray(gridX, gridY, this.matrix) && color !== 0){
                    result[gridY][gridX] = color;
                }
            }
        }
        return result;
    }
        isCollision(piece){
            for(let y=0; y < piece.body.length; y++){
                for(let x=0; x < piece.body[y].length; x++){
                    let gridX = piece.x + x;
                    let gridY = piece.y + y;
                    if(piece.body[y][x] > 0) {
                        if(!inArray(gridX, gridY, this.matrix)) {
                            return true;
                        }
                        else if(this.matrix[gridY][gridX] > 0){
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        mergeMatrix(piece){
            for(let y=0; y < piece.body.length; y++){
                for(let x=0; x < piece.body[y].length; x++){
                    const color = piece.body[y][x];
                    const gridY = piece.y + y;
                    const gridX = piece.x + x;
                    if(Grid.inArray(gridX, gridY, this.matrix) && color !== 0){
                       this.matrix[gridY][gridX] = color;
                    }
                }
            }
        }
        deleteLines(){
            let deletedLines = 0;
            let W = this.matrix.length -1;
            for(let R = this.matrix.length -1; R >= 0; R--){
                let fillLine = this.matrix[R].every((cell)=>cell > 0);
                if(fillLine){
                    deletedLines++;
                }else{
                    if(R != W){
                        this.matrix[W] = [...this.matrix[R]];
                    }
                    W--;
                }
            }
            for(let i=0; i < deletedLines;i++){
                this.matrix[i]  = new Array(this.matrix[0].length).fill(0);
            }
            return deletedLines;
        }
        getBlinkedIndexes(){
            const blinkedIndexes = [];
            for(let y = this.matrix.length - 1; y >= 0; y--){
                if(this.matrix[y].every(cell=>cell == 0)){
                    return blinkedIndexes;
                }
                if(this.matrix[y].every(cell=>cell > 0)){
                   blinkedIndexes.push(y);
                }
            }
            return blinkedIndexes;
        }

        getClearedLineColors(){
            const colors = [];
            for(let R = this.matrix.length -1; R >= 0; R--){
              if(this.matrix[R].every(cell=>cell == 0)) return colors;
              let isFilled = this.matrix[R].every(cell=>cell > 0)
              if(isFilled){
                  colors.push(...this.matrix[R]);
              }
            }
           return colors;
        }
}