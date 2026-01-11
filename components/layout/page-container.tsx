import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PageContainer({
  children,
  className,
  fullWidth = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "flex-1 overflow-auto bg-gray-50/80",
        !fullWidth && "p-6 sm:p-8 lg:p-10",
        className
      )}
    >
      {!fullWidth ? (
        <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
      ) : (
        children
      )}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">{actions}</div>
      )}
    </div>
  );
}

interface PageSectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageSection({
  children,
  className,
  title,
  description,
  actions,
}: PageSectionProps) {
  return (
    <section className={cn("space-y-5", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
