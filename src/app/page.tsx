"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { ref, onValue, push, set, serverTimestamp } from "firebase/database";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Plus, LogIn, Clock } from "lucide-react";

type DocumentMeta = {
  id: string;
  title: string;
  lastModified: number;
};

export default function Dashboard() {
  const { user, signIn, loading } = useAuth();
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      setTimeout(() => setFetching(false), 0);
      return;
    }

    const docsRef = ref(db, "documents");
    const unsubscribe = onValue(docsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const docsArray: DocumentMeta[] = Object.keys(data).map((key) => ({
          id: key,
          title: data[key].meta?.title || "Untitled Spreadsheet",
          lastModified: data[key].meta?.lastModified || 0,
        }));
        // Sort by newest first
        docsArray.sort((a, b) => b.lastModified - a.lastModified);
        setDocuments(docsArray);
      } else {
        setDocuments([]);
      }
      setFetching(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateDocument = async () => {
    if (!user) return;
    const docsRef = ref(db, "documents");
    const newDocRef = push(docsRef);
    if (newDocRef.key) {
      await set(ref(db, `documents/${newDocRef.key}/meta`), {
        title: "Untitled Spreadsheet",
        lastModified: serverTimestamp(),
        owner: user.uid,
      });
      router.push(`/doc/${newDocRef.key}`);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-zinc-950 p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center shadow-2xl">
          <div className="bg-emerald-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileSpreadsheet className="text-emerald-500 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Supersheets</h1>
          <p className="text-zinc-400 mb-8">
            Lightweight, real-time collaborative spreadsheets.
          </p>
          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-2 bg-white text-zinc-900 font-semibold py-3 px-4 rounded-lg hover:bg-zinc-100 transition duration-200"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-xl">
              <FileSpreadsheet className="text-emerald-500 w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white">Supersheets</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-zinc-400 text-sm">
              Signed in as <span className="text-white font-medium">{user.displayName}</span>
            </div>
            <img src={user.photoURL || ""} alt="" className="w-8 h-8 rounded-full bg-zinc-800" />
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-200">Recent Documents</h2>
          <button
            onClick={handleCreateDocument}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
          >
            <Plus className="w-4 h-4" />
            New Spreadsheet
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
            <div className="bg-zinc-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="text-zinc-500 w-6 h-6" />
            </div>
            <h3 className="text-zinc-300 font-medium mb-1">No documents yet</h3>
            <p className="text-zinc-500 text-sm mb-6">Create a new spreadsheet to get started.</p>
            <button
              onClick={handleCreateDocument}
              className="text-emerald-500 font-medium hover:text-emerald-400"
            >
              Create your first document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => router.push(`/doc/${doc.id}`)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-emerald-500/50 hover:bg-zinc-800/80 transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-zinc-800 group-hover:bg-emerald-500/10 p-2 rounded-lg transition">
                    <FileSpreadsheet className="text-zinc-400 group-hover:text-emerald-500 w-5 h-5 transition" />
                  </div>
                </div>
                <h3 className="text-white font-medium mb-1 truncate">{doc.title}</h3>
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                  <Clock className="w-3 h-3" />
                  {doc.lastModified ? new Date(doc.lastModified).toLocaleDateString() : "Unknown"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
