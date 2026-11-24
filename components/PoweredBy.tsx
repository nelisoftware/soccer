import Image from "next/image";
import companyLogo from "@/public/company.svg";
import { cx } from "./ui";

/** Crédito discreto da empresa: logo + "Powered by nelisoftware" e a versão do app (package.json). */
export function PoweredBy({ className }: { className?: string }) {
  return (
    <div className={cx("inline-flex items-center gap-2 text-xs text-muted", className)}>
      <Image src={companyLogo} alt="" aria-hidden className="h-7 w-auto shrink-0" />
      <div className="leading-tight">
        <p>
          Powered by <span className="font-semibold text-ink">nelisoftware</span>
        </p>
        {process.env.APP_VERSION && <p>Version: <span className="text-ink">{process.env.APP_VERSION}</span></p>}
      </div>
    </div>
  );
}
