"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Building2,
  Check,
  ChevronDown,
  Crown,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { getOrganizations } from "@/lib/api/meetings";
import type { Organization } from "@/lib/types";

// Industry icons mapping
const industryIcons: Record<string, string> = {
  "Postal & Logistics": "📮",
  "Government Finance": "💰",
  "Healthcare & Public Health": "🏥",
  "Government Services": "🏛️",
  "Sovereign Wealth Fund": "🏦",
};

export function OrgSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get current org from URL or localStorage
  const currentOrgSlug = searchParams.get("org");

  useEffect(() => {
    async function loadOrganizations() {
      try {
        const orgs = await getOrganizations();
        setOrganizations(orgs);

        // Check if admin (has access to all orgs)
        setIsAdmin(orgs.length > 1);

        // Find current org from URL or localStorage
        const savedSlug =
          currentOrgSlug ||
          (typeof window !== "undefined"
            ? localStorage.getItem("currentOrg")
            : null);

        if (savedSlug) {
          const org = orgs.find((o) => o.slug === savedSlug);
          if (org) {
            setCurrentOrg(org);
          } else if (orgs.length > 0) {
            setCurrentOrg(orgs[0]);
          }
        } else if (orgs.length > 0) {
          setCurrentOrg(orgs[0]);
        }
      } catch (error) {
        console.error("Failed to load organizations:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadOrganizations();
  }, [currentOrgSlug]);

  const handleSelectOrg = (org: Organization) => {
    setCurrentOrg(org);
    localStorage.setItem("currentOrg", org.slug);

    // Update URL with org parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set("org", org.slug);

    // Navigate to meetings list with org filter
    router.push(`/?${params.toString()}`);
    setIsOpen(false);
  };

  const handleViewAll = () => {
    setCurrentOrg(null);
    localStorage.removeItem("currentOrg");

    // Remove org parameter from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("org");

    router.push(`/${params.toString() ? `?${params.toString()}` : ""}`);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-9 w-48 items-center justify-center rounded-md border border-gray-200 bg-gray-50">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  if (organizations.length === 0) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 w-full max-w-[260px] justify-between gap-2 border-gray-200 bg-white px-3 text-left font-normal hover:bg-gray-50"
        >
          <div className="flex items-center gap-2 truncate">
            {currentOrg ? (
              <>
                <span className="text-base">
                  {industryIcons[currentOrg.industry || ""] || "🏢"}
                </span>
                <span className="truncate text-sm font-medium text-gray-900">
                  {currentOrg.name}
                </span>
              </>
            ) : (
              <>
                <LayoutGrid className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">
                  All Organizations
                </span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="z-50 w-[280px] rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        align="start"
        sideOffset={4}
      >
        {/* Admin: View All option */}
        {isAdmin && (
          <>
            <button
              onClick={handleViewAll}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-gray-50",
                !currentOrg && "bg-gray-100"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-gray-700 to-gray-900 text-white">
                <Crown className="h-4 w-4" />
              </div>
              <div className="flex-1 truncate">
                <p className="text-sm font-medium text-gray-900">
                  All Organizations
                </p>
                <p className="text-xs text-gray-500">Admin View</p>
              </div>
              {!currentOrg && <Check className="h-4 w-4 text-gray-900" />}
            </button>
            <div className="my-1 h-px bg-gray-200" />
          </>
        )}

        {/* Organization list */}
        <div className="max-h-[320px] overflow-y-auto">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSelectOrg(org)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-gray-50",
                currentOrg?.id === org.id && "bg-gray-100"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-lg">
                {industryIcons[org.industry || ""] || "🏢"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {org.name}
                </p>
                <p className="text-xs text-gray-500">
                  {org._count?.meetings || 0} meetings •{" "}
                  {org._count?.attendees || 0} members
                </p>
              </div>
              {currentOrg?.id === org.id && (
                <Check className="h-4 w-4 shrink-0 text-gray-900" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
