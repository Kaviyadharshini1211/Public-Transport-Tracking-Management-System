import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function base64UrlDecodeToUtf8(base64Url) {
  if (!base64Url) return null;
  let str = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";

  try {
    const binary = atob(str);
    const percentEncoded = Array.prototype.map
      .call(binary, (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("");
    return decodeURIComponent(percentEncoded);
  } catch {
    return null;
  }
}

function decodeJwtPayload(token) {
  if (!token) return null;
  const bare = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
  const parts = bare.split(".");
  if (parts.length < 2) return null;

  try {
    const json = base64UrlDecodeToUtf8(parts[1]);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export default function AuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    async function run() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      // 1️⃣ Save JWT
      localStorage.setItem("token", token);

      // 2️⃣ Decode fallback user instantly
      const decoded = decodeJwtPayload(token);
      const fallbackUser = {
        _id: decoded?.id || decoded?.sub,
        name: decoded?.name || decoded?.email?.split("@")[0],
        email: decoded?.email,
        role: decoded?.role || "passenger",
      };

      localStorage.setItem("user", JSON.stringify(fallbackUser));
      window.dispatchEvent(new Event("userChanged"));

      // 3️⃣ Small delay ensures React re-renders before redirect
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 150);

      // 4️⃣ Fetch the canonical user in background
      API.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.data?.user) {
            localStorage.setItem("user", JSON.stringify(res.data.user));
            window.dispatchEvent(new Event("userChanged"));
          }
        })
        .catch(() => {});
    }

    run();
  }, [navigate]);

  return <p>Signing you in…</p>;
}
