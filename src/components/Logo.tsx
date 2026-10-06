export function Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="pf-logo" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00827c" />
          <stop offset="1" stopColor="#cbfffc" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#012624" />
      <path d="M32 10l5.6 16.4L54 32l-16.4 5.6L32 54l-5.6-16.4L10 32l16.4-5.6L32 10z" fill="url(#pf-logo)" />
      <circle cx="32" cy="32" r="5" fill="#012624" />
    </svg>
  );
}
