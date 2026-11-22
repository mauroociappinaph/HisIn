"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Charts come from a real library, not from hand-drawn SVG.
 *
 * A course that teaches people to describe data should show data the way the
 * tools they use show it: axis, grid, tooltip on hover, responsive width. Recharts
 * gives that for free and keeps the code short enough to read.
 */

const PALETTE = ["#94a3b8", "#7dd3c0", "#1a8276", "#0f766e", "#0b1620"];

export function TrendChart({ caption }: { caption: string }) {
  const data = [
    { quarter: "Q1", pilots: 12, revenue: 4 },
    { quarter: "Q2", pilots: 18, revenue: 7 },
    { quarter: "Q3", pilots: 15, revenue: 6 },
    { quarter: "Q4", pilots: 27, revenue: 13 },
    { quarter: "Q5", pilots: 34, revenue: 21 },
  ];

  return (
    <figure className="space-y-1 rounded-sm bg-slate-50 p-3">
      <figcaption className="text-[11px] uppercase tracking-widest text-slate-500">
        How to comment on a chart
      </figcaption>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8e6" vertical={false} />
            <XAxis dataKey="quarter" tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 4, border: "1px solid #d7e3e0" }}
              labelStyle={{ fontSize: 11 }}
            />
            <Bar dataKey="pilots" name="clinical pilots" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={entry.quarter} fill={PALETTE[Math.min(index, PALETTE.length - 1)]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-600">{caption}</p>
    </figure>
  );
}

export function RevenueLine({ caption }: { caption: string }) {
  const data = [
    { month: "Jan", mrr: 18 },
    { month: "Feb", mrr: 24 },
    { month: "Mar", mrr: 23 },
    { month: "Apr", mrr: 31 },
    { month: "May", mrr: 42 },
  ];

  return (
    <figure className="space-y-1 rounded-sm bg-slate-50 p-3">
      <figcaption className="text-[11px] uppercase tracking-widest text-slate-500">Trend</figcaption>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8e6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4, border: "1px solid #d7e3e0" }} />
            <Line type="monotone" dataKey="mrr" name="MRR (kUSD)" stroke="#1a8276" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-600">{caption}</p>
    </figure>
  );
}
