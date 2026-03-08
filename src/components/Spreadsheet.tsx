"use client";

import React, { useState, useCallback } from 'react';
import { useDocumentCells, usePresence } from '@/lib/sync';
import { evaluateFormula } from '@/lib/parser';
import { Cell } from './Cell';
import { PresenceBar } from './PresenceBar';
import { useAuth } from './AuthProvider';
import { CheckCircle2, CloudLightning, Bold, Italic, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/export';
import { CellFormat } from '@/lib/sync';

const COLS = 26;
const ROWS = 100;
const COL_WIDTH = 100;

interface SpreadsheetProps {
    docId: string;
}

export default function Spreadsheet({ docId }: SpreadsheetProps) {
    const { user } = useAuth();
    const { cells, loading, updateCell } = useDocumentCells(docId);
    const [color] = useState(() => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`);

    const { presenceList, selectCell } = usePresence(
        docId,
        user?.uid || 'anon',
        user?.displayName || 'Anonymous',
        color
    );

    const me = presenceList[user?.uid || ''];
    const selectedCellId = me?.selectedCell;

    // Formatter mapping column index to letter A-Z
    const numToLetter = (num: number) => String.fromCharCode(65 + num);

    // Cell resolution function for parser
    const resolveCell = useCallback((id: string): number => {
        const rawVal = cells[id]?.v;
        if (!rawVal) return 0;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define, prefer-const
        const evaluated = evaluateFormula(rawVal, (cid) => resolveCell(cid));
        const num = Number(evaluated);
        return isNaN(num) ? 0 : num;
    }, [cells]);

    const handleCellChange = useCallback((id: string, value: string, format?: CellFormat) => {
        if (!user) return;
        updateCell(id, value, user.uid, format);
    }, [updateCell, user]);

    const handleSelectCell = useCallback((id: string) => {
        selectCell(id);
    }, [selectCell]);

    const handleNavigate = useCallback((currentId: string, dir: 'up' | 'down' | 'left' | 'right' | 'next') => {
        const colStr = currentId.match(/^[A-Z]+/)?.[0];
        const rowStr = currentId.match(/[0-9]+$/)?.[0];
        if (!colStr || !rowStr) return;

        let colIdx = colStr.charCodeAt(0) - 65;
        let rowIdx = parseInt(rowStr);

        if (dir === 'up') rowIdx = Math.max(1, rowIdx - 1);
        else if (dir === 'down') rowIdx = Math.min(ROWS, rowIdx + 1);
        else if (dir === 'left') colIdx = Math.max(0, colIdx - 1);
        else if (dir === 'right') colIdx = Math.min(COLS - 1, colIdx + 1);
        else if (dir === 'next') {
            if (colIdx < COLS - 1) colIdx++;
            else { colIdx = 0; rowIdx = Math.min(ROWS, rowIdx + 1); }
        }

        selectCell(`${String.fromCharCode(colIdx + 65)}${rowIdx}`);
    }, [selectCell]);

    const toggleFormat = useCallback((formatKey: keyof CellFormat) => {
        if (!selectedCellId || !user) return;

        const cell = cells[selectedCellId];
        const rawVal = cell?.v || '';
        const currentFormat = cell?.f || {};

        const newFormat: CellFormat = {
            ...currentFormat,
            [formatKey]: !currentFormat[formatKey]
        };

        handleCellChange(selectedCellId, rawVal, newFormat);
    }, [selectedCellId, cells, handleCellChange, user]);

    const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedCellId || !user) return;

        const cell = cells[selectedCellId];
        const rawVal = cell?.v || '';
        const currentFormat = cell?.f || {};

        const newFormat = {
            ...currentFormat,
            c: e.target.value
        };

        handleCellChange(selectedCellId, rawVal, newFormat);
    }, [selectedCellId, cells, handleCellChange, user]);

    const handleExport = useCallback(() => {
        exportToCSV(cells, resolveCell, COLS, ROWS);
    }, [cells, resolveCell]);

    if (loading) return <div className="text-zinc-400 p-4">Loading spreadsheet...</div>;

    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-slate-50 overflow-hidden relative">
            <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-4">
                    <h1 className="font-semibold text-emerald-500 flex items-center gap-2">
                        <CloudLightning className="w-5 h-5" /> Supersheets
                    </h1>
                    <div className="h-4 w-px bg-zinc-700 mx-2"></div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Saved to Firebase
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 bg-zinc-900 border-b border-zinc-800">
                <button
                    onClick={() => toggleFormat('b')}
                    disabled={!selectedCellId}
                    className={`p-1.5 rounded transition ${cells[selectedCellId || '']?.f?.b ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'} disabled:opacity-50`}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    onClick={() => toggleFormat('i')}
                    disabled={!selectedCellId}
                    className={`p-1.5 rounded transition ${cells[selectedCellId || '']?.f?.i ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'} disabled:opacity-50`}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-zinc-700 mx-1"></div>
                <input
                    type="color"
                    disabled={!selectedCellId}
                    value={cells[selectedCellId || '']?.f?.c || '#d4d4d8'}
                    onChange={handleColorChange}
                    className="w-6 h-6 rounded cursor-pointer disabled:opacity-50 border-0 bg-transparent p-0"
                    title="Text Color"
                />
                <div className="flex-1"></div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded transition"
                >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                </button>
            </div>

            <div className="flex-1 overflow-auto bg-zinc-950 select-none">
                <div className="inline-block min-w-min">

                    {/* Header Row (A, B, C...) */}
                    <div className="flex sticky top-0 z-30 bg-zinc-900 border-b border-zinc-700 shadow-sm shadow-black/50">
                        {/* Corner Cell */}
                        <div className="w-12 h-8 sticky left-0 z-40 bg-zinc-900 border-r border-zinc-700"></div>
                        {[...Array(COLS)].map((_, i) => (
                            <div
                                key={i}
                                className="h-8 border-r border-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-400"
                                style={{ width: COL_WIDTH }}
                            >
                                {numToLetter(i)}
                            </div>
                        ))}
                    </div>

                    {/* Body Rows */}
                    {[...Array(ROWS)].map((_, rowI) => {
                        const rowNumber = rowI + 1;
                        return (
                            <div key={rowNumber} className="flex h-8">
                                {/* Row Header (1, 2, 3...) */}
                                <div className="w-12 h-8 sticky left-0 z-20 bg-zinc-900 border-r border-b border-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-400">
                                    {rowNumber}
                                </div>

                                {/* Cells */}
                                {[...Array(COLS)].map((_, colI) => {
                                    const cellId = `${numToLetter(colI)}${rowNumber}`;
                                    const rawVal = cells[cellId]?.v || '';

                                    let displayVal: string | number = rawVal;
                                    if (rawVal.startsWith('=')) {
                                        displayVal = evaluateFormula(rawVal, resolveCell);
                                    }

                                    const activeUsersOnCell = Object.values(presenceList).filter(
                                        u => u.uid !== user?.uid && u.selectedCell === cellId && (Date.now() - u.lastActive < 60000)
                                    );

                                    return (
                                        <Cell
                                            key={cellId}
                                            cellId={cellId}
                                            value={rawVal}
                                            format={cells[cellId]?.f}
                                            displayValue={displayVal}
                                            colWidth={COL_WIDTH}
                                            isSelected={selectedCellId === cellId}
                                            activeUsersOnCell={activeUsersOnCell}
                                            onSelect={handleSelectCell}
                                            onChange={handleCellChange}
                                            onNavigate={handleNavigate}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
