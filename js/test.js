let a = "Заяц";


async function test(){
    /*return Promise.resolve().then(()=>{
        console.log(a);
    })*/
    await delay(5000);
    console.log(a);
}


function main(){
    test();
    a = "Волк";
}

main();
a = "Зёбра"


/*
* Ты абсолютно прав. В паттерне "Команда" класс InputHandler должен быть универсальным исполнителем, а не хранить в себе жестко зашитую логику Тетриса.

Поэтому "заполнение хранилища" (настройка управления) выносится наружу. Это позволяет в будущем одной строчкой менять управление с Тетриса на Бой.

Вот полный, готовый к копированию код, разбитый на логические блоки.

1. Файл js/events.js (Константы событий)

Чтобы не ошибиться в названиях строк, лучше вынести их отдельно (судя по твоему коду, у тебя это уже есть, но я приведу пример для целостности).

code
JavaScript
download
content_copy
expand_less
const EVENTS = {
    PIECE: {
        MOVE: "move",
        ROTATE: "rotate",
        ACCELERATE: "acceleration",
    },
    GAME: {
        INIT: "initializeGame",
    },
    INPUT: {
        SET_BLOCKED: "set-is-animating"
    }
};
2. Файл js/commands.js (Сами команды)

Здесь лежит логика "ЧТО сделать", но не "КОГДА".

code
JavaScript
download
content_copy
expand_less
// Базовый класс
class Command {
    execute(eventBus) {
        throw new Error('Метод execute должен быть реализован');
    }
}

// --- Команды Тетриса ---

class MovePieceCommand extends Command {
    constructor(dx, dy) {
        super();
        this.dx = dx;
        this.dy = dy;
    }
    execute(eventBus) {
        eventBus.emit(EVENTS.PIECE.MOVE, { dx: this.dx, dy: this.dy });
    }
}

class RotatePieceCommand extends Command {
    execute(eventBus) {
        eventBus.emit(EVENTS.PIECE.ROTATE, {});
    }
}

class AccelerateCommand extends Command {
    constructor(isActive) {
        super();
        this.isActive = isActive; // true = нажали (ускорили), false = отпустили
    }
    execute(eventBus) {
        eventBus.emit(EVENTS.PIECE.ACCELERATE, { mode: this.isActive });
    }
}

class GameInitCommand extends Command {
    execute(eventBus) {
        eventBus.emit(EVENTS.GAME.INIT, {});
    }
}
3. Файл js/inputHandler.js (Обработчик)

Он теперь пустой и чистый. Он просто знает, как вызывать команды, которые в него положат.

code
JavaScript
download
content_copy
expand_less
class InputHandler {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.isBlocked = false;

        // Хранилище: Code -> Type -> Command
        // Пример структуры: { "ArrowLeft": { "keydown": MovePieceCommandInstance } }
        this.keyMap = new Map();

        // Привязываем контекст
        this.handleEvent = this.handleEvent.bind(this);

        // Подписки
        this.eventBus.on(EVENTS.INPUT.SET_BLOCKED, ({ state }) => {
            this.isBlocked = state;
        });

        this.init();
    }

    init() {
        document.addEventListener("keydown", (e) => this.handleEvent(e, "keydown"));
        document.addEventListener("keyup", (e) => this.handleEvent(e, "keyup"));
    }

    // Метод для назначения кнопки (самый важный!)
    bind(keyCode, eventType, command) {
        // Если для этой кнопки еще нет записей, создаем пустой объект
        if (!this.keyMap.has(keyCode)) {
            this.keyMap.set(keyCode, {});
        }

        // Записываем команду для конкретного типа события (keyup/keydown)
        const keyActions = this.keyMap.get(keyCode);
        keyActions[eventType] = command;
    }

    // Метод для полной очистки (нужен при смене режима игры Тетрис <-> РПГ)
    clear() {
        this.keyMap.clear();
    }

    handleEvent(event, type) {
        if (this.isBlocked) return;

        // 1. Проверяем, есть ли что-то на эту кнопку
        if (!this.keyMap.has(event.code)) return;

        // 2. Получаем объект действий для кнопки
        const actions = this.keyMap.get(event.code);

        // 3. Проверяем, есть ли команда для текущего типа события (keydown/keyup)
        const command = actions[type];

        if (command) {
            // Если это нажатие, можно отменить дефолтное поведение браузера (скролл)
            if(type === "keydown" && ["ArrowUp", "ArrowDown", "Space"].includes(event.code)) {
                event.preventDefault();
            }

            // 4. ВЫПОЛНЯЕМ КОМАНДУ
            command.execute(this.eventBus);
        }
    }

    // Метод для удаления слушателей (если нужно полностью убить объект)
    dispose() {
        document.removeEventListener("keydown", this.handleEvent);
        document.removeEventListener("keyup", this.handleEvent);
    }
}
4. Файл js/main.js (Настройка)

Вот здесь происходит магия. Мы создаем инстанс хендлера и заполняем его командами.

code
JavaScript
download
content_copy
expand_less
// ... внутри window.onload или init функции ...

// 1. Создаем пустой обработчик
const inputHandler = new InputHandler(eventBus);

// 2. Функция настройки управления для Тетриса
function setupTetrisControls() {
    console.log("Activations Tetris Controls");
    inputHandler.clear(); // Сбрасываем всё, что было до этого

    // --- Движение ---
    // ArrowRight + keydown -> Move(1, 0)
    inputHandler.bind("ArrowRight", "keydown", new MovePieceCommand(1, 0));

    // ArrowLeft + keydown -> Move(-1, 0)
    inputHandler.bind("ArrowLeft", "keydown", new MovePieceCommand(-1, 0));

    // --- Вращение ---
    // ArrowUp + keydown -> Rotate
    inputHandler.bind("ArrowUp", "keydown", new RotatePieceCommand());

    // --- Ускорение (Soft Drop) ---
    // ArrowDown + keydown -> Включить ускорение
    inputHandler.bind("ArrowDown", "keydown", new AccelerateCommand(true));

    // ArrowDown + keyup -> Выключить ускорение (важно!)
    inputHandler.bind("ArrowDown", "keyup", new AccelerateCommand(false));

    // --- Управление игрой ---
    // Space + keydown -> Рестарт
    inputHandler.bind("Space", "keydown", new GameInitCommand());
}

// 3. Функция настройки управления для Битвы (заготовка на будущее)
function setupBattleControls() {
    console.log("Activations Battle Controls");
    inputHandler.clear();

    // Пример: В бою стрелки могут выбирать врага, а не двигать фигуру
    // inputHandler.bind("ArrowRight", "keydown", new SelectNextTargetCommand());
    // inputHandler.bind("Space", "keydown", new UseAbilityCommand());
}


// ЗАПУСК: Сразу активируем управление тетрисом
setupTetrisControls();


// ... дальше инициализация Game, ResourceManager и т.д. ...
Как теперь переключаться?

Когда у тебя срабатывает триггер начала битвы (в BattleManager), ты можешь просто вызвать функцию настройки:

code
JavaScript
download
content_copy
expand_less
// BattleManager.js
handleBattleTrigger() {
   // ... логика открытия окна ...

   // Переключаем управление на боевое!
   // (фигуры тетриса перестанут двигаться при нажатии стрелок, даже если цикл игры не остановлен)
   setupBattleControls();
}

// Когда бой закончен и окно закрывается:
setupTetrisControls();
*
*
*
* // Пример структуры: { "ArrowLeft": { "keydown": MovePieceCommandInstance }
* */




