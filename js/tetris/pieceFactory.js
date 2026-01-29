const  TETROMINOS = {
    T:{
        body:[
            [0,1,0],
            [1,1,1],
            [0,0,0]
        ],
        color:1
    },
    L:{
        body:[
            [0,2,0],
            [0,2,0],
            [0,2,2]
        ],
        color:2
    },
    J:{
        body:[
            [0,3,0],
            [0,3,0],
            [3,3,0]
        ],
        color:3
    },
    I:{
        body:[
            [0, 0, 0, 0],
            [4, 4, 4, 4],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color:4
    },
    Z:{
        body:[
            [5,5,0],
            [0,5,5],
            [0,0,0],
        ],
        color:5
    },
    S:{
        body:[
            [0,6,6],
            [6,6,0],
            [0,0,0],
        ],
        color:6
    },
    O:{
        body:[
            [7,7],
            [7,7],
        ],
        color:7
    }
}

class Piece {
    constructor(type, body, color, x, y){
        this.type = type;
        this.color = color;
        this.body = body;
        this.x = x;
        this.y = y;
    }
    clone(){
        return new Piece(
            this.type,
            this.body.map(row=>[...row]),
            this.color,
            this.x,
            this.y,
          );
    }
    move(dx, dy){
        const clone= this.clone();
        clone.x += dx;
        clone.y += dy;
        return clone;
    }
    rotate(){
        const clone=this.clone();
        const len = this.body.length;
        const body = this.body;
        clone.body = this.body.map(
            (row,y)=>
            row.map((cell, x)=>body[len - 1 - x][y])
        );
        return clone;
    }
}

class PieceFactory{
    constructor(){
        this.types = Object.keys(TETROMINOS);
    }
    _createPiece(type, gridWidth, gridHeight, preview = false){
        const data = TETROMINOS[type];
        const x = Math.floor(gridWidth / 2 - data.body[0].length / 2);
        const y = preview ? x : 0;
        return new Piece(type, data.body, data.color, x, y);
    }
    generateRandomPiece(gridWidth, gridHeight, preview = false){
        const typeIndex = Math.floor(Math.random() * this.types.length);
        const type = this.types[typeIndex];
        return this._createPiece(type, gridWidth, gridHeight, preview);
    }
    generatePieceByType(type, gridWidth, gridHeight, preview = false){
        return this._createPiece(type, gridWidth, gridHeight, preview);
    }

    *bagGenerator(etalon = ["I","T","L","J","O","Z", "S"]){
        function suffle(a){
            for(let i = a.length-1; i>=0; i--){
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }
        while(true){
            const types = suffle([...etalon]);
            for(let type of types){
                yield type;
            }
        }
    }
}