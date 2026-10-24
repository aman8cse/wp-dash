import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Compass, LineChart, Info, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/explorer', label: 'Forecast Explorer', icon: Compass },
  { to: '/accuracy', label: 'Accuracy Report', icon: LineChart },
  { to: '/about', label: 'Methodology & API', icon: Info },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface p-2 lg:min-h-[calc(100vh-4rem)] lg:w-64 lg:justify-between lg:border-b-0 lg:border-r lg:p-4">
      <div className="lg:space-y-6">
        <div className="space-y-1">
          <p className="hidden px-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted lg:block">
            Market Views
          </p>
          <nav className="mobile-nav-scroll flex gap-1 overflow-x-auto lg:flex-col lg:space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors sm:text-sm lg:justify-start',
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Market Window Context Box */}
        <div className="mt-6 hidden rounded-xl border border-border bg-background p-3.5 text-xs lg:block lg:space-y-2">
          <div className="flex items-center gap-2 font-semibold text-text-primary">
            <Calendar className="h-4 w-4 text-primary" />
            Market Context
          </div>
          <div className="space-y-1 text-text-secondary text-[11px]">
            <p>
              <strong className="text-text-primary">Dataset:</strong> Jan 1 - Jan 31, 2026
            </p>
            <p>
              <strong className="text-text-primary">Resolution:</strong> 30-min Settlement Periods (48/day)
            </p>
            <p>
              <strong className="text-text-primary">Gate Closure:</strong> D-1 11:00 UTC (N2EX)
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="hidden border-t border-border pt-4 text-xs text-text-muted lg:block lg:space-y-1">
        <p className="font-semibold text-text-secondary">Elexon BMRS Interface</p>
        <p className="text-[11px]">FUELHH & WINDFOR Streams</p>
      </div>
    </aside>
  );
};
