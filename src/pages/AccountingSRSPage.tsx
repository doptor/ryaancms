import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";

export default function AccountingSRSPage() {
  const srsUrl = "/srs/accounting-plugin-srs.html";

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = srsUrl;
    a.download = "RyaanCMS-Accounting-Plugin-SRS-v1.0.html";
    a.click();
  };

  const handleOpenNew = () => {
    window.open(srsUrl, "_blank");
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              Accounting Plugin SRS
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Complete Software Requirements Specification — ready for Laravel development.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenNew}>
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Open in New Tab
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download HTML
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <iframe
            src={srsUrl}
            className="w-full border-0"
            style={{ height: "calc(100vh - 200px)", minHeight: "600px" }}
            title="Accounting Plugin SRS"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
