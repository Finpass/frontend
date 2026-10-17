"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth/state/auth-context";
import { profileApi } from "@/features/profile/api/profile-api";
import { LangToggle, PageSkeleton } from "@/features/profile/components/common";
import { ProfileLangProvider } from "@/features/profile/state/use-lang";
import { userMessage } from "@/lib/api-error";
import { guardDecision } from "@/features/dashboard/lib/guard";
import { formatUpdated } from "@/features/dashboard/lib/format";
import { ChromeContext, useChrome, useDash, useNow, useResource } from "@/features/dashboard/state/use-dash";
import { useDismiss } from "@/features/dashboard/state/use-dismiss";
import { BellIcon, ChevronIcon, ClockIcon, CompassIcon, GearIcon, HomeIcon, NewsIcon, SearchIcon, SparkIcon, StarIcon } from "./icons";
import { InlineError, focusRing } from "./ui";

const NAV = [
  { href: "/dashboard", key: "home", icon: HomeIcon, match: (p: string) => p === "/dashboard" || p.startsWith("/dashboard/portfolio") },
  { href: "/dashboard/news", key: "news", icon: NewsIcon, match: (p: string) => p.startsWith("/dashboard/news") },
  { href: "/dashboard/discover", key: "discover", icon: CompassIcon, match: (p: string) => p.startsWith("/dashboard/discover") },
  { href: "/dashboard/advisory", key: "advisory", icon: SparkIcon, match: (p: string) => p.startsWith("/dashboard/advisory") },
  { href: "/dashboard/settings", key: "settings", icon: GearIcon, match: (p: string) => p.startsWith("/dashboard/settings") },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <ProfileLangProvider>
      <Frame>{children}</Frame>
    </ProfileLangProvider>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [plan, setPlan] = useState("Platinum Member");
  const chrome = useMemo(() => ({ search, setSearch, updatedAt, setUpdatedAt, plan, setPlan }), [search, updatedAt, plan]);
  const { t } = useDash();
  return (
    <ChromeContext.Provider value={chrome}>
      <div className="font-app min-h-screen bg-paper text-ink">
        <a href="#main" className={`sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-ink ${focusRing}`}>{t.skip}</a>
        <TopBar />
        <div className="lg:flex">
          <Sidebar />
          <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-4 pb-28 pt-6 outline-none sm:px-7 lg:pb-10">
            <Gate>{children}</Gate>
          </main>
        </div>
        <BottomNav />
      </div>
    </ChromeContext.Provider>
  );
}

function Gate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === "loading") return <PageSkeleton />;
  if (status === "guest") return <SignIn />;
  return <ProfileGuard>{children}</ProfileGuard>;
}

function SignIn() {
  const { openAuth } = useAuth();
  const { t } = useDash();
  const asked = useRef(false);
  useEffect(() => {
    if (!asked.current) {
      asked.current = true;
      openAuth("login");
    }
  }, [openAuth]);
  return (
    <div className="mx-auto max-w-lg pt-10">
      <h1 className="text-2xl font-bold">{t.gate.signInTitle}</h1>
      <p className="mt-3 text-ink/70">{t.gate.signInBody}</p>
      <button type="button" onClick={() => openAuth("login")} className={`mt-6 h-12 rounded-xl bg-primary px-6 font-semibold text-primary-ink ${focusRing}`}>{t.gate.signInCta}</button>
    </div>
  );
}

function ProfileGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { t } = useDash();
  const { user } = useAuth();
  const p = useResource(`profile:${user?.id ?? ""}`, () => profileApi.get());
  const gate = p.loading && !p.data ? "loading" : p.error && !p.data ? "error" : (p.data?.status ?? "loading");
  const verdict = guardDecision("authed", gate);

  useEffect(() => {
    if (verdict === "onboarding") router.replace("/onboarding");
  }, [verdict, router]);

  if (verdict === "ok") return <>{children}</>;
  if (verdict === "error") return <InlineError message={p.error ? userMessage(p.error) : t.gate.profileError} onRetry={p.reload} />;
  if (verdict === "onboarding") return <p role="status" className="pt-10 text-ink/70">{t.gate.toOnboarding}</p>;
  return <PageSkeleton />;
}

function Logo() {
  return (
    <Link href="/" className={`font-display text-xl uppercase tracking-wide ${focusRing}`}>
      Finpass<span className="text-gain">.</span>
    </Link>
  );
}

