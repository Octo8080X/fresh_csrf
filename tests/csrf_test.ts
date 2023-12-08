import { createHandler, ServeHandlerInfo } from "$fresh/server.ts";
import manifest from "./work/fresh.gen.ts";
import config from "./config/csrf_fresh.config.ts";
import { assert, assertEquals, assertNotMatch } from "./test_deps.ts";

const CONN_INFO: ServeHandlerInfo = {
  remoteAddr: { hostname: "127.0.0.1", port: 53496, transport: "tcp" },
};

Deno.test("Csrf Test", async (t) => {
  const handler = await createHandler(manifest, config);

  await t.step("Get Tokens", async () => {
    const res = await handler(new Request("http://127.0.0.1/csrf"), CONN_INFO);
    assertEquals(res.status, 200);

    const text = await res.text();
    assertEquals(text.includes("<p>NO SET</p>"), true);

    const csrfCookieToken = res.headers
      .get("set-cookie")!
      .split("csrf_token=")[1]
      .split(";")[0];
    const csrfToken = text
      .split('<input type="hidden" name="csrf" value="')[1]
      .split('"/')[0];

    assert(csrfCookieToken);
    assert(csrfToken);
    assertNotMatch(csrfCookieToken, /^$/);
    assertNotMatch(csrfToken, /^$/);
  });

  await t.step("Verification Tokens Success", async () => {
    let res = await handler(new Request("http://127.0.0.1/csrf"), CONN_INFO);

    const text = await res.text();
    const csrfCookieToken = res.headers
      .get("set-cookie")!
      .split("csrf_token=")[1]
      .split(";")[0];
    const csrfToken = text
      .split('<input type="hidden" name="csrf" value="')[1]
      .split('"/')[0];

    const formData = new FormData();
    formData.append("csrf", csrfToken);
    formData.append("text", "XXX");

    const headers = new Headers();
    headers.set("cookie", `csrf_token=${csrfCookieToken}`);

    res = await handler(
      new Request("http://127.0.0.1/csrf", {
        headers,
        method: "POST",
        body: formData,
      }),
      CONN_INFO,
    );

    assertEquals(res.status, 200);
    assertEquals((await res.text()).includes("<p>XXX</p>"), true);
  });

  await t.step("Verification Tokens Failed(Illegal Cookie Token)", async () => {
    let res = await handler(new Request("http://127.0.0.1/csrf"), CONN_INFO);

    const text = await res.text();
    const csrfCookieToken = res.headers
      .get("set-cookie")!
      .split("csrf_token=")[1]
      .split(";")[0];
    const csrfToken = text
      .split('<input type="hidden" name="csrf" value="')[1]
      .split('"/')[0];

    const formData = new FormData();
    formData.append("csrf", csrfToken);
    formData.append("text", "XXX");

    const headers = new Headers();
    headers.set("cookie", `csrf_token=${csrfCookieToken}_unknown_text`);

    res = await handler(
      new Request("http://127.0.0.1/csrf", {
        headers,
        method: "POST",
        body: formData,
      }),
      CONN_INFO,
    );

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/csrf");
  });

  await t.step("Verification Tokens Failed(Illegal Token)", async () => {
    let res = await handler(new Request("http://127.0.0.1/csrf"), CONN_INFO);

    const text = await res.text();
    const csrfCookieToken = res.headers
      .get("set-cookie")!
      .split("csrf_token=")[1]
      .split(";")[0];
    const csrfToken = text
      .split('<input type="hidden" name="csrf" value="')[1]
      .split('"/')[0];

    const formData = new FormData();
    formData.append("csrf", `${csrfToken}_unknown_text`);
    formData.append("text", "XXX");

    const headers = new Headers();
    headers.set("cookie", `csrf_token=${csrfCookieToken}`);

    res = await handler(
      new Request("http://127.0.0.1/csrf", {
        headers,
        method: "POST",
        body: formData,
      }),
      CONN_INFO,
    );

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/csrf");
  });

  await t.step("Verification Tokens Failed(Not set Cookie token)", async () => {
    let res = await handler(new Request("http://127.0.0.1/csrf"), CONN_INFO);

    const text = await res.text();
    const csrfToken = text
      .split('<input type="hidden" name="csrf" value="')[1]
      .split('"/')[0];

    const formData = new FormData();
    formData.append("csrf", `${csrfToken}_unknown_text`);
    formData.append("text", "XXX");

    const headers = new Headers();

    res = await handler(
      new Request("http://127.0.0.1/csrf", {
        headers,
        method: "POST",
        body: formData,
      }),
      CONN_INFO,
    );

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/csrf");
  });

  await t.step("Verification Tokens Failed(Not set Token)", async () => {
    let res = await handler(new Request("http://127.0.0.1/csrf"), CONN_INFO);

    const csrfCookieToken = res.headers
      .get("set-cookie")!
      .split("csrf_token=")[1]
      .split(";")[0];

    const formData = new FormData();
    formData.append("text", "XXX");

    const headers = new Headers();
    headers.set("cookie", `csrf_token=${csrfCookieToken}`);

    res = await handler(
      new Request("http://127.0.0.1/csrf", {
        headers,
        method: "POST",
        body: formData,
      }),
      CONN_INFO,
    );

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/csrf");
  });
});