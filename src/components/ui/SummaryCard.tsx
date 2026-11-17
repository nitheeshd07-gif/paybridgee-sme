import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  tone?: 'navy' | 'blue' | 'green' | 'amber' | 'red';
  meta?: string;
  onClick?: () => void;
}

const TONE_MAP = {
  navy: 'bg-[#EFF6FF] text-[#142B4A]',
  blue: 'bg-[#EFF6FF] text-[#2563EB]',
  green: 'bg-emerald-50 text-[#16A34A]',
  amber: 'bg-amber-50 text-[#D97706]',
  red: 'bg-red-50 text-[#DC2626]',
};

export function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'blue',
  meta,
  onClick,
}: SummaryCardProps) {
  const content = (
    <div className="flex flex-col justify-between gap-3 p-5 bg-white border border-slate-200 rounded-xl transition-colors duration-150 hover:border-slate-300 h-full text-left">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium tracking-wide text-slate-500">{title}</span>
        <span className={`p-2 rounded-lg shrink-0 ${TONE_MAP[tone]}`} aria-hidden="true">
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div>
        <div className="text-2xl font-semibold tracking-tight text-slate-900 font-mono tabular-nums">
          {value}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span>{subtitle}</span>
          {meta && <span className="font-medium text-slate-700 whitespace-nowrap shrink-0">{meta}</span>}
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-xl cursor-pointer"
      >
        {content}
      </button>
    );
  }

  return content;
}
