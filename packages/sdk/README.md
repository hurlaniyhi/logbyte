# logbyte

Tiny structured logging client for [logbyte](https://github.com/) — send `info` / `warning` / `error` logs from any JavaScript app to your logbyte dashboard. Works in Node.js backends as well as frontend frameworks like React and Vue, since it's built on the standard `fetch` API with no Node-only dependencies.

## Install

```bash
npm install @rhydhur/logbyte
```

## Usage

1. Sign up on the [logbyte dashboard](https://logbyte-vault.vercel.app) and generate a **token** for a project/environment (e.g. `staging`, `production`).
2. Initialize the client with that token.

```ts
import { Logbyte } from "@rhydhur/logbyte";

const logger = new Logbyte({ token: "lb_your_generated_token" });

logger.info("payment-service", "Payment processed", { orderId: 123 });
logger.warning("payment-service", "Retrying after transient error", { attempt: 2 });
logger.error("payment-service", "Payment failed", { error: err.message });

// .log() is an alias for .info()
logger.log("payment-service", "Server started");
```

By default, logs are sent to the hosted logbyte dashboard at `https://logbyte-vault.vercel.app`. Self-hosting your own deployment? Point the client at it with `baseUrl`:

```ts
const logger = new Logbyte({
  token: "lb_...",
  baseUrl: "https://your-own-logbyte-deployment.com",
});
```

Every log call is fire-and-forget — it never throws into your application. Delivery failures go to an optional `onError` callback (defaults to `console.warn`):

```ts
const logger = new Logbyte({
  token: "lb_...",
  onError: (err) => metrics.increment("logbyte.delivery_failed"),
});
```

## API

`new Logbyte({ token, baseUrl?, onError? })`

- `key: string` — first argument to every log method; groups logs by source/feature (e.g. `"auth"`, `"checkout-api"`).
- `.info(key, message, meta?)`
- `.warning(key, message, meta?)`
- `.error(key, message, meta?)`
- `.log(key, message, meta?)` — alias for `.info()`

`meta` accepts any JSON-serializable value — an object, an array, a stringified JSON blob, or a primitive (string/number/boolean) — and is shown expanded in the dashboard.

## Using it in the browser (React, Vue, etc.)

The client works the same way in frontend code — install it and call it from a component, store, or effect just like any other client. One thing to keep in mind: a token used in browser-shipped code is visible to anyone who opens dev tools. Since tokens are write-only for ingestion (they can't be used to read logs back out), the main risk is someone spamming logs under that token rather than a data leak — but if that matters for your use case, prefer sending logs from your backend instead.
