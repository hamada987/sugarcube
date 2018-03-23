import {size, get, getOr} from "lodash/fp";
import {envelope as env, plugin as p} from "@sugarcube/core";
import withSession from "../sheets";
import {rowsToUnits} from "../utils";
import {assertCredentials, assertSpreadsheet, assertSheet} from "../assertions";

// TODO: case for then no _sc_id_hash exists
// possibly rename this one update_from_sheet
const importData = async (envelope, {log, cfg}) => {
  const client = get("google.client_id", cfg);
  const secret = get("google.client_secret", cfg);
  const refreshToken = get("google.refresh_token", cfg);
  const id = get("google.spreadsheet_id", cfg);
  const sheet = get("google.sheet", cfg);
  const sheetFields = getOr([], "google.sheet_fields", cfg);

  const units = await withSession(
    async ({getValues}) => {
      const rows = await getValues(id, sheet);
      return rowsToUnits(sheetFields, rows);
    },
    {client, secret, refreshToken}
  );

  log.info("Spreadsheet retrieved");
  log.info(`Updating ${size(units)} units from sheet`);

  return env.concatData(units, envelope);
};

const plugin = p.liftManyA2([
  assertCredentials,
  assertSpreadsheet,
  assertSheet,
  importData,
]);

plugin.desc = "Import SugarCube data from a google spreadsheet";

plugin.argv = {
  "google.sheet": {
    type: "text",
    default: "Sheet1",
    desc: "Name of the sheet in the spreadsheet to import",
  },
};

export default plugin;
