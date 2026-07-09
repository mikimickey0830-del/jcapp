import Link from "next/link";

type PageHeaderProps = {
  title: string;
  description?: string;
  backHref?: string;
  action?: {
    href: string;
    label: string;
  };
};

export function PageHeader({ title, description, backHref, action }: PageHeaderProps) {
  return (
    <header className="mb-5">
      <div className="mb-3 flex min-h-10 items-center justify-between gap-3">
        {backHref ? (
          <Link className="rounded-md px-2 py-2 text-sm font-bold text-jc-blue" href={backHref}>
            戻る
          </Link>
        ) : (
          <span />
        )}
        {action ? (
          <Link
            className="rounded-md bg-jc-blue px-3 py-2 text-sm font-bold text-white shadow-sm"
            href={action.href}
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      <h1 className="text-2xl font-bold text-jc-navy">{title}</h1>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
    </header>
  );
}
