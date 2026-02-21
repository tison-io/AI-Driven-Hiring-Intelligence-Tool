import Image from "next/image";

interface ApplyHeaderProps {
  companyName?: string;
  companyLogo?: string;
}

export function ApplyHeader({ companyName = "Company Name", companyLogo }: ApplyHeaderProps) {
  console.log('ApplyHeader - companyName:', companyName);
  console.log('ApplyHeader - companyLogo:', companyLogo);
  
  return (
    <header className="bg-[#0A1628] border-b border-gray-700">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Company Logo + Name */}
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

          {/* Right: TalentScan Branding */}
          <div className="flex items-center gap-2 p-2 bg-white border rounded-lg mr-8">
            <Image
              src="/images/logo.png"
              alt="TalentScanAI Logo"
              width={24}
              height={24}
              className="rounded"
            />
            <span className="text-sm text-black">
              Powered by <span className="font-semibold text-black">TalentScanAI</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
