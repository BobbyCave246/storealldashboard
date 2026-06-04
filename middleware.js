// Vercel Edge Middleware — password-gates the entire dashboard at the edge.
// Runs BEFORE any HTML or data is sent to the browser, so the data is genuinely
// protected: a visitor without the password never receives the page content.
//
// The password is read from an environment variable (DASHBOARD_PASSWORD) that you
// set in the Vercel dashboard — it is never written into the code or the HTML.

export const config = {
  // Run on every request EXCEPT Vercel's internal paths and the favicon.
  // (Everything else — index.html and any future assets — is gated.)
  matcher: ['/((?!_vercel|favicon.ico).*)'],
};

export default function middleware(request) {
  const USER = 'storeall';                          // the username to type
  const PASS = process.env.DASHBOARD_PASSWORD;       // the password, from Vercel env var

  // If no password has been configured yet, fail closed (deny) rather than open.
  if (!PASS) {
    return new Response('Dashboard password not configured.', { status: 503 });
  }

  const auth = request.headers.get('authorization');

  if (auth) {
    // Header looks like: "Basic base64(user:pass)"
    const [scheme, encoded] = auth.split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded);                 // "user:pass"
      const idx = decoded.indexOf(':');
      const user = decoded.slice(0, idx);
      const pass = decoded.slice(idx + 1);
      if (user === USER && pass === PASS) {
        // Correct credentials — let the request through to the static file.
        return; // (undefined return = NextResponse.next() equivalent: continue)
      }
    }
  }

  // No/!wrong credentials — ask the browser to show its native password dialog.
  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Store All Dashboard", charset="UTF-8"',
    },
  });
}
