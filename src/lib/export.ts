import { Cells } from "./sync";

export function exportToCSV(
    cells: Cells,
    resolveCell: (id: string) => number | string,
    totalCols = 26,
    totalRows = 100
) {
    // Find the last actual row and column with data to avoid exporting 100x26 empty cells
    let maxRow = 1;
    let maxCol = 1;

    for (const [cellId, cellData] of Object.entries(cells)) {
        if (!cellData?.v) continue;

        // Extract column letters and row digits
        const colStrMatch = cellId.match(/^[A-Z]+/);
        const rowStrMatch = cellId.match(/[0-9]+$/);

        if (colStrMatch && rowStrMatch) {
            const row = parseInt(rowStrMatch[0], 10);
            const col = colStrMatch[0].charCodeAt(0) - 64; // A=1
            if (row > maxRow) maxRow = row;
            if (col > maxCol) maxCol = col;
        }
    }

    // Create CSV String
    let csvContent = "";

    for (let r = 1; r <= maxRow; r++) {
        const rowValues: string[] = [];
        for (let c = 1; c <= maxCol; c++) {
            const cellId = `${String.fromCharCode(c + 64)}${r}`;
            const rawVal = cells[cellId]?.v;

            let cellText = "";
            if (rawVal) {
                if (rawVal.startsWith("=")) {
                    // We export the EVALUATED string/number, not the raw formula, 
                    // but we wrap it in quotes if it contains a comma.
                    const evaluated = resolveCell(cellId);
                    cellText = String(evaluated);
                } else {
                    cellText = rawVal;
                }
            }

            // Escape quotes and wrap in quotes if there are commas
            if (cellText.includes(",") || cellText.includes("\"")) {
                cellText = `"${cellText.replace(/"/g, '""')}"`;
            }

            rowValues.push(cellText);
        }
        csvContent += rowValues.join(",") + "\r\n";
    }

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `spreadsheet_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
