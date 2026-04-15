import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Sparkles,
  Target,
  BarChart3,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    title: "Block Editor",
    description:
      "Drag-and-drop resume sections. Inline editing on the rendered preview. Multiple polished templates.",
  },
  {
    icon: Sparkles,
    title: "AI Writing Assistant",
    description:
      "Rewrite bullets, improve summaries, and strengthen impact with one click. Powered by Gemini.",
  },
  {
    icon: Target,
    title: "Job Tailoring",
    description:
      "Paste a job description. Get keyword analysis, match scores, and targeted rewrite suggestions.",
  },
  {
    icon: BarChart3,
    title: "Track Results",
    description:
      "Link resume versions to applications. Track outcomes. See which resumes get interviews.",
  },
];

const STEPS = [
  "Build your career profile once",
  "Create resumes from your profile data",
  "Tailor each resume for specific jobs",
  "Track applications and outcomes",
  "Get smarter suggestions over time",
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-sm">
        <span className="text-lg font-semibold tracking-tight">
          Resume Maker
        </span>
        <div className="flex gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          AI-powered resume workspace
        </div>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
          Build better resumes.
          <br />
          <span className="text-muted-foreground">Land more interviews.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          The full resume workflow in one place. Create structured profiles,
          build polished resumes with drag-and-drop, tailor for every job with
          AI, and track what works.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Start Building
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Everything you need for the job search
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            Most tools solve one slice. We solve the full workflow.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <feature.icon className="mb-3 h-8 w-8 text-primary" />
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            How it works
          </h2>
          <div className="mt-10 space-y-4">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <div className="pt-1">
                  <p className="font-medium">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold">Ready to build a better resume?</h2>
          <p className="mt-2 text-muted-foreground">
            Free to start. No credit card required.
          </p>
          <Link href="/signup">
            <Button size="lg" className="mt-6 gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Resume Maker
          </span>
          <span className="text-sm text-muted-foreground">
            Built with Next.js, Supabase, and Gemini AI
          </span>
        </div>
      </footer>
    </div>
  );
}
