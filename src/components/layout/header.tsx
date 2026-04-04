"use client";

import { Bell, Search } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-owly-surface border-b border-owly-border">
      <div>
        <h2 className="text-xl font-semibold text-owly-text">{title}</h2>
        {description && (
          <p className="text-sm text-owly-text-light mt-0.5">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {searchOpen && (
          <input
            type="text"
            placeholder="Search..."
            className="px-3 py-1.5 text-sm border border-owly-border rounded-lg focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary w-64"
            autoFocus
            onBlur={() => setSearchOpen(false)}
          />
        )}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 text-owly-text-light hover:text-owly-text hover:bg-owly-primary-50 rounded-lg transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>
        <button className="relative p-2 text-owly-text-light hover:text-owly-text hover:bg-owly-primary-50 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-owly-danger rounded-full" />
        </button>
        {actions}
      </div>
    </header>
  );
}
