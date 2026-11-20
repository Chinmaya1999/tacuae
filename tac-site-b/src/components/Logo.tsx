export default function Logo({ className = 'h-9' }: { className?: string }) {
  return <img src="/img/logo-light.png" alt="TAC – Total Automation Co. LLC" width={900} height={388} className={`w-auto ${className}`} />
}
