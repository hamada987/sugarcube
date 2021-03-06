import {forEach, merge, values} from "lodash/fp";

import searchPlugin from "./search";
import imagesPlugin from "./images";
import reverseImagesFilesPlugin from "./reverse-images-files";

const plugins = {
  google_search: searchPlugin,
  google_images: imagesPlugin,
  google_reverse_images_files: reverseImagesFilesPlugin,
};

forEach(p => {
  // eslint-disable-next-line no-param-reassign
  p.argv = merge(
    {
      "google.headless": {
        default: true,
        type: "boolean",
        desc: "Browse headless or show the browser window.",
      },
    },
    p.argv,
  );
}, values(plugins));

export {plugins};
export default {plugins};
