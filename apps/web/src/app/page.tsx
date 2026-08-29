import Link from "next/link";
import { ArrowRight, KeyRound, Layers, ScrollText, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { CodeBlock } from "@/components/marketing/code-block";

const usageSnippet = `import { Logbyte } from "@rhydhur/logbyte";

const logger = new Logbyte({ token: "lb_your_generated_token" });

logger.info("payment-service", "Payment processed", { orderId: 123 });
logger.warning("payment-service", "Retrying transient error");
logger.error("payment-service", "Payment failed", { error });

// .log() defaults to info
logger.log("payment-service", "Server started");`;

const features = [
  {
    icon: Zap,
    title: "One line to install",
    description: "npm install @rhydhur/logbyte, pass your token, and start logging. No agents, no config files.",
  },
  {
    icon: Layers,
    title: "info / warning / error",
    description: "Every log is tagged with a level so you can scan for what matters at a glance.",
  },
  {
    icon: KeyRound,
    title: "One token per environment",
    description: "Generate aliased tokens for staging, production, or any project, and switch between them instantly.",
  },
  {
    icon: ScrollText,
    title: "A dashboard built to read logs",
    description: "Color-coded levels, live search, and filters — built for scanning, not squinting at a terminal.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_50%)]"
          />
          <div className="mx-auto max-w-5xl px-6 py-24 text-center">
            <h1 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Structured logging for any JavaScript app, without the setup.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              Install the SDK, pass a token, and watch your <code className="font-mono text-foreground">.info</code>,{" "}
              <code className="font-mono text-foreground">.warning</code>, and{" "}
              <code className="font-mono text-foreground">.error</code> logs arrive on a dashboard built to be read.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="gap-2" render={<Link href="/signup" />} nativeButton={false}>
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="#usage" />} nativeButton={false}>
                See how it works
              </Button>
            </div>
          </div>

          <div className="mx-auto max-w-2xl px-6 pb-20">
            <CodeBlock code="npm install @rhydhur/logbyte" filename="terminal" />
          </div>
        </section>

        <section id="usage" className="mx-auto max-w-4xl px-6 pb-24">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Three steps, and you&apos;re logging.</h2>
              <ol className="mt-6 space-y-4 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    1
                  </span>
                  <span>
                    Sign up and generate a token for an environment, e.g.{" "}
                    <span className="font-medium text-foreground">staging</span>.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    2
                  </span>
                  <span>
                    Install <code className="font-mono text-foreground">@rhydhur/logbyte</code> in your app and
                    initialize it with that token.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    3
                  </span>
                  <span>
                    Call <code className="font-mono text-foreground">.info()</code>,{" "}
                    <code className="font-mono text-foreground">.warning()</code>, or{" "}
                    <code className="font-mono text-foreground">.error()</code> anywhere, and watch it land on your
                    dashboard.
                  </span>
                </li>
              </ol>
            </div>
            <CodeBlock code={usageSnippet} filename="server.ts" />
          </div>
        </section>

        <section className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="grid gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-xl border border-border bg-card p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                    <feature.icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Ready to see your logs somewhere nice?</h2>
          <p className="mt-3 text-muted-foreground">Free to start. No credit card required.</p>
          <Button size="lg" className="mt-6 gap-2" render={<Link href="/signup" />} nativeButton={false}>
            Create your account
            <ArrowRight className="h-4 w-4" />
          </Button>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} logbyte
        </div>
      </footer>
    </div>
  );
}
