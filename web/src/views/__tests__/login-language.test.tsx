import { act, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../Login";
import { DEFAULT_SETTINGS, useSettings } from "@/store/settings";
import { loadLanguage, subscribeForTest, whenLanguageReady, currentLanguage } from "@/lib/i18n";

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
function TranslatedLogin() {
  useSyncExternalStore(subscribeForTest, currentLanguage);
  return <LoginPage />;
}
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ appName: "Webmail", logoUrl: "https://cdn.example.com/logo.png", sourceUrl: "https://github.com/lehuunghi/webmail" }) }));
  useSettings.setState({ settings: { ...DEFAULT_SETTINGS, uiLanguage: "en" } });
  await loadLanguage("en");
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(<TranslatedLogin />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  useSettings.setState({ settings: { ...DEFAULT_SETTINGS } });
  await loadLanguage("en");
  vi.unstubAllGlobals();
});

describe("language selection before sign-in", () => {
  it("uses the deployment logo and falls back when it cannot load", async () => {
    const logo = host.querySelector<HTMLImageElement>(".login-brand img")!;
    expect(logo.getAttribute("src")).toBe("https://cdn.example.com/logo.png");
    expect(logo.getAttribute("referrerpolicy")).toBe("no-referrer");
    await act(async () => logo.dispatchEvent(new Event("error")));
    expect(logo.getAttribute("src")).toContain("/img/webmail.svg");
  });
  it("changes labels and the document language, then switches back", async () => {
    const select = host.querySelector<HTMLSelectElement>("#login-language")!;
    expect(select).toBeTruthy();
    await act(async () => {
      select.value = "vi";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      await whenLanguageReady();
    });
    expect(document.documentElement.lang).toBe("vi");
    expect(host.querySelector('button[type="submit"]')?.textContent).toContain("Đăng nhập");
    expect(host.textContent).toContain("Mật khẩu");
    expect(useSettings.getState().settings.uiLanguage).toBe("vi");
    await act(async () => {
      select.value = "en";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      await whenLanguageReady();
    });
    expect(host.querySelector('button[type="submit"]')?.textContent).toContain("Sign in");
  });
});
