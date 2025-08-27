import type { SVGProps } from "react";

export function EmergencyLogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M18.5 4l-1.16 4.35-.96-.26c-.41-.11-.83.1-.94.51-.11.41.1.83.51.94l.96.26L15.75 14H8.25l-1.16-4.35.96-.26c.41-.11.62-.53.51-.94-.11-.41-.53-.62-.94-.51l-.96.26L5.5 4H2v2h2.25l1.75 6.5c.1.37.44.63.82.63H17.18c.38 0 .72-.26.82-.63L19.75 6H22V4h-3.5z" />
    </svg>
  );
}
