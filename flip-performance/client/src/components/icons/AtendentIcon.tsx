export function AtendentIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      {/* Headband arc */}
      <path d="M 4 8 Q 4 4 12 4 Q 20 4 20 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Left ear cup */}
      <rect x="2" y="8" width="3" height="8" rx="1.5" fill="currentColor" />
      
      {/* Right ear cup */}
      <rect x="19" y="8" width="3" height="8" rx="1.5" fill="currentColor" />
      
      {/* Microphone boom */}
      <path d="M 20 16 Q 20 18 18 18 Q 16 18 16 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Microphone ball */}
      <circle cx="16" cy="21" r="1.5" fill="currentColor" />
    </svg>
  );
}
