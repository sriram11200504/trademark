import { UserPresence } from "@/lib/sync";
import { useEffect, useState } from "react";

interface PresenceBarProps {
    presenceList: Record<string, UserPresence>;
    currentUserId: string;
}

export function PresenceBar({ presenceList, currentUserId }: PresenceBarProps) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 10000);
        return () => clearInterval(interval);
    }, []);

    const activeUsers = Object.values(presenceList).filter(
        (u) => now - u.lastActive < 60000 // consider active if pinged within last minute
    );

    return (
        <div className="flex items-center gap-2">
            {activeUsers.map((u) => {
                const isMe = u.uid === currentUserId;
                const initials = u.name
                    ? u.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()
                    : "?";

                return (
                    <div
                        key={u.uid}
                        className="relative group flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white shadow-sm border-2 border-zinc-900"
                        style={{ backgroundColor: u.color }}
                        title={u.name + (isMe ? " (You)" : "")}
                    >
                        {initials}
                        {!isMe && u.selectedCell && (
                            <span className="absolute -bottom-1 -right-1 bg-zinc-800 text-[9px] px-1 rounded border border-zinc-700">
                                {u.selectedCell}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
