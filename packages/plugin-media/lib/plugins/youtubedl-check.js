import {get} from "lodash/fp";
import dashp, {collectP} from "dashp";
import {youtubeDlCheck} from "../utils";

const plugin = async (envelope, {log, cfg, stats}) => {
  const cmd = get("media.youtubedl_cmd", cfg);
  const parallel = get("media.youtubedl_parallel", cfg);
  const sourceAddress = get("media.youtubedl_source_address", cfg);

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
      log.info(`Run ${parallel} checks concurrently.`);
      mod = parallel;
  }

  const mapper = dashp[`flatmapP${mod}`];
  let counter = 0;

  await mapper(async unit => {
    const videos = unit._sc_media
      .filter(({type}) => type === "video")
      .map(({term}) => term);

    await collectP(async url => {
      try {
        await youtubeDlCheck(cmd, url, sourceAddress);
      } catch (e) {
        const failed = {
          type: unit._sc_source,
          term: url,
          plugin: "media_youtubedl_check",
          reason: e.message,
        };
        stats.update(
          "failed",
          fails => (Array.isArray(fails) ? fails.concat(failed) : [failed]),
        );
        log.warn(`Check for ${url} failed: ${e.message}`);
      }
      counter += 1;
      if (counter % 100 === 0)
        log.debug(`Checked ${counter} out of ${envelope.data.length} units.`);
    }, videos);
  }, envelope.data);

  return envelope;
};

plugin.desc = "Check the availability of a video.";

plugin.argv = {
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
  "media.youtubedl_source_address": {
    type: "string",
    desc: "Bind YoutubeDL to this source IP address.",
  },
};

export default plugin;
