import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Sparkles,
  Target,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    title: "Curated Drafts",
    description:
      "A block-based editor that treats your resume like a design canvas. Drag sections, edit inline, and see your changes rendered in real time on a pixel-perfect template.",
  },
  {
    icon: Sparkles,
    title: "AI Assistance",
    description:
      "Contextual writing help that lives inside your document. Improve bullet points, strengthen summaries, and add impact metrics with a single click.",
  },
  {
    icon: Target,
    title: "Job Tailoring",
    description:
      "Paste a job description and get an instant match score, keyword gap analysis, and AI-generated rewrite suggestions tailored to the role.",
  },
  {
    icon: BarChart3,
    title: "Job Tracking",
    description:
      "Link resume versions to applications. Track your pipeline from saved to offered. See which versions of your resume get the best results.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface)]">
      {/* Nav */}
      <header className="sticky top-0 z-50 glass-effect border-b border-ghost">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="font-headline text-lg font-bold text-[var(--on-surface)]">
            The Architect
          </span>
          <nav className="hidden items-center gap-8 text-sm text-[var(--on-surface-variant)] md:flex">
            <a href="#features" className="hover:text-[var(--on-surface)] transition-colors">Features</a>
            <a href="#workflow" className="hover:text-[var(--on-surface)] transition-colors">Workflow</a>
            <a href="#pricing" className="hover:text-[var(--on-surface)] transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-[var(--on-surface-variant)]">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="magical-gradient text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-28 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h1 className="font-headline text-[3.5rem] font-extrabold leading-[1.08] tracking-tight text-[var(--on-surface)]">
              Build a resume
              <br />
              that works as hard
              <br />
              as you do.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-[var(--on-surface-variant)]">
              The full-cycle professional workspace. From structured profile
              to polished document, powered by AI that understands career
              narratives.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="magical-gradient text-white h-12 px-8 text-base gap-2">
                  Start Your Professional Journey
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 bg-[var(--surface-container-low)]">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
            The Full Workflow
          </p>
          <h2 className="font-headline mt-3 text-3xl font-bold text-[var(--on-surface)]">
            Every stage of the resume lifecycle, solved.
          </h2>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg bg-[var(--surface-container-lowest)] p-8 shadow-ambient transition-all hover:translate-y-[-2px]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--surface-container)]">
                  <feature.icon className="h-5 w-5 text-[var(--on-surface)]" />
                </div>
                <h3 className="font-headline text-lg font-bold text-[var(--on-surface)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--on-surface-variant)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial section */}
      <section id="workflow" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
            Editorial Precision
          </p>
          <h2 className="font-headline mt-3 max-w-xl text-3xl font-bold text-[var(--on-surface)]">
            Your career story, rendered with the precision it deserves.
          </h2>
          <p className="mt-4 max-w-xl text-[var(--on-surface-variant)] leading-relaxed">
            We don&apos;t do cookie-cutter templates. The Architect treats your resume
            like an editorial product - layered typography, tonal depth, and
            intentional whitespace that communicates professionalism before a
            single word is read.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="px-6 py-20 bg-[var(--surface-container-low)]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-headline text-3xl font-bold text-[var(--on-surface)]">
            Ready to design your future?
          </h2>
          <p className="mt-3 text-[var(--on-surface-variant)]">
            Start for free. No credit card required.
          </p>
          <Link href="/signup">
            <Button size="lg" className="mt-8 magical-gradient text-white h-12 px-8 text-base">
              Start Your Professional Journey
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ghost px-6 py-8 bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="font-headline text-sm font-semibold text-[var(--on-surface)]">
            The Architect
          </span>
          <span className="text-xs text-[var(--on-surface-variant)]">
            Built for professionals who take their careers seriously.
          </span>
        </div>
      </footer>
    </div>
  );
}
