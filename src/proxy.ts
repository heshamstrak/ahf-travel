import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Admin is an internal, non-localized tool with its own auth gate — it must never be
  // intercepted/redirected by locale detection. Static assets and Next internals are excluded too.
  matcher: ["/((?!admin|_next|favicon.ico|.*\\..*).*)"],
};
