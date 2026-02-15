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
    drawEffects(unit, x, y , size, color){
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
            /*this.ctx.fillStyle = color;
            this.ctx.fillRect(x + (size+1) * drawnCount, y, size, size);*/
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