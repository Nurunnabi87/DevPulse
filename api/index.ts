// Vercel serverless entry point.
// Vercel invokes the exported Express app per request, so there is no
// app.listen() here — that only happens locally via src/server.ts.
import app from "../src/app";

export default app;
