class AnimationContainer{
    constructor(animChain){
        this.animaChain = animChain;
        this.isDeleted = false;
        this.active = null;
    }
    move(deltaTime){
        if(this.animaChain.length == 0) return;
        this.active = this.animaChain[0];
        this.active.move(deltaTime);
        if(this.active.isDeleted){
            this.animaChain.shift();
        }
        if(this.animaChain.length == 0){
            this.isDeleted = true;
        }
    }
}

class AnimationSpellFactory{
    constructor() {
    }
    createSpellAnimation(caster, target, configChain, callback){
        const defSize = GRAPHICS_CONFIG.units.defaultSize;
        const centers = {
            caster:{
                x:caster.avatar.x + (caster.avatar.width || defSize) / 2,
                y:caster.avatar.y + (caster.avatar.width || defSize) / 2,
            },
            target:{
                x:target.avatar.x + (target.avatar.width || defSize) / 2,
                y:target.avatar.y + (target.avatar.width || defSize) / 2,
            },
        }
        const chain = [];
        const animationList = {
            jerk:Jerk,
            fireball:Fireball,
            flashEffect:FlashEffect,
            overlayEffect:OverlayEffect,
        }
        for(let link of configChain){
            const params = {...link};
            const keys = ["speed", "distance", "callback"];
            keys.forEach((key)=>{
                if(key == "speed" || key == "distance"){
                    params[key] = centers.caster.x < centers.target.x ? Math.abs(params[key]) : -Math.abs(params[key]);
                }
                else if(key == "callback"){
                    params.callback = callback;
                }
            })
            const size = params.size || 0;
            const startPoint = params.startFrom === "target"?centers.target:centers.caster;
            params.x = startPoint.x - (size / 2);
            params.y = startPoint.y - (size / 2);
            params.targetX = centers.target.x;
            params.caster = caster;
            params.target = target;
            const AnimationClass = animationList[params.type];
            //console.log("Параметры центровки");
            //console.log(params);
            if (AnimationClass) {
                chain.push(new AnimationClass(params));
            } else {
                throw new Error(`AnimationSpellFactory: Класс анимации "${params.type}" не найден.`);
            }

        }
        return new AnimationContainer(chain)
    }
}




