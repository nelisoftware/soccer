import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Base({ children, ...p }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...p}
    >
      {children}
    </svg>
  );
}

export const IconeBola = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m12 7 4 3-1.5 4.5h-5L8 10z" />
    <path d="M12 3v4M16 10l4.5-1.5M14.5 14.5l2.5 4M9.5 14.5 7 18.5M8 10 3.5 8.5" />
  </Base>
);
export const IconeCampo = (p: P) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M12 5v14" />
    <circle cx="12" cy="12" r="2.5" />
  </Base>
);
export const IconePessoas = (p: P) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" />
  </Base>
);
export const IconeDinheiro = (p: P) => (
  <Base {...p}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 9v.01M18 15v.01" />
  </Base>
);
export const IconeConfig = (p: P) => (
  <Base {...p}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </Base>
);
export const IconeLuva = (p: P) => (
  <Base {...p}>
    <path d="M7 21v-4.5L4.5 13a1.8 1.8 0 0 1 2.8-2.2L9 12.5V5a1.5 1.5 0 0 1 3 0v5-6.5a1.5 1.5 0 0 1 3 0V10V5a1.5 1.5 0 0 1 3 0v9a7 7 0 0 1-3 5.7V21" />
  </Base>
);
export const IconeDesfazer = (p: P) => (
  <Base {...p}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </Base>
);
export const IconeMais = (p: P) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);
export const IconeMenos = (p: P) => (
  <Base {...p}>
    <path d="M5 12h14" />
  </Base>
);
export const IconeCima = (p: P) => (
  <Base {...p}>
    <path d="m6 15 6-6 6 6" />
  </Base>
);
export const IconeBaixo = (p: P) => (
  <Base {...p}>
    <path d="m6 9 6 6 6-6" />
  </Base>
);
export const IconeX = (p: P) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
);
export const IconePlay = (p: P) => (
  <Base {...p}>
    <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
  </Base>
);
export const IconePausa = (p: P) => (
  <Base {...p}>
    <path d="M8 5v14M16 5v14" strokeWidth="3" />
  </Base>
);
export const IconeZerar = (p: P) => (
  <Base {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </Base>
);
export const IconeTroca = (p: P) => (
  <Base {...p}>
    <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
  </Base>
);
export const IconeBusca = (p: P) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Base>
);
export const IconeCadeado = (p: P) => (
  <Base {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
  </Base>
);
export const IconeCheck = (p: P) => (
  <Base {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Base>
);
export const IconeHistorico = (p: P) => (
  <Base {...p}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6M3.5 4v4h4M12 7.5V12l3 2" />
  </Base>
);
export const IconeTrofeu = (p: P) => (
  <Base {...p}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8 20h8M9.5 17h5" />
  </Base>
);
