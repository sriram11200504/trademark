import React, { useState, useEffect, useRef, memo } from 'react';
import { UserPresence, CellFormat } from '@/lib/sync';

interface CellProps {
    cellId: string;
    value: string; // The raw value
    displayValue: string | number; // The computed/evaluated value
    format?: CellFormat;
    colWidth: number;
    isSelected: boolean;
    activeUsersOnCell: UserPresence[];
    onSelect: (id: string) => void;
    onChange: (id: string, value: string) => void;
    onNavigate: (id: string, dir: 'up' | 'down' | 'left' | 'right' | 'next') => void;
}

const CellComponent = ({
    cellId,
    value,
    displayValue,
    format,
    colWidth,
    isSelected,
    activeUsersOnCell,
    onSelect,
    onChange,
    onNavigate,
}: CellProps) => {
    const [editing, setEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync external value to local state when not editing
    useEffect(() => {
        if (!editing) setLocalValue(value);
    }, [value, editing]);

    // Focus input when it becomes editing
    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editing]);

    const handleDoubleClick = () => {
        setLocalValue(value);
        setEditing(true);
    };

    const handleClick = () => {
        if (!isSelected) {
            onSelect(cellId);
        }
    };

    const handleBlur = () => {
        setEditing(false);
        if (localValue !== value) {
            onChange(cellId, localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (editing) {
                setEditing(false);
                if (localValue !== value) {
                    onChange(cellId, localValue);
                }
                onNavigate(cellId, 'down');
            } else {
                setLocalValue(value);
                setEditing(true);
            }
            e.preventDefault();
        } else if (e.key === 'Tab') {
            if (editing) {
                setEditing(false);
                if (localValue !== value) {
                    onChange(cellId, localValue);
                }
            }
            onNavigate(cellId, e.shiftKey ? 'left' : 'right');
            e.preventDefault();
        } else if (e.key === 'Escape') {
            setEditing(false);
            setLocalValue(value);
            inputRef.current?.blur();
            e.preventDefault();
        } else if (!editing) {
            // Navigation keys only work when not editing
            switch (e.key) {
                case 'ArrowUp':
                    onNavigate(cellId, 'up');
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    onNavigate(cellId, 'down');
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    onNavigate(cellId, 'left');
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    onNavigate(cellId, 'right');
                    e.preventDefault();
                    break;
                case 'Backspace':
                case 'Delete':
                    onChange(cellId, '');
                    setLocalValue('');
                    e.preventDefault();
                    break;
                default:
                    // If they start typing a character, enter edit mode
                    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        setEditing(true);
                        setLocalValue(''); // It will capture the key via input naturally or we can clear
                    }
                    break;
            }
        }
    };

    // Determine border color based on other users
    let borderClass = 'border-zinc-700/50';
    let boxStyle = {};

    if (isSelected) {
        borderClass = 'border-emerald-500 z-10';
        boxStyle = { boxShadow: 'inset 0 0 0 1px #10B981' };
    } else if (activeUsersOnCell.length > 0) {
        // Show the color of the first user on the cell
        const color = activeUsersOnCell[0].color;
        boxStyle = { boxShadow: `inset 0 0 0 2px ${color}` }; borderClass = 'z-10';
    }

    // Text formatting
    const textStyle: React.CSSProperties = {};
    if (format?.b) textStyle.fontWeight = 'bold';
    if (format?.i) textStyle.fontStyle = 'italic';
    if (format?.c) textStyle.color = format.c;

    // Display value formatting
    const renderValue = () => {
        if (displayValue === '#ERROR!') {
            return <span className="text-red-400 font-medium">#ERROR!</span>;
        }
        return displayValue;
    };

    return (
        <div
            className={`relative bg-zinc-900 border-r border-b ${borderClass} h-8 flex items-center overflow-hidden`}
            style={{ width: colWidth, ...boxStyle }}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            tabIndex={isSelected ? 0 : -1} // Makes the cell focusable when selected for key events
            onKeyDown={handleKeyDown}
            ref={(el) => {
                if (el && isSelected && !editing) {
                    // Small hack to ensure the wrapper gets focus for keyboard events
                    // but prevent infinite render loops by focusing gently
                    queueMicrotask(() => {
                        if (document.activeElement !== el && document.activeElement !== inputRef.current) {
                            el.focus({ preventScroll: true });
                        }
                    });
                }
            }}
        >
            {activeUsersOnCell.map((u, i) => (
                <div
                    key={u.uid}
                    className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full z-20"
                    style={{ backgroundColor: u.color, transform: `translate(-${i * 6}px, 2px)` }}
                    title={u.name}
                />
            ))}

            {editing ? (
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full h-full bg-zinc-800 text-white px-2 outline-none"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleBlur}
                />
            ) : (
                <div
                    className="w-full h-full px-2 truncate leading-8 text-sm select-none"
                    style={{
                        color: textStyle.color || '#d4d4d8',
                        fontWeight: textStyle.fontWeight,
                        fontStyle: textStyle.fontStyle
                    }}
                >
                    {renderValue()}
                </div>
            )}
        </div>
    );
};

export const Cell = memo(CellComponent);
