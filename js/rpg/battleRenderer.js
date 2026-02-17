class BattleRenderer extends Subscriber{
    constructor(canvas, eventBus, config) {
        super(eventBus);
        this.canvas = canvas;
        this.canvas.width = config.canvas.width;
        this.canvas.height = config.canvas.height;
        this.ctx = this.canvas.getContext('2d');
        this.config = config;
        this.eventOn(EVENTS.BATTLE.RENDER_FRAME, this.draw.bind(this));
    }
    clear(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    drawResource(x, y, resource){
        this.ctx.fillStyle = "white";
        this.ctx.font = "14px Arial";
        this.ctx.fillText(`${resource.label}:${resource.value}`, x, y);
    }
    drawResources(resources){
        this.ctx.save();
        this.ctx.translate(20, 20);
        for(let i = 0; i < resources.length; i++){
            this.drawResource(0, (i+1) * 15, resources[i])
        }
        this.ctx.restore();
    }
    drawBar(x, y, max, current, width, config){
        this.ctx.fillStyle = config.bgColor;
        this.ctx.fillRect(x, y, width, config.height);
        this.ctx.fillStyle = config.color;
        this.ctx.fillRect(x, y, width / max * current, config.height);
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = config.font;
        this.ctx.fillText(`${Math.round(current)}/${max}`, x + width / 2, y + config.height / 2);
    }
    drawUnit(unit){
        if (!unit) return;
        const spriteW = unit.avatar.width ?? this.config.units.defaultSize;
        const spriteH = unit.avatar.height ?? this.config.units.defaultSize;
        const textCenterX = unit.avatar.x + spriteW / 2;
        const textY = unit.avatar.y - this.config.ui.fonts.gap;
        const hpBarWidth = unit.avatar.hpBarWidth ?? this.config.ui.hpBar.width;
        const mpBarWidth = unit.avatar.mpBarWidth ?? this.config.ui.mpBar.width;
        const hpX = unit.avatar.x + (spriteW / 2) - (hpBarWidth / 2);
        const hpY = unit.avatar.y + spriteH + this.config.ui.hpBar.offsetY;
        const mpX = unit.avatar.x + (spriteW / 2) - (mpBarWidth / 2);
        const mpY = hpY + this.config.ui.mpBar.height + this.config.ui.mpBar.offsetY;
        this.ctx.font = this.config.ui.fonts.name;
        this.ctx.fillStyle = this.config.ui.fonts.color;
        this.ctx.textAlign = "center";
        this.ctx.fillText(`${unit.name}`, textCenterX, textY);
        this.ctx.save();
        this.ctx.globalAlpha = unit.avatar.opacity ?? 1;
        this.ctx.drawImage(unit.avatar.sprite, unit.avatar.x, unit.avatar.y, spriteW, spriteH);
        this.ctx.restore();
        this.ctx.strokeStyle = "red";
        this.ctx.strokeRect(unit.avatar.x, unit.avatar.y, spriteW, spriteH);
        this.drawBar(hpX, hpY, unit.maxHp, unit.currentHp, hpBarWidth, this.config.ui.hpBar);
        this.drawBar(mpX, mpY, unit.maxMp, unit.currentMp, mpBarWidth, this.config.ui.mpBar);
        this.drawEffects(unit, mpX, mpY + this.config.ui.mpBar.height + 4, 25, "red");
    }
    /*drawEffects(unit, x, y , size, color){
        let drawnCount = 0;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = "15px Arial";
        for(let i = 0; i < unit.activeEffects.length; i++){
            const iconIndex = unit.activeEffects[i].iconIndex;
            const sprite = unit.activeEffects[i].sprite;
            const duration = unit.activeEffects[i].duration;
            const frameWidth = 214;
            if(duration <= 0) continue;
            this.ctx.drawImage(
                sprite,
                iconIndex * frameWidth,
                0,
                frameWidth,
                frameWidth,
                x + (size+1) * drawnCount, y, size, size);
            this.ctx.fillStyle = "#000000";
            this.ctx.fillText(duration, x + (size+1) * drawnCount + size / 2, y + size / 2);
            drawnCount++;
        }
    }*/
    /*drawEffects(unit, x, y, size, color) {
        let drawnCount = 0;

        // Настраиваем шрифт один раз перед циклом
        this.ctx.font = "bold 12px Verdana"; // Жирный шрифт читается лучше
        this.ctx.textAlign = 'right';      // Привязка к правому краю
        this.ctx.textBaseline = 'bottom';  // Привязка к нижнему краю

        for (let i = 0; i < unit.activeEffects.length; i++) {
            const effect = unit.activeEffects[i];
            const iconIndex = effect.iconIndex;
            const sprite = effect.sprite;
            const duration = effect.duration;
            const frameWidth = 214;

            if (duration <= 0) continue;

            // Вычисляем X координату текущей иконки
            const drawX = x + (size + 2) * drawnCount; // +2 для небольшого отступа между иконками

            // 1. Рисуем спрайт
            this.ctx.drawImage(
                sprite,
                iconIndex * frameWidth,
                0,
                frameWidth,
                frameWidth,
                drawX, y, size, size
            );

            // Координаты для текста (Правый нижний угол иконки)
            // Добавляем небольшое смещение (например, +2px), чтобы цифра "сидела" плотно в углу
            const textX = drawX + size + 2;
            const textY = y + size + 2;

            // 2. Рисуем ОБВОДКУ (Stroke) - это создает контраст
            this.ctx.strokeStyle = "black";
            this.ctx.lineWidth = 3; // Толщина обводки
            this.ctx.lineJoin = "round"; // Сглаженные углы обводки
            this.ctx.strokeText(duration, textX, textY);

            // 3. Рисуем ЗАЛИВКУ (Fill) - сам белый текст
            this.ctx.fillStyle = "white";
            this.ctx.fillText(duration, textX, textY);
            drawnCount++;
        }
    }*/
    drawEffects(unit, x, y, size, color) {
        let drawnCount = 0;

        for (let i = 0; i < unit.activeEffects.length; i++) {
            const effect = unit.activeEffects[i];
            const iconIndex = effect.iconIndex;
            const sprite = effect.sprite;
            const duration = effect.duration;
            const frameWidth = 214;

            if (duration <= 0) continue;

            // Координата X для текущей иконки
            const drawX = x + (size + 4) * drawnCount; // Чуть увеличил отступ между иконками

            // 1. Рисуем саму иконку эффекта
            this.ctx.drawImage(
                sprite,
                iconIndex * frameWidth,
                0,
                frameWidth,
                frameWidth,
                drawX, y, size, size
            );

            // --- РИСУЕМ БЕЙДЖИК ---

            // Настройки бейджа
            const badgeSize = 12; // Размер квадратика (px)

            // Координаты квадратика (Правый нижний угол иконки)
            const badgeX = drawX + size - badgeSize;
            const badgeY = y + size - badgeSize;

            // 2. Черный квадрат
            this.ctx.fillStyle = "#000000"; // Или "rgba(0,0,0,0.8)" для легкой прозрачности
            this.ctx.fillRect(badgeX, badgeY, badgeSize, badgeSize);

            // (Опционально) Тонкая белая рамка вокруг квадрата, чтобы отделить его от темной иконки
            // this.ctx.strokeStyle = "rgba(255,255,255,0.5)";
            // this.ctx.lineWidth = 1;
            // this.ctx.strokeRect(badgeX, badgeY, badgeSize, badgeSize);

            // 3. Белая цифра
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.font = "bold 9px Verdana"; // Шрифт поменьше, чтобы влез в квадрат
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";

            // Рисуем цифру ровно в центре черного квадрата
            // (+1 по Y — магическая поправка для визуального центра, зависит от шрифта)
            this.ctx.fillText(duration, badgeX + badgeSize / 2, badgeY + badgeSize / 2 + 1);

            drawnCount++;
        }
    }
    drawAnimations(animations){
       for(const anim of animations){
           if(typeof anim.active.draw !== 'function') continue;
           anim.active.draw(this.ctx);
       }
    }
    draw({player, enemy, animations}){
        this.clear();
        this.drawUnit(player);
        this.drawUnit(enemy);
        this.drawAnimations(animations);
    }
}