"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useMemo, useRef, useState } from "react";
import { EVENTS, type EventHandler, Joyride, STATUS, type Step } from "react-joyride";

import { findScreen } from "@/lib/banking/screens";
import { runActions, tourSelector } from "@/lib/tour/actions";
import { findScenario, type Scenario } from "@/lib/tour/scenarios";

import { ScenarioTooltip } from "./scenario-tooltip";

/** Otomatik oynatmada her adımın ekranda kalma süresi */
const AUTOPLAY_DELAY_MS = 3500;

type ScenarioContextValue = {
  active: Scenario | null;
  autoplay: boolean;
  setAutoplay: (value: boolean) => void;
  start: (id: string) => void;
  stop: () => void;
};

const ScenarioContext = createContext<ScenarioContextValue | null>(null);

export function useScenarios() {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error("useScenarios, ScenarioProvider içinde kullanılmalı.");
  return ctx;
}

function toJoyrideSteps(scenario: Scenario): Step[] {
  return scenario.steps.map((step) => ({
    target: tourSelector(step.target),
    title: step.title,
    content: step.content,
    placement: step.placement ?? "auto",
    skipBeacon: true,
    // Aksiyonlar (yazma, tıklama) adım gösterilmeden önce çalışır.
    before: step.actions ? () => runActions(step.actions!) : undefined,
    beforeTimeout: 30_000,
    // Gönderim/sayfa geçişi sonrası hedefin oluşmasını bekle.
    targetWaitTimeout: 5_000,
  }));
}

export function ScenarioProvider({
  toolbar,
  children,
}: {
  toolbar: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState<Scenario | null>(null);
  // Her başlatmada artar: ekran yeniden mount edilir (form state'i sıfırlanır) ve Joyride yeniden kurulur.
  const [runId, setRunId] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const autoplayTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const targetHref = active?.screen ? findScreen(active.screen)?.href : null;
  // Senaryo başka bir ekrandaysa önce oraya gidilir; tur, doğru sayfaya gelince başlar.
  const ready = active !== null && (!targetHref || pathname === targetHref);
  const steps = useMemo(() => (active ? toJoyrideSteps(active) : []), [active]);

  function start(id: string) {
    const scenario = findScenario(id);
    if (!scenario) return;
    clearTimeout(autoplayTimer.current);
    const href = scenario.screen ? findScreen(scenario.screen)?.href : null;
    if (href && href !== pathname) router.push(href);
    setActive(scenario);
    setRunId((n) => n + 1);
  }

  function stop() {
    clearTimeout(autoplayTimer.current);
    setActive(null);
  }

  const handleEvent: EventHandler = (data, controls) => {
    if (data.type === EVENTS.STEP_AFTER || data.type === EVENTS.TOUR_END) {
      clearTimeout(autoplayTimer.current);
    }
    if (data.type === EVENTS.TOOLTIP && autoplay) {
      autoplayTimer.current = setTimeout(() => controls.next(), AUTOPLAY_DELAY_MS);
    }
    if (data.type === EVENTS.TOUR_END || data.status === STATUS.SKIPPED) {
      setActive(null);
    }
    if (data.type === EVENTS.TARGET_NOT_FOUND || data.type === EVENTS.ERROR) {
      console.warn("[senaryo]", data.type, data.step?.target, data.error);
    }
  };

  const value = { active, autoplay, setAutoplay, start, stop };

  return (
    <ScenarioContext value={value}>
      {toolbar}
      <div key={runId} className="contents">
        {children}
      </div>
      {active && (
        <Joyride
          key={runId}
          run={ready}
          steps={steps}
          continuous
          scrollToFirstStep
          onEvent={handleEvent}
          tooltipComponent={ScenarioTooltip}
          loaderComponent={null}
          options={{
            buttons: ["skip", "primary"],
            closeButtonAction: "skip",
            overlayClickAction: false,
            overlayColor: "rgba(0, 0, 0, 0.45)",
            arrowColor: "var(--surface)",
            primaryColor: "#059669",
            spotlightRadius: 10,
            spotlightPadding: 6,
            zIndex: 1000,
          }}
        />
      )}
    </ScenarioContext>
  );
}
