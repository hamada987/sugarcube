import fs from "fs";
import readline from "readline";
import pify from "pify";
import {OAuth2Client} from "google-auth-library";

const statAsync = pify(fs.stat);
const readFileAsync = pify(fs.readFile);
const writeFileAsync = pify(fs.writeFile);

const TOKEN_FILE = "google-sheets-token.json";

const authClient = (client, secret) =>
  new OAuth2Client(client, secret, "urn:ietf:wg:oauth:2.0:oob");

const requestToken = oauth2Client => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const question = `Authorize this app by visiting this url:
${authUrl}
and paste the OAuth token here: `;

  // eslint-disable-next-line promise/avoid-new
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.on("error", reject);
    rl.question(question, token => {
      rl.close();
      resolve(token);
    });
  });
};

const isFile = async file => {
  let stats;
  try {
    stats = await statAsync(file);
  } catch (e) {
    if (e.code === "ENOENT") return false;
    throw e;
  }
  return stats.isFile();
};

const credsFromFile = file => readFileAsync(file).then(JSON.parse);
const credsToFile = (file, credentials) =>
  writeFileAsync(file, JSON.stringify(credentials));

const authenticate = async (client, secret) => {
  const auth = authClient(client, secret);

  if (await isFile("google-sheets-token.json")) {
    auth.credentials = await credsFromFile(TOKEN_FILE);
    return auth;
  }

  const refreshToken = await requestToken(auth);
  const {tokens} = await auth.getToken(refreshToken);
  await credsToFile(TOKEN_FILE, tokens);
  auth.credentials = tokens;
  return auth;
};

export default authenticate;
