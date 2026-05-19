export type Language = 'en' | 'ru';

export const translations = {
    en: {
        // Header
        title: 'Fidelity Portfolio Analyzer',
        subtitle: 'Event-sourced transaction analysis',

        // Upload
        uploadTitle: 'Upload CSV Files',
        uploadSubtitle: 'Select one or more account history files',
        filesLoaded: 'Files Loaded',
        processing: 'Processing files...',

        // Filters
        filters: 'Filters',
        accounts: 'Accounts',
        tickers: 'Tickers',
        status: 'Status',
        period: 'Period',
        allPositions: 'All Positions',
        activeOnly: 'Active Only',
        closedOnly: 'Closed Only',

        // Quick Selectors
        selectAll: 'All',
        selectNone: 'None',
        byAccount: 'By Account',
        byPeriod: 'By Period',

        // Stats
        totalPnL: 'Total P&L',
        active: 'Active',
        closed: 'Closed',
        profitable: 'Profitable',

        // Chart
        chartTitle: 'P&L Distribution (Top 20)',
        realizedPnL: 'Realized P&L',

        // Table
        positionDetails: 'Position Details',
        positions: 'positions',
        ticker: 'Ticker',
        account: 'Account',
        shares: 'Shares',
        avgBuyPrice: 'Avg Buy Price',
        statusLabel: 'Status',
        pnl: 'P&L',
        activeStatus: 'ACTIVE',
        closedStatus: 'CLOSED',
        noPositions: 'No positions match the selected filters',

        // Empty State
        getStarted: 'Get Started',
        getStartedDesc: 'Upload your Fidelity account history CSV files to analyze your portfolio performance and track P&L across all positions.',

        // Account Aliases
        accountAlias: 'Account Alias',
        editAlias: 'Click to edit alias',
        saveAlias: 'Save alias',

        // Tooltips
        tooltipUpload: 'Upload CSV files from Fidelity containing your transaction history',
        tooltipFilters: 'Filter positions by account, ticker, or status',
        tooltipSelectAll: 'Select all items in this category',
        tooltipSelectNone: 'Deselect all items',
        tooltipByAccount: 'Filter tickers by selected accounts',
        tooltipByPeriod: 'Filter by date range from uploaded files',
        tooltipChart: 'Visual representation of profit and loss for each position',
        tooltipTable: 'Detailed information about each position including shares, prices, and realized P&L',
        tooltipPnL: 'Total realized profit or loss from closed and partially closed positions',
        tooltipLanguage: 'Switch language / Переключить язык',
    },
    ru: {
        // Header
        title: 'Fidelity Multi-Account EventSourcing Analyzer',
        subtitle: 'In-Place обработка потока транзакций без аллокации лишней памяти',

        // Upload
        uploadTitle: 'Загрузить файлы ордеров',
        uploadSubtitle: 'Выберите один или несколько CSV файлов истории счетов',
        filesLoaded: 'Загружено файлов',
        processing: 'Обработка файлов...',

        // Filters
        filters: 'Фильтры',
        accounts: 'Аккаунты',
        tickers: 'Тикеры',
        status: 'Статус',
        period: 'Период',
        allPositions: 'Все позиции',
        activeOnly: 'Только открытые',
        closedOnly: 'Только закрытые',

        // Quick Selectors
        selectAll: 'Все',
        selectNone: 'Ничего',
        byAccount: 'По аккаунту',
        byPeriod: 'По периоду',

        // Stats
        totalPnL: 'Реализованный P&L',
        active: 'Активные',
        closed: 'Закрытые',
        profitable: 'Прибыльные',

        // Chart
        chartTitle: 'Распределение P&L (Топ 20)',
        realizedPnL: 'Реализованный P&L',

        // Table
        positionDetails: 'Детали позиций',
        positions: 'позиций',
        ticker: 'Акция',
        account: 'Аккаунт',
        shares: 'Акции',
        avgBuyPrice: 'Ср. цена покупки',
        statusLabel: 'Статус',
        pnl: 'P&L',
        activeStatus: 'АКТИВНА',
        closedStatus: 'ЗАКРЫТА',
        noPositions: 'Нет позиций, соответствующих выбранным фильтрам',

        // Empty State
        getStarted: 'Начать работу',
        getStartedDesc: 'Загрузите CSV файлы истории счетов Fidelity для анализа производительности портфеля и отслеживания P&L по всем позициям.',

        // Account Aliases
        accountAlias: 'Псевдоним аккаунта',
        editAlias: 'Нажмите для редактирования',
        saveAlias: 'Сохранить псевдоним',

        // Tooltips
        tooltipUpload: 'Загрузите CSV файлы от Fidelity с историей ваших транзакций',
        tooltipFilters: 'Фильтруйте позиции по аккаунту, тикеру или статусу',
        tooltipSelectAll: 'Выбрать все элементы в этой категории',
        tooltipSelectNone: 'Снять все выделения',
        tooltipByAccount: 'Отфильтровать тикеры по выбранным аккаунтам',
        tooltipByPeriod: 'Фильтровать по периоду из загруженных файлов',
        tooltipChart: 'Визуальное представление прибыли и убытков по каждой позиции',
        tooltipTable: 'Детальная информация о каждой позиции, включая акции, цены и реализованный P&L',
        tooltipPnL: 'Общая реализованная прибыль или убыток от закрытых и частично закрытых позиций',
        tooltipLanguage: 'Switch language / Переключить язык',
    }
};

export function useTranslation(lang: Language) {
    return translations[lang];
}
