import { FreshContext, Handlers, PageProps } from "$fresh/server.ts";
import { useSignal } from "@preact/signals";
import Counter from "../islands/Counter.tsx";
import { WithCsrf } from "fresh_csrf/src/type.ts";

export const handler: Handlers<unknown, WithCsrf> = {
  async GET(_req: Request, ctx: FreshContext) {
    const resp = await ctx.render();

    return resp;
  },
  async POST(
    req: Request,
    ctx: FreshContext<WithCsrf> ,
  ) {
    const form = await req.formData();
    const token = form.get("csrf");
    const text = form.get("text");

    if (!ctx.state.csrf.csrfVerifyFunction(token?.toString() ?? null)) {
      const res = new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });

      return res;
    }
    ctx.state.csrf.updateKeyPair();

    const resp = await ctx.render({ text });

    return resp;
  },
};

export default function Home(
  props: PageProps<{text: string}, WithCsrf>,
) {
  const count = useSignal(3);
  return (
    <div class="px-4 py-8 mx-auto bg-[#86efac]">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <img
          class="my-6"
          src="/logo.svg"
          width="128"
          height="128"
          alt="the Fresh logo: a sliced lemon dripping with juice"
        />
        <h1 class="text-4xl font-bold">Welcome to Fresh</h1>
        <p class="my-4">
          Try updating this message in the
          <code class="mx-2">./routes/index.tsx</code> file, and refresh.
        </p>
        <Counter count={count} />
        <>{props?.data?.text || "NO SET"}</>
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
    </div>
  );
}
