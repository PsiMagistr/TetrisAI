const EVENTS = {
    // Глобальные состояния игры
    GAME: {
        INIT: "game:init",           // Нажатие пробела для старта
        START: "game:start",         // Фактическое начало логики
        END: "game:end",             // Game Over
        LIMIT_REACHED: "game:limit", // Достигнут лимит фигур (триггер битвы)
        RESET: "game:reset",
    },
    // Управление и поведение фигуры
    PIECE: {
        MOVE: "piece:move",
        ROTATE: "piece:rotate",
        ACCELERATE: "piece:accelerate", // Ускорение (стрелка вниз)
        LOCK: "piece:lock"              // Фигура упала и зафиксировалась
    },
    INPUT:{
        SET_BLOCKED:"input:set-blocked",
    },
    // Отрисовка
    RENDER: {
        STANDARD: "render:draw",           // Обычная отрисовка
        FORCE: "render:force",             // Принудительная перерисовка
        SET_MODE: "render:set_mode",       // Смена режима (game/animation)
        ANIMATION_STEP: "render:anim_step" // Кадр анимации мигания
    },
    // Анимации и спецэффекты
    ANIMATION: {
        START: "anim:start",          // Запуск серии анимаций (исчезновение линий)
    },

    // Ресурсы и статистика
    RESOURCES: {
        CALCULATE: "res:calculate",   // Подсчитать ресурсы за удаленные линии
        UPDATE: "res:update"          // Обновить данные в хранилище (и UI)
    },

    // Интерфейс
    UI: {
        UPDATE_STATS: "ui:update_stats", // Обновить очки/линии/уровень
        OPEN_MODAL: "ui:open_modal",      // Открыть любое окно (меню, битва, gameover)
        ADD_LOG: "ui:add_log",
        UPDATE_SPELL_PREVIEW: "ui:update_spell_preview",
        CLOSE_ALL_MODALS: "ui:close_all_modals",
        SET_INTERFACE_INTERACTIVITY:"ui:set_interface_interactivity",
        CLEAR_LOG: "ui:clear_log",
    },
    // Битва
    BATTLE: {
        RENDER_FRAME: "render-frame",     // Отрисовать кадр боя.
        SURRENDER:"battle:surrender",
        SPELL_SELECT:"spell_select",
        TOGGLE_MODIFIER_SPELL:"toggle_modifier_spell",
        APPLY_CAST: "apply_cast",
        DEATH:"death",
        FLOATING_TEXT:"floating_text",
    }
};