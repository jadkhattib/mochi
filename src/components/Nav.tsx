import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/mmm", label: "MMM Meta" },
  { href: "/seasonal", label: "Seasonal" },
  { href: "/tv-ctv", label: "TV & CTV" },
  { href: "/digital", label: "Digital Deep Dive" },
  { href: "/halo", label: "Halo & Synergy" },
  { href: "/publishers", label: "Publishers" },
  { href: "/targeting", label: "Targeting & Funnel" },
  { href: "/flighting", label: "Flighting" },
  { href: "/optimize", label: "Optimize" },
  { href: "/params", label: "Data Params" },
];

export function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:block w-64 shrink-0 p-4">
      <div className="sticky top-6 space-y-1 rounded-2xl bg-white/70 backdrop-blur border border-black/10 p-3 shadow-sm">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`block rounded-md px-3 py-2 text-sm transition-colors ${pathname === l.href ? "bg-[#2d2d2d] text-white" : "hover:bg-black/5"}`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}


