import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { parseFidelityCSVOptimized } from './csvParser';
import { reducePortfolioOptimized } from './aggregator';
import { OptimizedFileIndex } from './types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

function App() {
    const [fileIndices, setFileIndices] = useState<OptimizedFileIndex[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');

    const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const filesArray = Array.from(e.target.files);
        const newIndices: OptimizedFileIndex[] = [];

        for (const file of filesArray) {
            try {
                const indexResult = await parseFidelityCSVOptimized(file);
                newIndices.push(indexResult);
            } catch (err) {
                console.error(err);
            }
        }
        setFileIndices(prev => [...prev, ...newIndices]);
    };

    const portfolio = useMemo(() => reducePortfolioOptimized(fileIndices), [fileIndices]);

    const uniqueAccounts = useMemo(() => {
        return Array.from(new Set(fileIndices.map(f => f.accountPrefix.replace('History_for_Account_', ''))));
    }, [fileIndices]);

    const uniqueTickers = useMemo(() => {
        const tickers = new Set<string>();
        fileIndices.forEach(f => {
            f.rawData.forEach((row: any) => {
                if (row['Symbol']) tickers.add(row['Symbol'].toUpperCase().trim());
            });
        });
        return Array.from(tickers).sort();
    }, [fileIndices]);

    const filteredPositions = useMemo(() => {
        return Object.values(portfolio.positions).filter(pos => {
            const matchesAccount = selectedAccounts.length === 0 || selectedAccounts.includes(pos.account);
            const matchesTicker = selectedTickers.length === 0 || selectedTickers.includes(pos.ticker);
            const matchesStatus =
                statusFilter === 'ALL' ||
                (statusFilter === 'ACTIVE' && !pos.isClosed) ||
                (statusFilter === 'CLOSED' && pos.isClosed);
            return matchesAccount && matchesTicker && matchesStatus;
        });
    }, [portfolio, selectedAccounts, selectedTickers, statusFilter]);

    const totalFilteredPnL = useMemo(() => {
        return filteredPositions.reduce((sum, pos) => sum + pos.realizedPnL, 0);
    }, [filteredPositions]);

    const chartData = useMemo(() => {
        return filteredPositions
            .map(pos => ({
                name: pos.ticker,
                'P&L': parseFloat(pos.realizedPnL.toFixed(2))
            }))
            .sort((a, b) => b['P&L'] - a['P&L']);
    }, [filteredPositions]);

    return (
        <div className="container">
            <header className="header">
                <h1>Fidelity Portfolio Analytics</h1>
                <p>EventSourcing движок обработки ордеров · Сверхточный расчет прибыли</p>
            </header>

            <div className="upload-box">
                <div>
                    <label className="upload-label">Импорт файлов Fidelity CSV</label>
                    <input type="file" accept=".csv" multiple onChange={handleMultipleFilesUpload} />
                </div>
                <div className="stats-badge">
                    Индексировано архивов: <strong>{fileIndices.length}</strong>
                </div>
            </div>

            {fileIndices.length > 0 && (
                <div className="dashboard-grid">

                    {/* Боковые адаптивные фильтры */}
                    <aside className="filters-sidebar">
                        <div className="filter-card">
                            <h3>Брокерские Аккаунты</h3>
                            <div className="filter-list">
                                {uniqueAccounts.map(acc => (
                                    <label key={acc}>
                                        <input type="checkbox" checked={selectedAccounts.includes(acc)} onChange={() => setSelectedAccounts(prev => prev.includes(acc) ? prev.filter(a => a !== acc) : [...prev, acc])} />
                                        #{acc}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="filter-card">
                            <h3>Активы / Тикеры</h3>
                            <div className="filter-list grid-2">
                                {uniqueTickers.map(tick => (
                                    <label key={tick}>
                                        <input type="checkbox" checked={selectedTickers.includes(tick)} onChange={() => setSelectedTickers(prev => prev.includes(tick) ? prev.filter(t => t !== tick) : [...prev, tick])} />
                                        {tick}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="filter-card">
                            <h3>Фильтр Состояния</h3>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                                <option value="ALL">Все позиции</option>
                                <option value="ACTIVE">Только открытые</option>
                                <option value="CLOSED">Только закрытые</option>
                            </select>
                        </div>
                    </aside>

                    {/* Рабочая область дашборда */}
                    <main className="main-content">

                        {/* Карточка прибыли */}
                        <div className="pnl-summary">
                            <div>
                                <h2>Реализованный P&L</h2>
                                <p>Фиксированный доход по выбранной выборке</p>
                            </div>
                            <div className={`pnl-value ${totalFilteredPnL >= 0 ? 'pos' : 'neg'}`}>
                                ${totalFilteredPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>

                        {/* График Recharts */}
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Realized P&L']}
                                        contentStyle={{ background: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '13px' }}
                                    />
                                    <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
                                    <Bar dataKey="P&L" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={38} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Мобильно-адаптивная интерактивная таблица */}
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                <tr>
                                    <th>Акция</th>
                                    <th>Аккаунт</th>
                                    <th className="text-right">Текущий объем</th>
                                    <th className="text-right">Цена входа (Avg)</th>
                                    <th className="text-center">Статус</th>
                                    <th className="text-right">Фиксированный P&L</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredPositions.map(pos => (
                                    <tr key={`${pos.account}_${pos.ticker}`}>
                                        <td data-label="Акция" className="font-bold">{pos.ticker}</td>
                                        <td data-label="Аккаунт" className="mono text-muted">#{pos.account}</td>
                                        <td data-label="Текущий объем" className="mono text-right">{pos.totalShares.toFixed(4)}</td>
                                        <td data-label="Цена входа (Avg)" className="mono text-right">${pos.averageBuyPrice.toFixed(2)}</td>
                                        <td data-label="Статус" className="text-center">
                        <span className={`badge ${pos.isClosed ? 'closed' : 'active'}`}>
                          {pos.isClosed ? 'ЗАКРЫТА' : 'АКТИВНА'}
                        </span>
                                        </td>
                                        <td data-label="Фиксированный P&L" className={`mono text-right font-bold ${pos.realizedPnL >= 0 ? 'text-pos' : 'text-neg'}`}>
                                            ${pos.realizedPnL.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </main>
                </div>
            )}
        </div>
    );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

// import React, { useState, useMemo } from 'react';
// import { createRoot } from 'react-dom/client';
// import { parseFidelityCSVOptimized } from './csvParser';
// import { reducePortfolioOptimized } from './aggregator';
// import { OptimizedFileIndex } from './types';
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
//
// function App() {
//     const [fileIndices, setFileIndices] = useState<OptimizedFileIndex[]>([]);
//     const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
//     const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
//     const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
//
//     const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//         if (!e.target.files) return;
//         const filesArray = Array.from(e.target.files);
//         const newIndices: OptimizedFileIndex[] = [];
//
//         for (const file of filesArray) {
//             try {
//                 const indexResult = await parseFidelityCSVOptimized(file);
//                 newIndices.push(indexResult);
//             } catch (err) {
//                 console.error(err);
//             }
//         }
//         setFileIndices(prev => [...prev, ...newIndices]);
//     };
//
//     const portfolio = useMemo(() => reducePortfolioOptimized(fileIndices), [fileIndices]);
//
//     const uniqueAccounts = useMemo(() => {
//         return Array.from(new Set(fileIndices.map(f => f.accountPrefix.replace('History_for_Account_', ''))));
//     }, [fileIndices]);
//
//     const uniqueTickers = useMemo(() => {
//         const tickers = new Set<string>();
//         fileIndices.forEach(f => {
//             f.rawData.forEach((row: any) => {
//                 if (row['Symbol']) tickers.add(row['Symbol'].toUpperCase().trim());
//             });
//         });
//         return Array.from(tickers).sort();
//     }, [fileIndices]);
//
//     const filteredPositions = useMemo(() => {
//         return Object.values(portfolio.positions).filter(pos => {
//             const matchesAccount = selectedAccounts.length === 0 || selectedAccounts.includes(pos.account);
//             const matchesTicker = selectedTickers.length === 0 || selectedTickers.includes(pos.ticker);
//             const matchesStatus =
//                 statusFilter === 'ALL' ||
//                 (statusFilter === 'ACTIVE' && !pos.isClosed) ||
//                 (statusFilter === 'CLOSED' && pos.isClosed);
//             return matchesAccount && matchesTicker && matchesStatus;
//         });
//     }, [portfolio, selectedAccounts, selectedTickers, statusFilter]);
//
//     const totalFilteredPnL = useMemo(() => {
//         return filteredPositions.reduce((sum, pos) => sum + pos.realizedPnL, 0);
//     }, [filteredPositions]);
//
//     const chartData = useMemo(() => {
//         return filteredPositions
//             .map(pos => ({
//                 name: `${pos.ticker} (#${pos.account})`,
//                 'P&L': parseFloat(pos.realizedPnL.toFixed(2))
//             }))
//             .sort((a, b) => b['P&L'] - a['P&L']);
//     }, [filteredPositions]);
//
//     return (
//         <div className="container">
//             <header className="header">
//                 <h1>Fidelity Multi-Account EventSourcing Analyzer</h1>
//                 <p>In-Place обработка потока транзакций без аллокации лишней памяти.</p>
//             </header>
//
//             <div className="upload-box">
//                 <div>
//                     <label className="upload-label">Загрузить файлы ордеров (.csv)</label>
//                     <input type="file" accept=".csv" multiple onChange={handleMultipleFilesUpload} />
//                 </div>
//                 <div className="stats-badge">
//                     Загружено файлов: <strong>{fileIndices.length}</strong>
//                 </div>
//             </div>
//
//             {fileIndices.length > 0 && (
//                 <div className="dashboard-grid">
//                     <aside className="filters-sidebar">
//                         <div className="filter-card">
//                             <h3>Аккаунты</h3>
//                             <div className="filter-list">
//                                 {uniqueAccounts.map(acc => (
//                                     <label key={acc}>
//                                         <input type="checkbox" checked={selectedAccounts.includes(acc)} onChange={() => setSelectedAccounts(prev => prev.includes(acc) ? prev.filter(a => a !== acc) : [...prev, acc])} />
//                                         #{acc}
//                                     </label>
//                                 ))}
//                             </div>
//                         </div>
//
//                         <div className="filter-card">
//                             <h3>Тикеры</h3>
//                             <div className="filter-list grid-2">
//                                 {uniqueTickers.map(tick => (
//                                     <label key={tick}>
//                                         <input type="checkbox" checked={selectedTickers.includes(tick)} onChange={() => setSelectedTickers(prev => prev.includes(tick) ? prev.filter(t => t !== tick) : [...prev, tick])} />
//                                         {tick}
//                                     </label>
//                                 ))}
//                             </div>
//                         </div>
//
//                         <div className="filter-card">
//                             <h3>Статус позиций</h3>
//                             <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
//                                 <option value="ALL">Все</option>
//                                 <option value="ACTIVE">Только открытые</option>
//                                 <option value="CLOSED">Только закрытые</option>
//                             </select>
//                         </div>
//                     </aside>
//
//                     <main className="main-content">
//                         <div className="pnl-summary">
//                             <div>
//                                 <h2>Реализованный P&L</h2>
//                                 <p>На основе выбранных фильтров</p>
//                             </div>
//                             <div className={`pnl-value ${totalFilteredPnL >= 0 ? 'pos' : 'neg'}`}>
//                                 ${totalFilteredPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                             </div>
//                         </div>
//
//                         <div className="chart-container">
//                             <ResponsiveContainer width="100%" height="100%">
//                                 <BarChart data={chartData}>
//                                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                                     <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
//                                     <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
//                                     <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Realized P&L']} />
//                                     <ReferenceLine y={0} stroke="#cbd5e1" />
//                                     <Bar dataKey="P&L" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
//                                 </BarChart>
//                             </ResponsiveContainer>
//                         </div>
//
//                         <div className="table-wrapper">
//                             <table>
//                                 <thead>
//                                 <tr>
//                                     <th>Акция</th>
//                                     <th>Аккаунт</th>
//                                     <th className="text-right">Акции</th>
//                                     <th className="text-right">Ср. цена покупки</th>
//                                     <th className="text-center">Статус</th>
//                                     <th className="text-right">P&L</th>
//                                 </tr>
//                                 </thead>
//                                 <tbody>
//                                 {filteredPositions.map(pos => (
//                                     <tr key={`${pos.account}_${pos.ticker}`}>
//                                         <td className="font-bold">{pos.ticker}</td>
//                                         <td className="mono text-muted">#{pos.account}</td>
//                                         <td className="mono text-right">{pos.totalShares.toFixed(4)}</td>
//                                         <td className="mono text-right">${pos.averageBuyPrice.toFixed(2)}</td>
//                                         <td className="text-center">
//                         <span className={`badge ${pos.isClosed ? 'closed' : 'active'}`}>
//                           {pos.isClosed ? 'ЗАКРЫТА' : 'АКТИВНА'}
//                         </span>
//                                         </td>
//                                         <td className={`mono text-right font-bold ${pos.realizedPnL >= 0 ? 'text-pos' : 'text-neg'}`}>
//                                             ${pos.realizedPnL.toFixed(2)}
//                                         </td>
//                                     </tr>
//                                 ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     </main>
//                 </div>
//             )}
//         </div>
//     );
// }
//
// const container = document.getElementById('root');
// if (container) {
//     const root = createRoot(container);
//     root.render(<App />);
// }
