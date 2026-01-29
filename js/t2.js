updateSpellPreview(spellData) {
    const battle = this.ui.screens.battle;
    const { modifiers, modifiersState: state } = spellData;

    // 1. Улучшенная функция обновления кнопок
    const changeModifier = (btn) => {
        const key = btn.dataset.mod;
        const val = state[key]; // Значение (число или булево)
        const isActive = Boolean(val); // 0 -> false, 1 -> true

        // Переключаем класс
        btn.classList.toggle("active", isActive);

        // Находим бейдж (один раз!)
        const badge = btn.querySelector("span.badge");
        if (!badge) return; // Защита, если бейджа нет в HTML

        // Логика отображения бейджа
        if (isActive) {
            badge.style.display = "block";

            // Разный текст для разных типов
            if (key === 'J') {
                badge.textContent = `x${val}`;
            } else if (key === 'I') {
                // Можно брать бонус из конфига, если нужно
                badge.textContent = `+${val}`;
            } else {
                badge.textContent = "ON"; // Для Z и S
            }
        } else {
            badge.style.display = "none";
        }
    };

    // 2. Цикл по кнопкам
    const btns = battle.modBtns;
    const btnsObj = {};

    // Сразу ищем кнопки, если они не закешированы или DOM обновился
    // (лучше искать их тут, если список кнопок не меняется динамически)
    const currentBtns = battle.modifiersPanel.querySelectorAll("button");

    for (const btn of currentBtns) {
        const modKey = btn.dataset.mod;
        btnsObj[modKey] = btn;

        const modConfig = modifiers[modKey];
        if (modConfig) {
            btn.disabled = !modConfig.enabled;
            changeModifier(btn); // Вызываем исправленную функцию
        }
    }

    // 3. Цена (Возвращаем цвета!)
    if (battle.totalCost) { // Используем элемент контейнера
        const costHtml = Object.entries(spellData.totalCost)
            .map(([k, v]) => `<span class="spell-cost-badge type-${k}">${k}:${v}</span>`)
            .join(' ');

        battle.totalCost.innerHTML = costHtml; // innerHTML для тегов
    }

    // 4. Карточка Эффекта
    const effectBlock = document.getElementById("preview-effect-block"); // Лучше вынести в UI_SELECTORS

    if (spellData.effect) {
        if(effectBlock) effectBlock.classList.remove("hidden");

        for (const key in battle.previewEffectsGrid) {
            const el = battle.previewEffectsGrid[key];
            if(el) el.textContent = spellData.effect[key] || "--";
        }
    } else {
        if(effectBlock) effectBlock.classList.add("hidden"); // Скрываем блок целиком, так красивее
    }

    // 5. Тексты
    battle.previewName.textContent = spellData.name; // Убрал "Выбор:", так чище
    battle.previewPower.textContent = spellData.power;

    // 6. Логика блокировки "I"
    if (modifiers.I?.enabled && btnsObj.I) {
        const isEffectActive = state.S || state.Z;

        // Перекрываем disabled
        btnsObj.I.disabled = !isEffectActive;

        // Если заблокировали принудительно, гасим визуал
        if (!isEffectActive) {
            btnsObj.I.classList.remove("active");
            const badge = btnsObj.I.querySelector(".badge");
            if (badge) badge.style.display = "none";
        }
    }

    // 7. Кнопка Каста (Ты забыл её в своем примере, а она важна)
    const castBtn = document.getElementById("cast-btn");
    if(castBtn) {
        castBtn.classList.remove("hidden");
        castBtn.disabled = !spellData.isValid;
        castBtn.textContent = spellData.isValid ? "ПРИМЕНИТЬ" : "НЕТ МАНЫ";
        castBtn.style.opacity = spellData.isValid ? "1" : "0.6";
    }
}





