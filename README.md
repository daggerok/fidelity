# Fidelity [![CI](https://github.com/daggerok/fidelity/actions/workflows/ci.yaml/badge.svg)](https://github.com/daggerok/fidelity/actions/workflows/ci.yaml) [![GitHub Pages](https://github.com/daggerok/fidelity/actions/workflows/github-pages.yml/badge.svg)](https://github.com/daggerok/fidelity/actions/workflows/github-pages.yml)

[Fidelity investments analyzer](https://daggerok.github.io/fidelity/)

Bun build requirements:

```bash
nvm install --lts
nvm alias default 'lts/*'

echo '
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
' >> ~/.zshrc
source ~/.zshrc
```

```markdown
here is my setup

package.json
```json
{
  "name": "fidelity",
  "version": "1.0.0",
  "description": "Math for Ameliia",
  "source": "src/index.html",
  "scripts": {
    "clean": "rimraf -rf dist",
    "prebuild": "npm run clean",
    "build-github-pages": "npm run build -- --public-url=/fidelity/",
    "serve": "parcel --no-cache --no-source-maps",
    "build": "parcel build --no-cache --no-source-maps",
    "start": "pm2 start 'npm run serve' --name app",
    "restart": "pm2 restart app",
    "stop": "pm2 kill",
    "logs": "pm2 logs",
    "test": "jest src",
    "dev": "npm run test -- --watchAll"
  },
  "keywords": [
    "parcel",
    "rimraf",
    "sass",
    "jest",
    "pm2"
  ],
  "author": "Maksim Kostromin / GitHub: daggerok",
  "license": "MIT",
  "dependencies": {
    "clsx": "2.1.1",
    "lucide-react": "1.16.0",
    "react": "19.2.6",
    "react-dom": "19.2.6",
    "recharts": "3.8.1",
    "tailwind-merge": "3.6.0"
  },
  "devDependencies": {
    "@parcel/transformer-sass": "2.16.4",
    "@tailwindcss/postcss": "4.3.0",
    "@types/node": "25.6.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "jest": "30.3.0",
    "papaparse": "5.5.3",
    "parcel": "2.16.4",
    "pm2": "6.0.14",
    "rimraf": "6.1.3",
    "sass": "1.99.0",
    "tailwindcss": "4.3.0"
  },
  "postcss": {
    "plugins": {
      "@tailwindcss/postcss": {}
    }
  }
}
```
src/index.html
```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fidelity Portfolio Analyzer - Event Sourcing Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="icon" type="image/png" href="./favicon.png">
    <link href="./index.css" type="text/css" rel="stylesheet" />
</head>
<body>
<div id="root"/>
<script src="./main.tsx" type="module"></script>
</body>
</html>
```
index.css
```css
@import "tailwindcss";

/* Custom scrollbar styles */
* {
    scrollbar-width: thin;
    scrollbar-color: rgba(59, 130, 246, 0.5) rgba(30, 41, 59, 0.5);
}

*::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

*::-webkit-scrollbar-track {
    background: rgba(30, 41, 59, 0.5);
    border-radius: 4px;
}

*::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.5);
    border-radius: 4px;
}

*::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.7);
}

