import {get} from "lodash/fp";
import {flowP, tapP, caughtP} from "dashp";
import dot from "dot";
import {envelope as env, plugin as p} from "@sugarcube/core";

import {createTransporter, mail} from "../utils";
import {assertFrom} from "../assertions";

dot.log = false;

const dots = dot.process({
  path: `${__dirname}/../../views`,
  templateSettings: {strip: false},
});

const querySource = "mail_recipient";

const mailDiffStats = (envelope, {cfg, log, stats}) => {
  const recipients = env.queriesByType(querySource, envelope);
  // We only allow one sender.
  const sender = cfg.mail.from;
  const noEncrypt = get("mail.no_encrypt", cfg);
  const {added, removed, shared, meta} = stats.get("diff");

  if (added.count === 0 && removed.count === 0) {
    log.info("No new stats. Skipping mailing.");
    return Promise.resolve(envelope);
  }

  const subject = "Message from SugarCube.";
  const body = dots.diff_stats(
    Object.assign({}, {recipients, added, removed, shared, meta}),
  );
  const transporter = createTransporter(cfg.mail);

  if (cfg.mail.debug) log.info(["Email text:", "", body].join("\n"));

  return Promise.all(
    recipients.map(recipient => {
      log.info(`Mailing diff stats to ${recipient}.`);

      return flowP(
        [
          to => mail(transporter, sender, to, body, subject, !noEncrypt),
          tapP(info => {
            if (cfg.mail.debug) {
              log.info(
                ["Emailing the following:", "", info.message.toString()].join(
                  "\n",
                ),
              );
            } else {
              log.info(`Accepted mail for: ${info.accepted.join(", ")}`);
            }
          }),
          caughtP(e => {
            log.warn(`Failed to send to ${recipient}.`);
            log.warn(e);
          }),
        ],
        recipient,
      );
    }),
  ).then(() => envelope);
};

const plugin = p.liftManyA2([assertFrom, mailDiffStats]);

plugin.desc = "Mail diff stats to one or more recipient.";

plugin.argv = {};

export default plugin;
