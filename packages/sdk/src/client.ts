import type { LogbyteOptions, LogLevel, LogMeta, LogPayload } from "./types.js";

export const DEFAULT_BASE_URL = "https://logbyte-vault.vercel.app";

export class Logbyte {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly onError: (error: Error) => void;

  constructor(options: LogbyteOptions) {
    if (!options?.token) {
      throw new Error("Logbyte: `token` is required.");
    }

    this.token = options.token;
    this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.onError =
      options.onError ??
      ((error) => {
        console.warn(`[logbyte] failed to send log: ${error.message}`);
      });
  }

  info(key: string, message: string, meta?: LogMeta): void {
    this.send("info", key, message, meta);
  }

  warning(key: string, message: string, meta?: LogMeta): void {
    this.send("warning", key, message, meta);
  }

  error(key: string, message: string, meta?: LogMeta): void {
    this.send("error", key, message, meta);
  }

  /** Alias for `.info()`. */
  log(key: string, message: string, meta?: LogMeta): void {
    this.info(key, message, meta);
  }

  private send(level: LogLevel, key: string, message: string, meta?: LogMeta): void {
    if (!key) {
      this.onError(new Error("Logbyte: `key` is required for every log call."));
      return;
    }

    const payload: LogPayload = {
      token: this.token,
      key,
      level,
      message,
      meta,
      timestamp: new Date().toISOString(),
    };

    void this.dispatch(payload);
  }

  private async dispatch(payload: LogPayload): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`request failed with status ${response.status}${body ? `: ${body}` : ""}`);
      }
    } catch (err) {
      this.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
