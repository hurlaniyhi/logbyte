"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

export interface TokenSummary {
  id: string;
  token: string;
  alias: string;
  createdAt: string;
}

interface TokenContextValue {
  tokens: TokenSummary[];
  loading: boolean;
  createToken: (alias: string) => Promise<TokenSummary | null>;
  deleteToken: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const TokenContext = createContext<TokenContextValue | null>(null);

export function TokenProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<TokenSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/tokens");
      if (!res.ok) throw new Error("Failed to load tokens");
      const data = await res.json();
      setTokens(data.tokens);
    } catch {
      toast.error("Couldn't load your tokens.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Loads the token list on mount; setState happens after the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const createToken = useCallback(async (alias: string) => {
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create token.");
        return null;
      }
      setTokens((prev) => [data.token, ...prev]);
      toast.success(`Token "${data.token.alias}" created.`);
      return data.token as TokenSummary;
    } catch {
      toast.error("Failed to create token.");
      return null;
    }
  }, []);

  const deleteToken = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/tokens/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to delete token.");
        return false;
      }
      setTokens((prev) => prev.filter((t) => t.id !== id));
      toast.success("Token deleted.");
      return true;
    } catch {
      toast.error("Failed to delete token.");
      return false;
    }
  }, []);

  return (
    <TokenContext.Provider value={{ tokens, loading, createToken, deleteToken, refresh }}>
      {children}
    </TokenContext.Provider>
  );
}

export function useTokens() {
  const ctx = useContext(TokenContext);
  if (!ctx) throw new Error("useTokens must be used within a TokenProvider");
  return ctx;
}
