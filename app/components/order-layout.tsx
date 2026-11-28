import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const orderCardSurface = "border border-[#E2EBDD] bg-white p-5 shadow-sm sm:p-6";
export const orderCardClass = `rounded-3xl ${orderCardSurface}`;
export const completedOrderCardClass = `rounded-[32px] ${orderCardSurface}`;
export const orderSummaryClass = "min-w-0 rounded-3xl border border-[#E2EBDD] bg-[#E8F1DD] p-5 shadow-sm sm:p-6";
export const orderColumnsClass = "mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,10fr)_minmax(0,7fr)]";
export const orderPageClass = "mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6";
export const orderPillClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245C45]";

type Step = {
  label: string;
  detail: string;
  icon: LucideIcon;
  done: boolean;
  current: boolean;
  href?: string;
};

export function OrderSteps({ label, steps, nextStep }: { label: string; steps: Step[]; nextStep?: ReactNode }) {
  if (nextStep) {
    return (
      <section className={`${completedOrderCardClass} mt-12`}>
        <ol aria-label={label} className="grid gap-6 sm:grid-cols-3">
          {steps.map(({ label, detail, icon: Icon, current }, index) => (
            <li key={label} aria-current={current ? "step" : undefined} className="relative grid grid-cols-[40px_1fr] items-center gap-x-3 sm:flex sm:flex-col sm:text-center">
              {index > 0 && <span aria-hidden="true" className="absolute -top-6 left-5 h-6 border-l border-[#245C45] sm:top-5 sm:right-[calc(50%+2.5rem)] sm:left-auto sm:h-0 sm:w-[calc(100%-3.5rem)] sm:border-t sm:border-l-0" />}
              <span className={`relative row-span-2 grid size-10 place-items-center rounded-full ${current ? "bg-[#245C45] text-white ring-4 ring-[#E8F1DD]" : "bg-[#E8F1DD] text-[#245C45]"}`}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="text-sm font-bold sm:mt-2">{label}</span>
              <span className="text-xs text-[#4A5568] sm:mt-1">{detail}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 border-t border-[#E7EDE2] pt-4 text-center text-sm leading-6 text-[#4A5568]">{nextStep}</p>
      </section>
    );
  }

  const columns = steps.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4";
  return (
    <ol aria-label={label} className={`${orderCardClass} mt-6 grid ${columns} gap-y-5 text-center`}>
      {steps.map(({ label, detail, icon: Icon, done, current, href }, index) => (
        <li key={label} aria-current={current ? "step" : undefined} className="relative flex min-w-0 flex-col items-center px-1">
          {index > 0 && <span aria-hidden="true" className={`absolute top-5 right-1/2 hidden w-full border-t sm:block ${done || current ? "border-[#245C45]" : "border-dashed border-[#BFD2B7]"}`} />}
          <span className={`relative z-10 grid size-10 place-items-center rounded-full border-2 border-[#E8F1DD] ${done || current ? "bg-[#245C45] text-white" : "bg-[#F5F8F1] text-[#4A5568]"}`}>
            <Icon size={18} aria-hidden="true" />
          </span>
          {href ? (
            <Link href={href} className="mt-2 rounded-sm text-sm font-bold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245C45]">{label}</Link>
          ) : (
            <span className="mt-2 text-sm font-bold">{label}</span>
          )}
          <span className={`mt-1 text-xs ${current ? "text-[#754204]" : "text-[#4A5568]"}`}>{detail}</span>
        </li>
      ))}
    </ol>
  );
}
