interface HeaderProps {
  onLogoClick?: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-slate-900 rounded-lg py-1 px-1 -ml-1 transition-opacity hover:opacity-85"
          aria-label="ParkSmart SG Home"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-xs">
            P
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 font-sans">
            ParkSmart <span className="text-emerald-700 font-semibold">SG</span>
          </span>
        </button>
      </div>
    </header>
  );
}
