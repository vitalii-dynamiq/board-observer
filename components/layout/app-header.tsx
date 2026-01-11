"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Bell,
  HelpCircle,
  Menu,
  Settings,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5 text-gray-500" />
          </Button>

          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 shadow-sm">
              <span className="text-sm font-semibold text-white">B</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold tracking-tight text-gray-900">
                Board Observer
              </h1>
              <p className="text-xs text-gray-500">Meeting Intelligence</p>
            </div>
          </Link>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <Button variant="ghost" size="icon-sm" className="relative hover:bg-gray-100/80">
            <Bell className="h-4 w-4 text-gray-500" />
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
          </Button>

          {/* Help */}
          <Button variant="ghost" size="icon-sm" className="hover:bg-gray-100/80">
            <HelpCircle className="h-4 w-4 text-gray-500" />
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon-sm" className="hover:bg-gray-100/80">
            <Settings className="h-4 w-4 text-gray-500" />
          </Button>

          {/* User menu */}
          <div className="ml-3 flex items-center gap-3 border-l border-gray-200/80 pl-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">Board Observer</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <Button variant="ghost" size="icon-sm" className="rounded-full hover:bg-transparent">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 ring-2 ring-white shadow-sm transition-transform hover:scale-105">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
