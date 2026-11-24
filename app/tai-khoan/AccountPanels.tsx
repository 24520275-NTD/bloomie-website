import { ArrowRight, ChevronRight, LogOut, MapPin, Pencil, Sparkles, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export type MenuItemData = {
  id?: string;
  href?: string;
  label: string;
  icon: LucideIcon;
  detail?: string;
  badge?: string;
};

function MenuItem({ item, pending, onNotice, mobile = false }: {
  item: MenuItemData;
  pending: number | null;
  onNotice: (title: string) => void;
  mobile?: boolean;
}) {
  const Icon = item.icon;
  const selected = item.id === "don-hang";
  const badge = selected && pending ? `${pending} đơn mới` : item.badge;
  const className = mobile
    ? `acct-btn shrink-0 whitespace-nowrap ${selected ? "acct-primary" : "acct-light"}`
    : `relative flex min-h-11 w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2 text-left text-sm hover:bg-[#F1F6EC] ${selected ? "bg-[#E8F1DD] font-semibold text-[#245C45]" : "text-[#4A5568]"}`;
  const content = (
    <>
      {selected && !mobile && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-[5px] rounded-r bg-[#245C45]" />}
      <Icon size={17} aria-hidden="true" className={item.id === "creator" ? "shrink-0 text-[#A33F05]" : "shrink-0"} />
      <span className="flex-1">{item.label}</span>
      {!mobile && badge && (
        <span className={item.label === "Thông báo" ? "acct-tag bg-[#F58220] text-[#20190F]" : "acct-tag bg-[#FFF0DA] text-[#874215]"}>
          {badge}
        </span>
      )}
      {!mobile && !badge && !selected && (
        <span className="flex shrink-0 items-center gap-1 text-xs">{item.detail}<ChevronRight size={14} aria-hidden="true" /></span>
      )}
    </>
  );

  return item.href ? (
    <Link href={item.href} className={className}>{content}</Link>
  ) : item.id ? (
    <a href={`#${item.id}`} aria-current={selected ? "location" : undefined} className={className}>{content}</a>
  ) : (
    <button type="button" onClick={() => onNotice(item.label)} className={className}>{content}</button>
  );
}

export function AccountSidebar({ profile, menu, pending, onNotice, onEdit, onSignOut, signingOut }: {
  profile: { initial: string; name: string; email?: string };
  menu: { label: string; items: MenuItemData[] }[];
  pending: number | null;
  onNotice: (title: string) => void;
  onEdit: () => void;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  return (
    <aside className="min-w-0 space-y-4 lg:sticky lg:top-6">
      <section id="thong-tin" aria-label="Hồ sơ tài khoản" className="acct-card scroll-mt-6 bg-[#E8F1DD] p-6 text-center">
        <div className="relative mx-auto grid size-16 place-items-center rounded-full bg-[#245C45] text-2xl font-extrabold text-white">
          {profile.initial}
          <span role="img" aria-label="Đang trực tuyến" className="absolute right-0 bottom-0 size-4 rounded-full border-2 border-[#E8F1DD] bg-[#00B985]" />
        </div>
        <h2 className="acct-heading mt-3 text-lg font-bold">{profile.name}</h2>
        <p className="mt-1 break-all text-sm text-[#4A5568]">{profile.email}</p>
        <p className="acct-tag mt-4 bg-white text-[#245C45]"><Star size={13} aria-hidden="true" className="fill-[#F58220] text-[#A33F05]" />Thành viên Bloomie</p>
        <button type="button" className="acct-btn acct-light mt-4 w-full" onClick={onEdit}>
          <Pencil size={15} aria-hidden="true" /> Chỉnh sửa hồ sơ
        </button>
      </section>

      <nav aria-label="Menu tài khoản" className="acct-card bg-white p-4 sm:p-5">
        <div className="flex gap-2 overflow-x-auto p-1 lg:hidden">
          {menu.flatMap((group) => group.items.map((item) => (
            <MenuItem key={item.label} item={item} pending={pending} onNotice={onNotice} mobile />
          )))}
        </div>
        <div className="hidden divide-y divide-[#E7EDE2] lg:block">
          {menu.map((group) => (
            <section key={group.label} className="py-4 first:pt-2">
              <h3 className="mb-2 px-3 text-[11px] font-bold tracking-wide text-[#4A5568]">{group.label}</h3>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.label}><MenuItem item={item} pending={pending} onNotice={onNotice} /></li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <button type="button" onClick={onSignOut} disabled={signingOut} className="acct-btn mt-2 w-full border border-[#F1DAD6] text-[#B42318] hover:bg-[#FFF1EF] disabled:opacity-60">
          <LogOut size={16} aria-hidden="true" /> {signingOut ? "Đang đăng xuất…" : "Đăng xuất"}
        </button>
      </nav>
    </aside>
  );
}

export function StatCard({ stat }: { stat: { label: string; value: number | string | null; description: string; icon: LucideIcon } }) {
  const Icon = stat.icon;
  return (
    <article className="acct-card bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-bold tracking-wide text-[#4A5568]">{stat.label}</h2>
        <span className="acct-icon bg-[#E8F1DD] text-[#245C45]"><Icon size={18} aria-hidden="true" /></span>
      </div>
      <p className="acct-heading mt-2 text-[34px] leading-none font-extrabold">{stat.value ?? "—"}</p>
      <p className="mt-2 text-xs leading-5 text-[#4A5568]">{stat.description}</p>
    </article>
  );
}

export function AddressCard({ address, emptyText }: {
  address?: { recipient: string; street: string };
  emptyText: string;
}) {
  return (
    <section id="dia-chi" className="acct-card scroll-mt-6 bg-white p-5 sm:p-6">
      <header className="flex flex-wrap items-center gap-2">
        <span className="acct-icon bg-[#E8F1DD] text-[#245C45]"><MapPin size={17} aria-hidden="true" /></span>
        <h2 className="acct-heading flex-1 text-base leading-5 font-bold">Địa chỉ giao gần nhất</h2>
        {address && <span className="acct-tag bg-[#E8F1DD] text-[#245C45]">Gần nhất</span>}
      </header>
      {address ? <address className="mt-4 text-sm leading-6 not-italic">
        <p className="font-semibold">{address.recipient}</p>
        <p className="mt-1 text-[#4A5568]">{address.street}</p>
      </address> : <p className="mt-4 text-sm leading-6 text-[#4A5568]">{emptyText}</p>}
      <div className="mt-4 border-t border-[#E7EDE2] pt-3">
        <Link href="/dat-hang" className="acct-btn text-[#245C45] hover:bg-[#F1F6EC]">Nhập địa chỉ khi đặt hàng <ChevronRight size={15} aria-hidden="true" /></Link>
      </div>
    </section>
  );
}

export function CreatorCard({ creator }: { creator: { title: string; description: string } }) {
  return (
    <section id="creator" className="acct-card scroll-mt-6 bg-[#E8F1DD] p-5 sm:p-6">
      <header className="flex flex-wrap items-center gap-2">
        <span className="acct-icon bg-white text-[#A33F05]"><Sparkles size={18} aria-hidden="true" /></span>
        <h2 className="acct-heading flex-1 text-base leading-5 font-bold">{creator.title}</h2>
        <span className="acct-tag bg-white text-[#245C45]">Cộng đồng</span>
      </header>
      <p className="mt-4 text-sm leading-6 text-[#4A5568]">{creator.description}</p>
      <div className="mt-4 border-t border-[#245C45]/15 pt-4">
        <Link href="/creator/dang-ky" className="acct-btn acct-primary w-full sm:w-auto">Kiểm tra tiến độ xét duyệt <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </section>
  );
}
