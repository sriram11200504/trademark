// Extremely lightweight formula parser for basic arithmetic and SUM
// Supports: =A1+B2, =SUM(A1:A5), =10*2

type ResolveCellFn = (cellId: string) => number;

export function evaluateFormula(formula: string, resolveCell: ResolveCellFn, evaluatingCells: Set<string> = new Set()): string | number {
    if (!formula.startsWith('=')) {
        // If it's a number, return it as number, otherwise string
        const num = Number(formula);
        return isNaN(num) ? formula : num;
    }

    const expressionString = formula.substring(1).toUpperCase().trim();

    try {
        // 1. Handle SUM(A1:A5)
        let processedExpression = expressionString.replace(/SUM\(([A-Z][0-9]+):([A-Z][0-9]+)\)/g, (match, startCell, endCell) => {
            const sum = calculateSum(startCell, endCell, resolveCell, evaluatingCells);
            return sum.toString();
        });

        // 1b. Handle SUM(A1,B2)
        processedExpression = processedExpression.replace(/SUM\((.*?)\)/g, (match, args) => {
            const parts = args.split(',').map((p: string) => p.trim());
            let sum = 0;
            for (const p of parts) {
                if (/^[A-Z][0-9]+$/.test(p)) {
                    sum += resolveCellSafely(p, resolveCell, evaluatingCells);
                } else if (!isNaN(Number(p))) {
                    sum += Number(p);
                }
            }
            return sum.toString();
        });

        // 2. Replace cell references with their resolved values (e.g. A1 -> 5)
        processedExpression = processedExpression.replace(/[A-Z][0-9]+/g, (match) => {
            const val = resolveCellSafely(match, resolveCell, evaluatingCells);
            return val.toString();
        });

        // 3. Evaluate basic math expression using new Function (safe-ish here because we stripped non-math stuff)
        // We only allow numbers, operators, and parentheses
        if (/^[0-9+\-*/().\s]+$/.test(processedExpression)) {
            const result = new Function(`return ${processedExpression}`)();
            if (!isFinite(result) || isNaN(result)) return "#ERROR!";
            return result;
        } else {
            return "#ERROR!";
        }

    } catch {
        return "#ERROR!";
    }
}

function resolveCellSafely(cellId: string, resolveCell: ResolveCellFn, evaluatingCells: Set<string>): number {
    if (evaluatingCells.has(cellId)) {
        throw new Error("Circular dependency"); // Captured by the outer try-catch
    }
    return resolveCell(cellId);
}

function calculateSum(startCell: string, endCell: string, resolveCell: ResolveCellFn, evaluatingCells: Set<string>): number {
    const startCol = startCell.charCodeAt(0) - 65;
    const startRow = parseInt(startCell.substring(1));
    const endCol = endCell.charCodeAt(0) - 65;
    const endRow = parseInt(endCell.substring(1));

    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);

    let sum = 0;

    for (let c = minCol; c <= maxCol; c++) {
        for (let r = minRow; r <= maxRow; r++) {
            const currentCell = `${String.fromCharCode(c + 65)}${r}`;
            if (evaluatingCells.has(currentCell)) {
                throw new Error("Circular dependency");
            }
            sum += resolveCell(currentCell);
        }
    }

    return sum;
}
