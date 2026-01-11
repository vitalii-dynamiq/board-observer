"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  FileType2,
  Loader2,
  Mail,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReportGeneratorProps {
  meetingId: string;
  meetingTitle: string;
}

type ExportFormat = "pdf" | "docx" | "html";

const formatConfig: Record<ExportFormat, { icon: typeof FileText; label: string }> = {
  pdf: { icon: FileText, label: "PDF Document" },
  docx: { icon: FileType2, label: "Word Document" },
  html: { icon: FileText, label: "HTML Report" },
};

export function ReportGenerator({ meetingId, meetingTitle }: ReportGeneratorProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate generation
    setTimeout(() => {
      setIsGenerating(false);
      setGenerated(true);
    }, 2000);
  };

  const handleDownload = () => {
    // Simulate download
    alert(`Downloading ${meetingTitle} report as ${selectedFormat.toUpperCase()}`);
  };

  const handleShare = () => {
    // Simulate share
    alert("Share options opened");
  };

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-card">
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">Board Report</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Generate and export a formal board meeting report
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Format selection */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(formatConfig) as ExportFormat[]).map((format) => {
              const config = formatConfig[format];
              const Icon = config.icon;
              return (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all",
                    selectedFormat === format
                      ? "border-gray-900 bg-gray-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      selectedFormat === format ? "text-gray-900" : "text-gray-400"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium",
                      selectedFormat === format ? "text-gray-900" : "text-gray-600"
                    )}
                  >
                    {format.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate button */}
        {!generated ? (
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
              <FileText className="h-5 w-5 text-green-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800">Report Ready</p>
                <p className="text-xs text-green-600">
                  {meetingTitle}.{selectedFormat}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleDownload} className="gap-1.5">
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" onClick={handleShare} className="gap-1.5">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="pt-2 border-t border-gray-100">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-gray-600">
            <Mail className="h-4 w-4" />
            Email report to attendees
          </Button>
        </div>
      </div>
    </div>
  );
}
