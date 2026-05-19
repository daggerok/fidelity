import { OptimizedFileIndex, PortfolioAggregate } from './types';

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
