import Papa from 'papaparse';
import { OptimizedFileIndex } from './types';

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

                    const latestDate = new Date(validRows[0]['Run Date']);
                    const earliestDate = new Date(validRows[validRows.length - 1]['Run Date']);

                    resolve({
                        fileName: file.name,
                        accountPrefix,
                        earliestDate,
                        latestDate,
                        rawData: validRows
                    });
                },
                error: (error) => reject(error)
            });
        }).catch(reject);
    });
}
