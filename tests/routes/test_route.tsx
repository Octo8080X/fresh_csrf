import { FreshContext, Handlers, PageProps } from "$fresh/server.ts";
import { useSignal } from "@preact/signals";
import type { WithCsrf } from "../../mod.ts";
import { resetPropWarnings } from "preact/debug";
import { getCookies } from "https://deno.land/std@0.207.0/http/cookie.ts";

export const handler: Handlers<unknown, WithCsrf> = {
  async GET(_req: Request, ctx: FreshContext) {
    const res = await ctx.render();

    return res;
  },
  async POST(
    req: Request,
    ctx: FreshContext<WithCsrf>,
  ) {
    const form = await req.formData();
    const token = form.get("csrf");
    const text = form.get("text");

    if (!ctx.state.csrf.csrfVerifyFunction(token?.toString() ?? null)) {
      const res = new Response(null, {
        status: 302,
        headers: {
          Location: "/csrf",
        },
      });

      return res;
    }
    ctx.state.csrf.updateKeyPair();

    const res = await ctx.render({ text });

    return res;
  },
};

export default function Test(
  props: PageProps<{ text: string }, WithCsrf>,
) {
  const count = useSignal(3);
  return (
    <div>
      <p>{props?.data?.text || "NO SET"}</p>
      <form method="post">
        <input
          type="hidden"
          name="csrf"
          value={props.state.csrf.getTokenStr()}
        />
        <input type="text" name="text" />
        <button class="button border">Submit</button>
      </form>
    </div>
  );
}