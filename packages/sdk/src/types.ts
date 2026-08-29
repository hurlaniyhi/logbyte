export type LogLevel = "info" | "warning" | "error";

export interface LogbyteOptions {
  /** Token generated for a project/environment on the logbyte dashboard. */
  token: string;
  /** Base URL of your logbyte deployment. Defaults to the hosted logbyte dashboard. */
  baseUrl?: string;
  /** Called when a log fails to send. Defaults to a console.warn. Never throws into your app. */
  onError?: (error: Error) => void;
}

export interface LogPayload {
  token: string;
  key: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}
