'use client';

import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  FileText,
  GraduationCap,
  HandCoins,
  ScanLine,
  Sparkles,
  Users,
} from 'lucide-react';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SiteHeader } from '@/components/site-header';
import { useI18n } from '@/components/i18n-provider';

const featureIcons = [
  Users,
  Sparkles,
  ScanLine,
  CalendarDays,
  HandCoins,
  GraduationCap,
];

const moduleIcons = [
  BarChart3,
  Users,
  ScanLine,
  CalendarDays,
  FileText,
  HandCoins,
  FileText,
  GraduationCap,
  BriefcaseBusiness,
];

export default function LandingPage() {
  const { dict, lang } = useI18n();
  const landing = dict.landing;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <SiteHeader />

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="from-primary/25 via-chart-2/15 to-chart-4/10 absolute -top-24 left-1/2 h-120 w-205 -translate-x-1/2 rounded-full bg-linear-to-tr blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
            style={{
              backgroundImage:
                'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            }}
          />
        </div>

        <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28">
          <Badge
            variant="secondary"
            className="mx-auto mb-6 gap-1.5 rounded-full px-3 py-1 text-xs"
          >
            <Sparkles className="size-3" />
            {landing.badge}
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            {landing.hero.title}
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-base text-pretty sm:text-lg">
            {landing.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              render={<Link href={`/${lang}/register`} />}
              nativeButton={false}
              size="lg"
            >
              {landing.hero.primaryCta}{' '}
              <ArrowRight className="rtl:rotate-180" />
            </Button>
            <Button
              render={<a href="#features" />}
              nativeButton={false}
              size="lg"
              variant="outline"
            >
              {landing.hero.secondaryCta}
            </Button>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {landing.stats.map((s) => (
              <div
                key={s.label}
                className="bg-card/60 rounded-2xl border p-4 backdrop-blur-sm"
              >
                <p className="text-2xl font-semibold tracking-tight">
                  {s.value}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {landing.features.title}
          </h2>
          <p className="text-muted-foreground mt-4">
            {landing.features.subtitle}
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {landing.features.items.map((f, index) => {
            const Icon = featureIcons[index] ?? Sparkles;
            return (
              <div
                key={f.title}
                className="group bg-card hover:shadow-primary/5 rounded-2xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex size-11 items-center justify-center rounded-xl transition-colors">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="bg-muted/30 border-y">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {landing.modules.title}
            </h2>
            <p className="text-muted-foreground mt-4">
              {landing.modules.subtitle}
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {landing.modules.items.map((m, index) => {
              const Icon = moduleIcons[index] ?? BarChart3;
              return (
                <div
                  key={m.desc}
                  className="bg-card hover:border-primary/40 flex items-center gap-3 rounded-xl border p-4 transition-colors"
                >
                  <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {m.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {landing.testimonials.title}
          </h2>
          <p className="text-muted-foreground mt-4">
            {landing.testimonials.subtitle}
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {landing.testimonials.items.map((tt) => (
            <figure key={tt.name} className="bg-card rounded-2xl border p-6">
              <div className="text-primary flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <svg
                    key={i}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-4"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.286 3.958c.3.921-.755 1.688-1.54 1.118l-3.366-2.445a1 1 0 00-1.176 0l-3.366 2.445c-.784.57-1.838-.197-1.539-1.118l1.286-3.958a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-muted-foreground mt-4 text-sm">
                «{tt.quote}»
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full text-xs font-semibold">
                  {tt.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <p className="text-sm font-medium">{tt.name}</p>
                  <p className="text-muted-foreground text-xs">{tt.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {landing.pricing.title}
          </h2>
          <p className="text-muted-foreground mt-4">
            {landing.pricing.subtitle}
          </p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {landing.pricing.items.map((p) => (
            <div
              key={p.name}
              className={
                p.highlight
                  ? 'border-primary bg-card shadow-primary/10 relative rounded-2xl border-2 p-6 shadow-xl'
                  : 'bg-card rounded-2xl border p-6'
              }
            >
              {p.highlight && (
                <Badge className="absolute -top-3 left-6">
                  {landing.pricing.mostPopular}
                </Badge>
              )}
              <p className="text-muted-foreground text-sm font-medium">
                {p.name}
              </p>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">
                  {p.price}
                </span>
                {p.period && (
                  <span className="text-muted-foreground text-sm">
                    {p.period}
                  </span>
                )}
              </p>
              <p className="text-muted-foreground mt-2 text-sm">{p.desc}</p>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="text-primary mt-0.5 size-4 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                render={<Link href={`/${lang}/login`} />}
                nativeButton={false}
                className="mt-6 w-full"
                variant={p.highlight ? 'default' : 'outline'}
              >
                {p.cta}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="from-primary text-primary-foreground to-chart-4 relative overflow-hidden rounded-3xl border bg-linear-to-tr px-6 py-16 text-center sm:px-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="bg-primary-foreground/10 absolute -top-20 right-10 h-64 w-64 rounded-full blur-3xl" />
            <div className="bg-primary-foreground/10 absolute -bottom-20 left-10 h-64 w-64 rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {landing.cta.title}
            </h2>
            <p className="text-primary-foreground/80 mx-auto mt-4 max-w-lg text-pretty">
              {landing.cta.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                render={<Link href={`/${lang}/login`} />}
                nativeButton={false}
                size="lg"
                variant="secondary"
              >
                {landing.cta.primaryCta}{' '}
                <ArrowRight className="rtl:rotate-180" />
              </Button>
              <Button
                render={<a href="#features" />}
                nativeButton={false}
                size="lg"
                variant="ghost"
                className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                {landing.cta.secondaryCta}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Sparkles className="size-3.5" />
            </div>
            <span className="text-foreground font-medium">TalentIA</span>
            <span>© 2026 TalentIA. {landing.footer.rights}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="#privacy"
              className="hover:text-foreground transition-colors"
            >
              {landing.footer.privacy}
            </Link>
            <Link
              href="#terms"
              className="hover:text-foreground transition-colors"
            >
              {landing.footer.terms}
            </Link>
            <Link
              href="#contact"
              className="hover:text-foreground transition-colors"
            >
              {landing.footer.contact}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
