import {includes, get} from "lodash/fp";
import dashp, {collectP} from "dashp";
import pify from "pify";
import {join} from "path";
import fs from "fs";
import {envelope as env} from "@sugarcube/core";
import {mkdirP, sha256sum, md5sum} from "@sugarcube/plugin-fs";

import {youtubeDl} from "../utils";

const accessAsync = pify(fs.access);
const unlinkAsync = pify(fs.unlink);

const cleanUp = async location => {
  try {
    await accessAsync(location);
    await unlinkAsync(location);
    // eslint-disable-next-line no-empty
  } catch (e) {}
};

const downloadTypes = ["video"];

const plugin = async (envelope, {cfg, log, stats}) => {
  const dataDir = get("media.data_dir", cfg);
  const cmd = get("media.youtubedl_cmd", cfg);
  const videoFormat = get("media.download_format", cfg);
  const parallel = get("media.youtubedl_parallel", cfg);

  let mod;
  switch (parallel) {
    case parallel < 1 ? parallel : null:
      log.warn(
        `--media.youtubedl_parallel must be between 1 and 8. Setting to 1.`,
      );
      mod = "";
      break;
    case parallel === 1 ? parallel : null:
      log.info(`Run a single download at a time.`);
      mod = "";
      break;
    case parallel > 8 ? parallel : null:
      log.warn(
        `--media.youtubedl_parallel must be between 1 and 8. Setting to 8.`,
      );
      mod = 8;
      break;
    default:
      log.info(`Run ${parallel} downloads concurrently.`);
      mod = parallel;
  }

  const mapper = dashp[`flatmapP${mod}`];
  let counter = 0;

  // ensure the download directory.
  await mkdirP(dataDir);

  const data = await mapper(async unit => {
    // Avoid live broadcasts, otherwise youtubedl gets "stuck".
    if (unit.snippet != null && unit.snippet.liveBroadcastContent === "live")
      return unit;

    const medias = await collectP(async media => {
      const {type, term, href} = media;
      const source = href || term;
      const idHash = media._sc_id_hash;

      if (!includes(type, downloadTypes)) return media;

      const location = join(
        dataDir,
        unit._sc_id_hash,
        "youtubedl",
        `${idHash}.${videoFormat}`,
      );

      try {
        await accessAsync(location);

        log.info(`Video ${source} exists at ${location}.`);

        // We just skip the rest if a video already exists.
        return media;
      } catch (e) {
        if (e.code === "ENOENT") {
          try {
            await youtubeDl(cmd, videoFormat, source, location);
          } catch (ee) {
            const failed = {
              type: unit._sc_source,
              term: source,
              plugin: "media_youtubedl",
              reason: ee.message,
            };
            stats.update(
              "failed",
              fails => (Array.isArray(fails) ? fails.concat(failed) : [failed]),
            );

            log.warn(`Failed to download video ${source}: ${ee.message}`);

            await cleanUp(location);

            return media;
          }
        } else {
          throw e;
        }
      }

      log.info(`Downloaded ${source} to ${location}.`);

      const [md5, sha256] = await Promise.all([
        md5sum(location),
        sha256sum(location),
      ]);
      unit._sc_downloads.push(
        Object.assign(
          {},
          {
            location,
            md5,
            sha256,
            type,
            term,
            href,
          },
          href ? {href} : {},
        ),
      );

      counter += 1;
      if (counter % 100 === 0)
        log.debug(`Checked ${counter} out of ${envelope.data.length} units.`);

      return media;
    }, unit._sc_media);

    return Object.assign({}, unit, {_sc_media: medias});
  }, envelope.data);

  return env.envelope(data, envelope.queries);
};

plugin.desc = "Download videos using youtube-dl.";

plugin.argv = {
  "media.data_dir": {
    type: "string",
    nargs: 1,
    default: "data",
    desc: "The path to the download directory.",
  },
  "media.download_format": {
    type: "string",
    nargs: 1,
    default: "mp4",
    desc: "The download format of the video.",
  },
  "media.youtubedl_cmd": {
    type: "string",
    nargs: 1,
    default: "youtube-dl",
    desc: "The path to the youtube-dl command.",
  },
  "media.youtubedl_parallel": {
    type: "number",
    nargs: 1,
    desc:
      "Specify the number of parallel youtubedl downloads. Can be between 1 and 8.",
    default: 1,
  },
};

export default plugin;
