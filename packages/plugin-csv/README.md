# `@sugarcube/plugin-csv`

Convert sugarcube data from and to csv.

## Installation

```shell
npm install --save @sugarcube/plugin-csv
```

## Plugins

### `csv_export`

Export sugarcube data in csv format to a file.

**Configuration**:

- `csv.delimiter` (defaults to `,`) Specify the csv delimiter.
- `csv.filename` (defaults to `out.csv`). Specify the target file.
- `csv.skip_empty` Use this option to only export data pipelines that contain
  any data.

```shell
$(npm bin)/sugarcube -c config.json -p google_search,csv_export --csv.filename data.csv
```

### `csv_export_queries`

Export the queries of an envelope to a file.

**Configuration**:

- `csv.delimiter` (defaults to `,`)

  Specify the csv delimiter.

- `csv.queries_filename` (defaults to `out.csv`). Specify the target queries file.

```shell
$(npm bin)/sugarcube -c config.json \
                     -p sheets_queries,csv_export_queries \
                     --csv.queries_filename queries.csv
```

### `csv_import`

Import a csv file, and turn it into sugarcube data.

**Configuration**:

Uses `glob_pattern` as query type.

- `csv.delimiter` (defaults to `,`)

  Specify the csv delimiter.

- `csv.id_fields` (required). Specify one or several field names (separated by
  a comma), that are used to determine the identity of a record

```shell
$(npm bin)/sugarcube -Q glob_pattern:data/**/*.csv -p csv_import,tap_printf --csv.id_fields firstName,lastName
```

### `csv_diff`

Create diff stats of the current envelope with data parsed from csv files.

**Configuration**:

Uses `diff_glob_pattern` as query type.

- `csv.delimiter` Specify the csv delimiter. Defaults to `,`.
- `csv.id_fields` (required). Specify one or several field names (separated by
  a comma), that are used to determine the identity of a record

The following example compares csv files from today and yesterday.

```shell
$(npm bin)/sugarcube -d \
  -Q glob_pattern:data/dump-$(date -d "today" +%Y-%m-%d).csv \
  -Q diff_glob_pattern:data/dump-$(date -d "yesterday" +%Y-%m-%d).csv \
  -p csv_import,csv_diff \
  --csv.id_fields name
```

### `csv_export_failed`

Export any failure stats of a pipeline run to a CSV file. The file is named `failed-stats-<marker>.csv`.

**Configuration:**

- `csv.delimiter`: Specify the csv delimiter. Defaults to `,`.
- `csv.data_dir`: Specify the directory location to write the file to. Defaults to `./data`.
- `csv.label`: Specify an additional label to add to the file name of the exported CSV file.

## Instruments

### `csv_failures_file`

Export failures to a CSV file. The name of the file is `<data-dir>/failed-stats-<marker>.csv`. If the `label` is configured, the filename is `<data-dir>/failed-stats-<label>-<marker>.csv`.

**Configuration:**

- `csv.delimiter`: Specify the csv delimiter. Defaults to `,`.
- `csv.data_dir`: Specify the directory location to write the file to. Defaults to `./data`.
- `csv.label`: Specify an additional label to add to the file name of the exported CSV file.
- `csv.append`: Append failures to a CSV file if that file already exists. The
  default behavior is to overwrite any CSV file if it has the same name.

**Example:**

```shell
sugarcube -I csv_failures_file --csv.data_dir ./csv -p youtube_channel -c config.json
```

```json
{
  "instruments": ["csv_failures_file"],
  "plugins": ["youtube_channel"],
  "csv": {
    "data_dir": "./csv"
  },
  "queries": [{"type": "youtube_channel", "term": "non-existing"}]
}
```

## License

[GPL3](./LICENSE) @ [Christo](christo@cryptodrunks.net)
