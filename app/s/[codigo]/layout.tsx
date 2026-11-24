import { Suspense } from "react";
import { NavSala } from "./NavSala";

export default function LayoutSala({ children }: LayoutProps<"/s/[codigo]">) {
  return (
    <div className="flex-1 flex flex-col xl:pl-60">
      <Suspense fallback={null}>
        <NavSala />
      </Suspense>
      <main className="flex-1 w-full max-w-screen-xl 2xl:max-w-[1360px] mx-auto px-4 md:px-6 xl:px-8 pt-4 md:pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] xl:pb-10">
        {children}
      </main>
    </div>
  );
}