function TopBar() {
  const { t, lang } = useDash();
  const pathname = usePathname();
  const { search, setSearch, updatedAt } = useChrome();
  const onNews = pathname.startsWith("/dashboard/news");
  const now = useNow();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-stroke bg-paper/90 px-4 backdrop-blur sm:gap-4 sm:px-7">
      <div className={`flex shrink-0 items-center gap-4 ${onNews ? "max-sm:hidden" : ""}`}>
        <Logo />
        <span aria-hidden className="hidden h-5 w-px bg-stroke md:block" />
        <p className="hidden text-xs uppercase tracking-widest text-ink/60 md:block">{t.tagline}</p>
      </div>
      {onNews && (
        <div className="relative min-w-0 flex-1 md:ml-6 md:w-96 md:flex-none">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/60" />
          <input
            type="search"
            aria-label={t.bar.searchLabel}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.bar.searchPlaceholder}
            className={`h-10 w-full rounded-xl border border-stroke bg-surface pl-10 pr-3 text-sm placeholder:text-ink/50 ${focusRing}`}
          />
        </div>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {onNews && updatedAt && (
          <p className="hidden items-center gap-2 text-xs text-ink/70 xl:flex">
            <ClockIcon className="size-4 text-gain" />
            <span>{t.bar.updated}</span>
            <b className="font-semibold text-ink">{formatUpdated(updatedAt, now, lang)}</b>
          </p>
        )}
        <LangToggle />
        {onNews && <Bell />}
        <div className="lg:hidden"><UserMenu compact /></div>
      </div>
    </header>
  );
}

function Bell() {
  const { t } = useDash();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={t.bar.bell} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((o) => !o)} className={`grid size-10 place-items-center rounded-xl border border-stroke bg-surface ${focusRing}`}>
        <BellIcon />
      </button>
      {open && <div role="dialog" aria-label={t.bar.bell} className="absolute right-0 top-12 z-40 w-64 rounded-xl border border-stroke bg-surface p-4 text-sm text-ink/80 shadow-xl">{t.bar.noNotifications}</div>}
    </div>
  );
}

function Sidebar() {
  const { t } = useDash();
  const pathname = usePathname();
  const { plan } = useChrome();
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col border-r border-stroke px-4 py-5 lg:flex">
      <nav aria-label={t.nav.label}>
        <ul className="space-y-1">
          {NAV.map((n) => {
            const on = n.match(pathname);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={on ? "page" : undefined}
                  className={`flex h-11 items-center gap-3 border-l-2 px-3 text-sm ${focusRing} ${on ? "rounded-r-xl border-accent bg-accent/10 font-bold text-accent" : "rounded-xl border-transparent text-ink/70 hover:bg-surface hover:text-ink"}`}
                >
                  <n.icon />
                  {t.nav[n.key]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-stroke bg-card p-3">
          <span className="grid size-10 place-items-center rounded-lg bg-accent/15 text-accent"><StarIcon className="size-5" /></span>
          <div className="text-xs">
            <p className="text-ink/60">{t.account.status}</p>
            <p className="font-bold text-accent">{plan}</p>
          </div>
        </div>
        <div className="border-t border-stroke pt-3"><UserMenu /></div>
      </div>
    </aside>
  );
}

function UserMenu({ compact }: { compact?: boolean }) {
  const { t } = useDash();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  const name = user?.name ?? "";
  const out = async () => {
    setBusy(true);
    await signOut();
    router.replace("/");
  };
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={compact ? `${t.account.menu}: ${name}` : undefined}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-3 rounded-xl text-left ${compact ? "" : "w-full px-1 py-1"} ${focusRing}`}
      >
        {compact ? (
          <span className="grid size-10 place-items-center rounded-full bg-accent/20 text-sm font-bold text-accent">{name.slice(0, 1).toUpperCase() || "?"}</span>
        ) : (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{name}</span>
              <span className="block truncate text-xs text-ink/60">{user?.email}</span>
            </span>
            <ChevronIcon className={`size-5 shrink-0 text-ink/60 ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>
      {open && (
        <div role="menu" aria-label={t.account.menu} className={`absolute z-40 w-56 rounded-xl border border-stroke bg-surface p-1 shadow-xl ${compact ? "right-0 top-12" : "bottom-full left-0 mb-2"}`}>
          {compact && <p className="truncate px-3 py-2 text-xs text-ink/60">{user?.email}</p>}
          <button type="button" role="menuitem" autoFocus disabled={busy} onClick={out} className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-paper ${focusRing}`}>
            {busy ? t.account.signingOut : t.account.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

function BottomNav() {
  const { t } = useDash();
  const pathname = usePathname();
  return (
    <nav aria-label={t.nav.label} className="fixed inset-x-0 bottom-0 z-30 border-t border-stroke bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="grid grid-cols-6">
        {NAV.map((n) => {
          const on = n.match(pathname);
          return (
            <li key={n.href}>
              <Link href={n.href} aria-current={on ? "page" : undefined} className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] ${focusRing} ${on ? "font-bold text-accent" : "text-ink/70"}`}>
                <n.icon className="size-5" />
                <span className="max-w-full truncate px-0.5">{n.key === "discover" ? t.nav.discoverShort : t.nav[n.key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
