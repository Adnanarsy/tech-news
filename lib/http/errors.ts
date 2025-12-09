import type { ZodError } from "zod";

export function jsonError(error: unknown, status = 400): Response {
  if (typeof error === "string") {
    return Response.json({ error }, { status });
  }
  // Zod error support (format or message)
  const zerr = error as ZodError | any;
  if (zerr?.issues || zerr?.format) {
    const payload = typeof zerr.format === "function" ? zerr.format() : { issues: zerr.issues };
    return Response.json({ error: payload }, { status });
  }
  if (error instanceof Error) {
    return Response.json({ error: error.message }, { status });
  }
  return Response.json({ error: "Unknown error" }, { status });
}

export function forbidden(message = "Forbidden") {
  return jsonError(message, 403);
}

export function notFound(message = "Not found") {
  return jsonError(message, 404);
}
