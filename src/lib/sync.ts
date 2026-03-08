import { useEffect, useState, useCallback, useRef } from 'react';
import { ref, onValue, set, onDisconnect, remove, DataSnapshot, DatabaseReference } from 'firebase/database';
import { db } from './firebase';

export type UserPresence = {
    uid: string;
    name: string;
    color: string;
    selectedCell: string | null;
    lastActive: number;
};

export type CellFormat = {
    b?: boolean; // bold
    i?: boolean; // italic
    c?: string;  // text color code
};

export type CellValue = {
    v: string; // The raw inputted value, e.g., "=A1+2" or "Hello" or "42"
    by: string; // User ID who last edited
    f?: CellFormat;
};

export type Cells = Record<string, CellValue>; // Keyed by cell ID, e.g., "A1", "B2"

// Hook to subscribe to cell changes in a document
export function useDocumentCells(docId: string) {
    const [cells, setCells] = useState<Cells>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!docId) return;
        const docRef = ref(db, `documents/${docId}/cells`);
        const unsubscribe = onValue(docRef, (snapshot: DataSnapshot) => {
            const data = snapshot.val();
            setCells(data || {});
            setLoading(false);
        });

        return () => unsubscribe();
    }, [docId]);

    const updateCell = useCallback(async (cellId: string, value: string, userId: string, format?: CellFormat) => {
        if (!docId) return;
        const cellRef = ref(db, `documents/${docId}/cells/${cellId}`);
        if (value === "" && !format) {
            // Remove entirely empty cells to save space
            await remove(cellRef);
        } else {
            const payload: Partial<CellValue> = { v: value, by: userId };
            if (format) payload.f = format;
            await set(cellRef, payload);
        }
    }, [docId]);

    return { cells, loading, updateCell };
}

// Hook to manage presence and cell selection
export function usePresence(docId: string, userId: string, userName: string, userColor: string) {
    const [presenceList, setPresenceList] = useState<Record<string, UserPresence>>({});
    const myPresenceRef = useRef<DatabaseReference | null>(null);

    useEffect(() => {
        if (!docId || !userId) return;

        const presenceRef = ref(db, `documents/${docId}/presence`);

        // Subscribe to all presence updates
        const unsubscribe = onValue(presenceRef, (snapshot: DataSnapshot) => {
            const data = snapshot.val();
            setPresenceList(data || {});
        });

        // Setup my own presence
        const myRef = ref(db, `documents/${docId}/presence/${userId}`);
        myPresenceRef.current = myRef;

        const myPresenceData: UserPresence = {
            uid: userId,
            name: userName,
            color: userColor,
            selectedCell: null,
            lastActive: Date.now(),
        };

        set(myRef, myPresenceData);

        // Disconnect handler
        onDisconnect(myRef).remove();

        return () => {
            unsubscribe();
            // Clean up on unmount
            if (myRef) {
                remove(myRef);
            }
        };
    }, [docId, userId, userName, userColor]);

    // Update selected cell
    const selectCell = useCallback((cellId: string | null) => {
        if (myPresenceRef.current) {
            set(myPresenceRef.current, {
                uid: userId,
                name: userName,
                color: userColor,
                selectedCell: cellId,
                lastActive: Date.now(),
            });
        }
    }, [userId, userName, userColor]);

    return { presenceList, selectCell };
}
