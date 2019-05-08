import fs from "fs";
import path from "path";
import {promisify} from "util";
import markdown from "remark-parse";
import stringify from "remark-stringify";
import unified from "unified";
import find from "unist-util-find";
import findAfter from "unist-util-find-after";
import findAllBetween from "unist-util-find-all-between";
import heading from "mdast-util-heading-range";
import toString from "mdast-util-to-string";
import u from "unist-builder";

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const packages = "../packages";
const pluginPackages = fs.readdirSync(packages).reduce((memo, pkg) => {
  if (pkg.startsWith("plugin")) return memo.concat(pkg);
  return memo;
}, []);

const listPluginReadmes = (target) =>
  Promise.all(
    pluginPackages.map(async (pkg) => {
      const file = await readFile(path.resolve(target, pkg, "README.md"));
      return file.toString();
    }),
  );

(async () => {
  const readmes = await listPluginReadmes(packages);

  const pluginHeaders = readmes.reduce((memo, readme) => {
    const tree = unified()
      .use(markdown)
      .parse(readme);

    const installSection = find(tree, {
      type: "heading",
      children: [{value: "Installation"}],
    });

    const pluginSection = find(tree, {
      type: "heading",
      children: [{value: "Plugins"}],
    });

    const nextSection = findAfter(tree, pluginSection, {
      type: "heading",
      depth: pluginSection.depth,
    });

    let installation;
    try {
      installation = findAllBetween(tree, installSection, pluginSection);
    } catch (e) {
      // the aqicn, facebook, google, guardian, http, wget, instagram, media
      // telegram, tika and tor package name the install section Usage, not
      // Installation.
      // console.error(readme);
    }
    const plugins = findAllBetween(tree, pluginSection, nextSection);

    return plugins
      .filter(
        (p) => p.type === "heading" && p.depth === pluginSection.depth + 1,
      )
      .reduce((acc, p) => {
        acc.concat(toString(p));
      }, memo);
  }, []);
  console.log(pluginHeaders);
})();
