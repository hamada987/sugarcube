import {merge, get, includes} from "lodash/fp";
import {flowP, tapP, collectP, caughtP} from "dashp";
import {join} from "path";
import {envelope as env, plugin as p} from "@sugarcube/core";

import {assertDir, download} from "../utils";

const getTypes = ["image", "file", "pdf", "video"];

const curlGet = (envelope, {log, cfg}) => {
  const dataDir = get("http.data_dir", cfg);

  return env.fmapDataAsync(
    unit =>
      collectP(media => {
        if (!includes(media.type, getTypes)) return media;

        const {type, term} = media;
        const idHash = media._sc_id_hash;
        const location = join(dataDir, unit._sc_id_hash, type, idHash);

        return flowP(
          [
            download(location),
            () => unit._sc_downloads.push({location, type, term}),
            caughtP(e => log.error(`Get failed on ${term} with ${e}`)),
            tapP(() => log.info(`Fetched ${term} to ${location}.`)),
            () => media,
          ],
          media
        );
      }, unit._sc_media).then(ms => merge(unit, {_sc_media: ms})),
    envelope
  );
};

const plugin = p.liftManyA2([assertDir, curlGet]);

plugin.desc = "Fetch images from the web.";

export default plugin;