function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let s = 0

async function main(){
    test()
    s++;
    console.log(s)
    window.requestAnimationFrame(main)
}

async function test(){
    await delay(5000);
}



let lastTime = performance.now();
let dropCounter = 0;
let dropInterval = 5000;
let counter = 0;
loop = (time) => {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        counter++;
        console.log(counter);
        dropCounter -= dropInterval;
    }
    window.requestAnimationFrame(loop);

}
window.requestAnimationFrame(loop);



const arr = ["Vasya"];

arr.forEach((item) => {
    arr.push("Petya");
    if(item == "Petya"){
        alert();
    }
    arr.push("Petya");
})



/*
* Вдруг, ниоткуда, возникает чувство,
Что невесом сюжет и типажи.
Здесь поднималась до высот искусства
Провинции глухой земная жизнь.
Тоска здесь та, что согревает сердце.
* ..................................................
*
*
*
*
*
*
* const changeModifier = (btn) => {
            /*S:(btn)=>{
               //state.S? btn.classList.add("active"):btn.classList.remove("active");
            },
            Z:(btn)=>{
                state.Z? btn.classList.add("active"):btn.classList.remove("active");
            },
            J:(btn)=>{
                const bage = btn.querySelector("span");
                if(state.J > 0){
                    bage.style.display = "block";
                    btn.classList.add("active");
                }
                else{
                    bage.style.display = "none";
                    btn.classList.remove("active");
                }
                bage.textContent = `x${state.J}`;
            },
            I:(btn)=>{
              const bage = btn.querySelector("span");
              if(state.I){
                  bage.style.display = "block";
                  btn.classList.add("active");
              }
              else{
                  btn.classList.remove("active");
                  bage.style.display = "none";
              }
              bage.textContent = `+${state.I}`;
            }*/
for(const key in this.state){
    /*if(key == "S" || key == "Z"){
        alert("hh")
        this.state[key]? btn.classList.add("active"):btn.classList.remove("active");
    }
    else{
        const bage = btn.querySelector("span");
        if(this.state[key] > 0){
            bage.style.display = "block";
            btn.classList.add("active");
            bage.textContent = `+${this.state[key]}`;
        }
        else{
            btn.classList.remove("active");
            bage.style.display = "none";
        }
    }*/
    alert(key)
}
* if(state[key] > 0){
    bage.textContent = `+${state[key]}`;
    bage.style.display = "block";
}
else{
    bage.style.display = "none";
}
*
* */




