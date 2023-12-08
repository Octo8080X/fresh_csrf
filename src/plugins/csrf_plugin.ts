import { type Plugin } from "../../deps.ts";
import { getHandler } from "./../handlers/csrf_handler.ts";
import type { CsrfOption } from "../type.ts";

export async function getCsrfPlugin(
  kv: Deno.Kv,
  options?: Partial<CsrfOption>,
): Promise<Plugin> {
  const handler = await getHandler(kv, options);

  return {
    name: "CsrfPlugin",
    middlewares: [
      {
        middleware: {
          handler,
        },
        path: "/",
      },
    ],
  };
}
