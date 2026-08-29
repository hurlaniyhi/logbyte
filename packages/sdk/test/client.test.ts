import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_BASE_URL, Logbyte } from "../src/client.js";

describe("Logbyte", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn(async () => new Response(null, { status: 201 })) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("throws if token is missing", () => {
    expect(() => new Logbyte({ token: "", baseUrl: "http://x" })).toThrow(/token/);
  });

  it("defaults baseUrl to the hosted logbyte dashboard when omitted", async () => {
    const logger = new Logbyte({ token: "lb_abc" });
    logger.info("k", "m");

    await vi.waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(`${DEFAULT_BASE_URL}/api/logs`);
  });

  it("sends an info-level payload for .log()", async () => {
    const logger = new Logbyte({ token: "lb_abc", baseUrl: "http://localhost:3000" });
    logger.log("service", "hello world", { a: 1 });

    await vi.waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("http://localhost:3000/api/logs");
    expect(init.method).toBe("POST");

    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      token: "lb_abc",
      key: "service",
      level: "info",
      message: "hello world",
      meta: { a: 1 },
    });
    expect(body.timestamp).toEqual(expect.any(String));
  });

  it.each([
    ["info", "info"],
    ["warning", "warning"],
    ["error", "error"],
  ] as const)("%s() sends level=%s", async (method, level) => {
    const logger = new Logbyte({ token: "lb_abc", baseUrl: "http://localhost:3000" });
    (logger[method] as (key: string, message: string) => void)("k", "m");

    await vi.waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.level).toBe(level);
  });

  it("strips trailing slashes from baseUrl", async () => {
    const logger = new Logbyte({ token: "t", baseUrl: "http://localhost:3000///" });
    logger.info("k", "m");

    await vi.waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("http://localhost:3000/api/logs");
  });

  it("never throws into caller code and reports failures via onError", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    const onError = vi.fn();
    const logger = new Logbyte({ token: "t", baseUrl: "http://localhost:3000", onError });

    expect(() => logger.error("k", "m")).not.toThrow();
    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it("reports a missing key via onError instead of throwing", () => {
    const onError = vi.fn();
    const logger = new Logbyte({ token: "t", baseUrl: "http://localhost:3000", onError });

    expect(() => logger.info("", "m")).not.toThrow();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
