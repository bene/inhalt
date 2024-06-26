import { readFile } from "fs/promises";
import { sign } from "jsonwebtoken";

async function getJwt(githubAppId: string) {
  const key = await readFile("github.pem", "utf-8");
  const now = Date.now();
  const token = sign(
    {
      iat: Math.round(now / 1000) - 60,
      exp: Math.round(now / 1000) + 60 * 9,
      iss: githubAppId,
    },
    key,
    {
      algorithm: "RS256",
    }
  );
  return token;
}

export async function getAccessToken(
  githubAppId: string,
  installationId: number
) {
  const jwt = await getJwt(githubAppId);
  const headers = {
    Authorization: `Bearer ${jwt}`,
    Accept: "application/vnd.github.v3+json",
  };

  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      headers,
      method: "POST",
    }
  );

  const { token } = await res.json();
  return token;
}

export default { getAccessToken };