/* Smooth animations */
* {
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Input file button styling */
input[type="file"] {
    display: none;
}
```
src/favicon.png and src/main.tsx:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Upload, Filter, TrendingUp, DollarSign, BarChart3, X, Menu } from 'lucide-react';
import Papa from 'papaparse';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface OptimizedFileIndex {
    fileName: string;
    accountPrefix: string;
    earliestDate: Date;
    latestDate: Date;
    rawData: any[];
}

export interface PositionState {
    ticker: string;
    account: string;
    totalShares: number;
    totalInvested: number;
    averageBuyPrice: number;
    realizedPnL: number;
    isClosed: boolean;
}

export interface PortfolioAggregate {
    positions: Record<string, PositionState>;
    globalPnL: number;
}

export function reducePortfolioOptimized(fileIndices: OptimizedFileIndex[]): PortfolioAggregate {
    const aggregate: PortfolioAggregate = { positions: {}, globalPnL: 0 };
    if (fileIndices.length === 0) return aggregate;

    const groups: Record<string, OptimizedFileIndex[]> = {};
    for (const fileIndex of fileIndices) {
        if (!groups[fileIndex.accountPrefix]) groups[fileIndex.accountPrefix] = [];
        groups[fileIndex.accountPrefix].push(fileIndex);
    }

    for (const accountPrefix in groups) {
        const filesInGroup = groups[accountPrefix];
        filesInGroup.sort((a, b) => a.earliestDate.getTime() - b.earliestDate.getTime());

        const cleanAccountName = accountPrefix.replace('History_for_Account_', '');

        for (const file of filesInGroup) {
            const rows = file.rawData;

            for (let i = rows.length - 1; i >= 0; i--) {
                const row = rows[i];
                const actionStr = row['Action'] || '';

                const isBuy = actionStr.includes('YOU BOUGHT');
                const isSell = actionStr.includes('YOU SOLD');
                if (!isBuy && !isSell) continue;

                const ticker = (row['Symbol'] || '').toUpperCase().trim();
                if (!ticker) continue;

                const key = `${cleanAccountName}_${ticker}`;

                if (!aggregate.positions[key]) {
                    aggregate.positions[key] = {
                        ticker,
                        account: cleanAccountName,
                        totalShares: 0,
                        totalInvested: 0,
                        averageBuyPrice: 0,
                        realizedPnL: 0,
                        isClosed: false
                    };
                }

                const pos = aggregate.positions[key];
                const amountRaw = row['Amount ($)'] || row['Amount'] || '0';
                const quantityRaw = row['Quantity'] || '0';

                const amount = parseFloat(amountRaw.toString().replace(/[\$,]/g, '')) || 0;
                const shares = Math.abs(parseFloat(quantityRaw.toString().replace(/[\$,]/g, '')) || 0);
                const absAmount = Math.abs(amount);

                if (isBuy) {
                    pos.totalShares += shares;
                    pos.totalInvested += absAmount;
                    pos.averageBuyPrice = pos.totalShares > 0 ? pos.totalInvested / pos.totalShares : 0;
                    pos.isClosed = false;
                }
                else if (isSell) {
                    if (pos.totalShares > 0) {
                        const costOfSharesSold = pos.averageBuyPrice * shares;
                        const pnl = absAmount - costOfSharesSold;

                        pos.realizedPnL += pnl;
                        aggregate.globalPnL += pnl;

                        pos.totalShares -= shares;
                        pos.totalInvested -= costOfSharesSold;

                        if (pos.totalShares < 0.00001) {
                            pos.totalShares = 0;
                            pos.totalInvested = 0;
                            pos.averageBuyPrice = 0;
                            pos.isClosed = true;
                        }
                    }
                }
            }
        }
    }

    return aggregate;
}

export function parseFidelityCSVOptimized(file: File): Promise<OptimizedFileIndex> {
    return new Promise((resolve, reject) => {
        const prefixMatch = file.name.match(/^(History_for_Account_[A-Za-z0-9]+)/i);
        const accountPrefix = prefixMatch ? prefixMatch[1] : file.name.replace('.csv', '');

        file.text().then(fileContent => {
            Papa.parse(fileContent, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const validRows = results.data.filter((row: any) => {
                        const action = row['Action'] || '';
                        return row['Run Date'] && action.startsWith('YOU');
                    });

                    if (validRows.length === 0) {
                        reject(new Error(`Файл ${file.name} не содержит финансовых транзакций.`));
                        return;
                    }

                    const latestDate = new Date((validRows[0] as any)['Run Date']);
                    const earliestDate = new Date((validRows[validRows.length - 1] as any)['Run Date']);

                    resolve({
                        fileName: file.name,
                        accountPrefix,
                        earliestDate,
                        latestDate,
                        rawData: validRows
                    });
                },
                error: (error: any) => reject(error)
            });
        }).catch(reject);
    });
}


function App() {
    const [fileIndices, setFileIndices] = useState<OptimizedFileIndex[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const filesArray = Array.from(e.target.files);
        setIsLoading(true);
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
        setIsLoading(false);
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
                name: `${pos.ticker}`,
                account: pos.account,
                'P&L': parseFloat(pos.realizedPnL.toFixed(2))
            }))
            .sort((a, b) => b['P&L'] - a['P&L'])
            .slice(0, 20);
    }, [filteredPositions]);

    const stats = useMemo(() => {
        const activePositions = filteredPositions.filter(p => !p.isClosed).length;
        const closedPositions = filteredPositions.filter(p => p.isClosed).length;
        const profitablePositions = filteredPositions.filter(p => p.realizedPnL > 0).length;
        return { activePositions, closedPositions, profitablePositions };
    }, [filteredPositions]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 shadow-xl">
                    <p className="text-white font-semibold text-sm">{payload[0].payload.name}</p>
                    <p className="text-gray-400 text-xs mb-1">#{payload[0].payload.account}</p>
                    <p className={`text-lg font-bold ${payload[0].value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${payload[0].value.toFixed(2)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl">
                                <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-white">
                                    Fidelity Portfolio Analyzer
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                                    Event-sourced transaction analysis
                                </p>
                            </div>
                        </div>
                        {fileIndices.length > 0 && (
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="lg:hidden bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                            >
                                {isFilterOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Upload Section */}
                <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-2xl">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="bg-blue-500/20 p-3 rounded-xl">
                                <Upload className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <label className="text-white font-semibold text-lg cursor-pointer block">
                                    Upload CSV Files
                                    <input
                                        type="file"
                                        accept=".csv"
                                        multiple
                                        onChange={handleMultipleFilesUpload}
                                        className="hidden"
                                        disabled={isLoading}
                                    />
                                </label>
                                <p className="text-gray-400 text-sm">Select one or more account history files</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 rounded-xl">
                            <div className="text-white/80 text-xs uppercase tracking-wider">Files Loaded</div>
                            <div className="text-white text-3xl font-bold">{fileIndices.length}</div>
                        </div>
                    </div>
                    {isLoading && (
                        <div className="mt-4 flex items-center gap-2 text-blue-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                            <span className="text-sm">Processing files...</span>
                        </div>
                    )}
                </div>

                {fileIndices.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Filters Sidebar */}
                        <aside className={`lg:col-span-1 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
                            <div className="sticky top-24 space-y-4">
                                {/* Account Filter */}
                                <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-white/10 rounded-2xl p-5 shadow-xl">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Filter className="w-4 h-4 text-blue-400" />
                                        <h3 className="text-white font-semibold">Accounts</h3>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {uniqueAccounts.map(acc => (
                                            <label
                                                key={acc}
                                                className="flex items-center gap-2 cursor-pointer group"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAccounts.includes(acc)}
                                                    onChange={() =>
                                                        setSelectedAccounts(prev =>
                                                            prev.includes(acc)
                                                                ? prev.filter(a => a !== acc)
                                                                : [...prev, acc]
                                                        )
                                                    }
                                                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                                                    #{acc}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Ticker Filter */}
                                <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-white/10 rounded-2xl p-5 shadow-xl">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Filter className="w-4 h-4 text-purple-400" />
                                        <h3 className="text-white font-semibold">Tickers</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                                        {uniqueTickers.map(tick => (
                                            <label
                                                key={tick}
                                                className="flex items-center gap-2 cursor-pointer group"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTickers.includes(tick)}
                                                    onChange={() =>
                                                        setSelectedTickers(prev =>
                                                            prev.includes(tick)
                                                                ? prev.filter(t => t !== tick)
                                                                : [...prev, tick]
                                                        )
                                                    }
                                                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-2 focus:ring-purple-500"
                                                />
                                                <span className="text-gray-300 text-xs group-hover:text-white transition-colors font-mono">
                                                    {tick}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Filter */}
                                <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-white/10 rounded-2xl p-5 shadow-xl">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Filter className="w-4 h-4 text-green-400" />
                                        <h3 className="text-white font-semibold">Status</h3>
                                    </div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as any)}
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="ALL">All Positions</option>
                                        <option value="ACTIVE">Active Only</option>
                                        <option value="CLOSED">Closed Only</option>
                                    </select>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <main className="lg:col-span-3 space-y-6">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 backdrop-blur-sm border border-green-500/20 rounded-xl p-5 shadow-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-green-400 text-sm font-medium">Total P&L</div>
                                        <DollarSign className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div className={`text-2xl sm:text-3xl font-bold ${totalFilteredPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        ${totalFilteredPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 backdrop-blur-sm border border-blue-500/20 rounded-xl p-5 shadow-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-blue-400 text-sm font-medium">Active</div>
                                        <TrendingUp className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-bold text-white">
                                        {stats.activePositions}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-5 shadow-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-purple-400 text-sm font-medium">Closed</div>
                                        <BarChart3 className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-bold text-white">
                                        {stats.closedPositions}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-5 shadow-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-yellow-400 text-sm font-medium">Profitable</div>
                                        <TrendingUp className="w-5 h-5 text-yellow-400" />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-bold text-white">
                                        {stats.profitablePositions}
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
                                <h3 className="text-white text-xl font-semibold mb-4">P&L Distribution (Top 20)</h3>
                                <div className="h-80 sm:h-96">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <ReferenceLine y={0} stroke="#6b7280" strokeWidth={2} />
                                            <Bar
                                                dataKey="P&L"
                                                fill="url(#colorGradient)"
                                                radius={[8, 8, 0, 0]}
                                                maxBarSize={60}
                                            />
                                            <defs>
                                                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                </linearGradient>
                                            </defs>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-white/10">
                                    <h3 className="text-white text-xl font-semibold">Position Details</h3>
                                    <p className="text-gray-400 text-sm mt-1">{filteredPositions.length} positions</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-black/30">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                Ticker
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                Account
                                            </th>
                                            <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                Shares
                                            </th>
                                            <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                                                Avg Buy Price
                                            </th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                                                Status
                                            </th>
                                            <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                P&L
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                        {filteredPositions.map(pos => (
                                            <tr
                                                key={`${pos.account}_${pos.ticker}`}
                                                className="hover:bg-white/5 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white text-lg">{pos.ticker}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-gray-400 font-mono text-sm">#{pos.account}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-white font-mono">{pos.totalShares.toFixed(4)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right hidden sm:table-cell">
                                                    <div className="text-gray-300 font-mono">${pos.averageBuyPrice.toFixed(2)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center hidden md:table-cell">
                                                        <span
                                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                                pos.isClosed
                                                                    ? 'bg-gray-700 text-gray-300'
                                                                    : 'bg-green-900/50 text-green-400 border border-green-500/30'
                                                            }`}
                                                        >
                                                            {pos.isClosed ? 'CLOSED' : 'ACTIVE'}
                                                        </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div
                                                        className={`font-bold text-lg font-mono ${
                                                            pos.realizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                                                        }`}
                                                    >
                                                        ${pos.realizedPnL.toFixed(2)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                    {filteredPositions.length === 0 && (
                                        <div className="text-center py-12 text-gray-500">
                                            No positions match the selected filters
                                        </div>
                                    )}
                                </div>
                            </div>
                        </main>
                    </div>
                )}

                {fileIndices.length === 0 && !isLoading && (
                    <div className="text-center py-20">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Upload className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Get Started</h2>
                        <p className="text-gray-400 max-w-md mx-auto">
                            Upload your Fidelity account history CSV files to analyze your portfolio performance and track P&L across all positions.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```
NOTE: implement all needed code in main.tsx so it will be easier to communicate...

1st: I want click more widly, anythere on icons upload, get started files loaded. its not so easy to understand where I suppose to click for files uploads

2nd: instad of
Select one or more account history files
must be more clear and correct
Select one or more Fidelity activity -> Orders exported files per account / year

3rd: add here light theme but use dark by default

4th: I want to see not just account numbers, but description with uploaded files names then where get data from
```
