# Fresh Csrf 🍋

Dead simple csrf for [Deno Csrf](https://deno.land/x/deno_csrf).

# Usage

## fresh.config.ts

```ts
/// <reference lib="deno.unstable" />
import { defineConfig } from "$fresh/server.ts";
import { getCsrfPlugin } from "../../mod.ts";
import { testPlugin } from "../plugins/test_plugin.ts";

export default defineConfig({
  plugins: [
    await getCsrfPlugin(await Deno.openKv(":memory:"), {
      encryptKey: "12345678901234567890123456789012", // <= string length of 32
      key: "01234567012345670123456701234567", // <= string length of 32
      salt: 123,
    }),
    testPlugin,
  ],
});
```

## Using the functionality provided by the plugin

Methods are provided.
- `csrfVerifyFunction()`
- `updateKeyPair()`
- `getTokenStr()`

```ts
import { FreshContext, Handlers, PageProps } from "$fresh/server.ts";
import { useSignal } from "@preact/signals";
import type { WithCsrf } from "../../mod.ts";

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
```