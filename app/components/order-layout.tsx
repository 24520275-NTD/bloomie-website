import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export const orderCardClass = "rounded-3xl border border-[#E2EBDD] bg-white p-5 shadow-sm sm:p-6";
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

export function OrderSteps({ label, steps }: { label: string; steps: Step[] }) {
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
