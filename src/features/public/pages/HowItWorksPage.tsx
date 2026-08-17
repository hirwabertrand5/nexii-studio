import { Link } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileSearch,
  MessageSquareQuote,
  PencilRuler,
  Sparkles,
  Truck,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

const steps = [
  {
    icon: FileSearch,
    title: "Browse the collection",
    description:
      "Explore live house plans by style, size, budget, and plot type until you find a design that fits your vision.",
  },
  {
    icon: ClipboardList,
    title: "Review the details",
    description:
      "Open the plan page to check room counts, dimensions, included drawings, and the preview images before you commit.",
  },
  {
    icon: CreditCard,
    title: "Complete your purchase",
    description:
      "Checkout securely and receive access to your plan package through your account after payment is confirmed.",
  },
  {
    icon: Truck,
    title: "Receive your files",
    description:
      "Download the approved plan set and keep following up through the contact page if you need support or updates.",
  },
];

const customSteps = [
  {
    icon: MessageSquareQuote,
    title: "Tell us what you want",
    description:
      "Share your plot size, budget, location, and the lifestyle you want the plan to support.",
  },
  {
    icon: PencilRuler,
    title: "We shape the brief",
    description:
      "Our team reviews the requirements and converts them into a practical architectural direction.",
  },
  {
    icon: CalendarCheck2,
    title: "You approve the direction",
    description:
      "We walk you through the proposal and refine the concept until it matches the brief.",
  },
  {
    icon: BadgeCheck,
    title: "Final delivery",
    description:
      "You receive a complete custom design package ready for the next stage of your project.",
  },
];

const highlights = [
  "Professional architectural review",
  "Clear plan previews and specifications",
  "Fast support when you need guidance",
  "Designed for African and international clients",
];

export default function HowItWorksPage() {
  return (
    <div className="bg-background">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-slate-950 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
              <Sparkles className="h-4 w-4" />
              A simple, guided buying experience
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              How NEXii works from first click to final delivery.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
              We keep the process clear and professional so you can move from inspiration to
              implementation without confusion. Browse ready-made plans, review the details, and
              check out securely. If you need something custom, we guide you through that too.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link to="/catalog">
                  Browse Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/15">
                <Link to="/contact">Talk to Us</Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-cyan-200" />
                  <span className="text-sm text-white/90">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="border-0 bg-white/10 text-white shadow-2xl backdrop-blur">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/70">At a glance</p>
                  <h2 className="text-xl font-semibold">What happens next</h2>
                </div>
              </div>

              <div className="space-y-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <div key={step.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/8 p-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/70">Step {index + 1}</p>
                        <h3 className="text-base font-semibold">{step.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-white/80">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-primary">
              Ready-made plan flow
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              The purchase journey is designed to feel effortless.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every product page is built to help buyers quickly compare options, understand what
              is included, and take action with confidence.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <Card key={step.title} className="h-full border-border/60 shadow-sm">
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-muted/60 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                Custom design process
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                When a ready-made plan is close, but not quite perfect.
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Use the custom design request flow when you want a design tailored to your plot,
                budget, and lifestyle. The process is structured, personal, and designed to keep
                momentum moving.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/custom-design">Request Custom Design</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/contact">Ask a Question</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {customSteps.map((step) => {
                const Icon = step.icon;

                return (
                  <Card key={step.title} className="border-border/60">
                    <CardContent className="p-6">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-primary to-slate-900 p-8 text-white shadow-2xl sm:p-12">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Need help choosing the right plan?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/80">
              Our team can point you toward a plan that matches your plot, building goals, and
              budget, or help you start a custom request instead.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link to="/catalog">
                  View Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/15">
                <Link to="/contact">Contact Support</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
