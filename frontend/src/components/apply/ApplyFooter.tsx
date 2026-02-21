import Image from "next/image";

interface ApplyFooterProps {
  companyName?: string;
  companyLogo?: string;
}

export function ApplyFooter({ companyName = "Company Name", companyLogo }: ApplyFooterProps) {
  return (
    <footer className="bg-[#0A1628] border-t border-gray-700 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Company Logo + Name */}
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <img src={companyLogo} alt={companyName} className="w-10 h-10 rounded" />
            ) : (
              <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center text-white font-bold">
                {companyName.charAt(0)}
              </div>
            )}
            <span className="text-lg font-semibold text-white">{companyName}</span>
          </div>

          {/* Copyright */}
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>

          {/* TalentScan Attribution */}
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>Recruitment powered by</span>
            <Image
              src="/images/logo.png"
              alt="TalentScanAI Logo"
              width={20}
              height={20}
              className="rounded"
            />
            <span className="font-semibold text-white">TalentScanAI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