class Fireball{
    constructor({x,y,speed,size,color,targetX,callback, isUseCallback}){
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.size = size;
        this.color = color;
        this.targetX = targetX,
        this.fn = callback;
        this.isDeleted = false;
        this.isUseCallback = isUseCallback;
    }
    isCollision(){
        if(this.speed > 0){
            if(this.x >= this.targetX){
                this.isDeleted = true;
                return  this.isDeleted;
            }
        }
        if(this.speed < 0){
            if(this.x <= this.targetX){
                this.isDeleted = true;
                return  this.isDeleted;
            }
        }

    }
    move(){
        this.x += this.speed;
        const useCallback = this.useCallback || false;
        if(this.isCollision() && this.isUseCallback){
             this.fn();
        }
    }
    draw(ctx){
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

class Jerk {
    constructor({ caster, distance = 30, duration = 300 }) {
        this.caster = caster;
        // Запоминаем старт
        this.startX = this.caster.avatar.x;
        // Дистанция рывка (положительная или отрицательная)
        this.distance = distance;
        this.duration = duration;
        this.elapsedTime = 0;
        this.isDeleted = false;

        // НАСТРОЙКИ ЗАМАХА
        this.backswingRatio = 0.3; // 30% времени тратим на замах
        this.backswingForce = 0.3; // Откатываемся на 30% от силы удара
    }

    move(deltaTime) {
        if (this.isDeleted) return;

        // 1. Накапливаем время
        this.elapsedTime += (deltaTime || 16);
        const progress = this.elapsedTime / this.duration;

        // 2. Финиш
        if (progress >= 1) {
            this.caster.avatar.x = this.startX; // Жесткий сброс в ноль
            this.isDeleted = true;
            return;
        }

        let offset = 0;
        // Величина отката в пикселях (например, 10px назад)
        const backDist = this.distance * this.backswingForce;

        // --- ФАЗА 1: ЗАМАХ (Откат назад) ---
        if (progress < this.backswingRatio) {
            // Нормализуем прогресс внутри этой фазы (от 0.0 до 1.0)
            const phaseP = progress / this.backswingRatio;

            // Двигаемся от 0 до -backDist
            // Используем половинку синуса для плавного разгона назад
            offset = -backDist * Math.sin(phaseP * Math.PI / 2);
        }

        // --- ФАЗА 2: УДАР (Выпад вперед и возврат) ---
        else {
            // Нормализуем прогресс для второй фазы (от 0.0 до 1.0)
            const phaseP = (progress - this.backswingRatio) / (1 - this.backswingRatio);

            // 1. Основная волна удара (0 -> Максимум -> 0)
            const attackWave = Math.sin(phaseP * Math.PI) * this.distance;

            // 2. Плавное гашение отката (чтобы не было скачка)
            // Мы начинаем с позиции -backDist и линейно идем к 0
            const recovery = -backDist * (1 - phaseP);

            // Складываем волну удара и затухающий откат
            offset = attackWave + recovery;
        }
        // 3. Применяем
        this.caster.avatar.x = this.startX + offset;
    }

}

class FlashEffect {
    constructor({ target, duration = 700, callback, isUseCallback }) {
        this.target = target;       // Объект Юнита (Hero или Enemy)
        this.duration = duration;   // Длительность вспышки (мс)
        this.callback = callback;   // Функция onHit (нанесение урона)
        this.isUseCallback = isUseCallback;
        this.elapsedTime = 0;
        this.isDeleted = false;
    }

    move(deltaTime) {
        if (this.isDeleted) return;

        // 1. Накапливаем время
        this.elapsedTime += (deltaTime || 16);

        // 2. Считаем прогресс (от 0.0 до 1.0)
        const progress = this.elapsedTime / this.duration;

        // 3. Проверка окончания
        if (progress >= 1) {
            this._finish();
            return;
        }

        // 4. Математика мигания (Синусоида)
        // Math.sin(0..PI) дает дугу: 0 -> 1 -> 0
        const flashIntensity = Math.sin(progress * Math.PI);

        // Прозрачность: 1.0 -> 0.2 -> 1.0
        // (Мы не уходим в 0, чтобы персонаж не исчез полностью)
        const newOpacity = 1 - (flashIntensity * 0.8);

        // Применяем к аватару юнита
        if (this.target && this.target.avatar) {
            this.target.avatar.opacity = newOpacity;
        }
    }

    _finish() {
        // 1. Жесткий сброс прозрачности (чтобы не застрял полупрозрачным)
        if (this.target && this.target.avatar) {
            this.target.avatar.opacity = 1;
        }

        // 2. Вызываем боевую логику (Урон)
        if (this.callback && this.isUseCallback) {
            this.callback();
        }
        // 3. Удаляем эффект
        this.isDeleted = true;
    }
}

class OverlayEffect{
    constructor({x,y,size, duration,color,callback, isUseCallback}) {
        this.isDeleted = false;
        this.x = x;
        this.y = y;
        this.size = size;
        this.duration = duration;
        this.color = color;
        this.callback = callback;
        this.opacity = 0;
        this.elapsedTime = 0;
        this.isUseCallback = isUseCallback || false;
    }
    move(deltaTime){
        this.elapsedTime += (deltaTime || 16);
        const progress = this.elapsedTime / this.duration;
        // 3. Проверка окончания
        this.opacity = Math.abs(Math.sin(progress * Math.PI));
        if (progress >= 3) {
           this._finish();

        }

        // 4. Математика мигания (Синусоида)

    }
    _finish(){
            if(this.isUseCallback){
                this.callback();
            }
            this.isDeleted = true;
    }
    draw(ctx){
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}