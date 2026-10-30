import { SVGProps } from "react";

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.9.25-1.5 1.55-1.5H16.5V4.3c-.27-.04-1.2-.11-2.28-.11-2.26 0-3.8 1.38-3.8 3.9V10.5h-2.5v3h2.5V21h3.08Z" />
    </svg>
  );
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 3H21.7L15.4 10.2 22.8 21H17l-4.5-6.4L7.3 21H4.5l6.7-7.7L4 3h5.9l4.1 5.8L18.9 3Zm-1.1 16.2h1.5L8.3 4.7H6.7l11.1 14.5Z" />
    </svg>
  );
}

export function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.6 7.6a2.8 2.8 0 0 0-1.97-2C17.9 5.1 12 5.1 12 5.1s-5.9 0-7.63.5a2.8 2.8 0 0 0-1.97 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.4 2.8 2.8 0 0 0 1.97 2c1.73.5 7.63.5 7.63.5s5.9 0 7.63-.5a2.8 2.8 0 0 0 1.97-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.4ZM10 15.2V8.8L15.5 12 10 15.2Z" />
    </svg>
  );
}
