import { useState } from "react";
import { withBase } from "@/lib/basePath";
import { useSession } from "@/store/session";

export function BrandLogo({ url, size }: { url?: string; size?: number }) {
  const configured = useSession((s) => s.session?.ihasmail?.logoUrl);
  const source = url ?? configured;
  const [failed, setFailed] = useState<string>();
  return <img src={source && failed !== source ? source : withBase("/img/webmail.svg")} alt="" width={size} height={size} style={{ objectFit: "contain" }} referrerPolicy="no-referrer" onError={() => setFailed(source)} />;
}
