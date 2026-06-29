import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const inputs = [
  {
    file: "data/replay/input/replay-input-sg-electronics-2020-v0.1.json",
    data: {
      input_version: "replay-input-v0.1",
      case_id: "SG-ELECTRONICS-2020",
      case_label: "Singapore Electronics Shock 2020",
      country: "SG",
      historical_period_start: "2020-01",
      historical_period_end: "2020-12",
      records: [
        {
          record_id: "RPLAY_SG_ELEC_2020_001",
          metric_name: "ELECTRONICS_OUTPUT_CHANGE_YOY",
          period: "2020-Q2",
          value: -6.8,
          direction: "negative",
          source_title: "Replay Pilot Synthetic Historical Input",
          evidence_window: "Electronics output weakened during the 2020 external demand shock."
        },
        {
          record_id: "RPLAY_SG_ELEC_2020_002",
          metric_name: "NODX_CHANGE_YOY",
          period: "2020-Q2",
          value: -9.4,
          direction: "negative",
          source_title: "Replay Pilot Synthetic Historical Input",
          evidence_window: "Electronics exports weakened as external demand fell."
        }
      ]
    }
  },
  {
    file: "data/replay/input/replay-input-sg-electronics-2021-v0.1.json",
    data: {
      input_version: "replay-input-v0.1",
      case_id: "SG-ELECTRONICS-2021",
      case_label: "Singapore Electronics Recovery 2021",
      country: "SG",
      historical_period_start: "2021-01",
      historical_period_end: "2021-12",
      records: [
        {
          record_id: "RPLAY_SG_ELEC_2021_001",
          metric_name: "ELECTRONICS_OUTPUT_CHANGE_YOY",
          period: "2021-Q1",
          value: 14.2,
          direction: "positive",
          source_title: "Replay Pilot Synthetic Historical Input",
          evidence_window: "Electronics output recovered during global semiconductor demand improvement."
        },
        {
          record_id: "RPLAY_SG_ELEC_2021_002",
          metric_name: "INVENTORY_RESTOCKING_SIGNAL",
          period: "2021-Q2",
          value: 1,
          direction: "positive",
          source_title: "Replay Pilot Synthetic Historical Input",
          evidence_window: "Inventory restocking appeared during electronics recovery."
        }
      ]
    }
  },
  {
    file: "data/replay/input/replay-input-sg-services-2020-v0.1.json",
    data: {
      input_version: "replay-input-v0.1",
      case_id: "SG-SERVICES-2020",
      case_label: "Singapore Services Shock 2020",
      country: "SG",
      historical_period_start: "2020-01",
      historical_period_end: "2020-12",
      records: [
        {
          record_id: "RPLAY_SG_SERV_2020_001",
          metric_name: "SERVICES_RECEIPTS_CHANGE_YOY",
          period: "2020-Q2",
          value: -18.5,
          direction: "negative",
          source_title: "Replay Pilot Synthetic Historical Input",
          evidence_window: "Services receipts weakened sharply during mobility restrictions and demand shock."
        },
        {
          record_id: "RPLAY_SG_SERV_2020_002",
          metric_name: "TOURISM_RECEIPTS_CHANGE_YOY",
          period: "2020-Q2",
          value: -72.0,
          direction: "negative",
          source_title: "Replay Pilot Synthetic Historical Input",
          evidence_window: "Tourism receipts collapsed during border restrictions."
        }
      ]
    }
  },
  {
    file: "data/replay/input/replay-input-sg-services-2021-v0.1.json",
    data: {
      input_version: "replay-input-v0.1",
      case_id: "SG-SERVICES-2021",
      case_label: "Singapore Services Partial Recovery 2021",
      country: "SG",
      historical_period_start: "2021-01",
      historical_period_end: "2021-12",
      records: [
        {
          record_id: "RPLAY_SG_SERV_2021_001",
          metric_name: "SERVICES_RECEIPTS_CHANGE_YOY",
          period: "2021-Q2",
          value: 8.3,
          direction: "positive",
          source_title: "Replay Pilot Synthetic Historical Input",
          evidence_window: "Services receipts partially recovered as domestic activity improved."
        },
        {
          record_id: "RPLAY_SG_SERV_2021_002",
          metric_name: "POLICY_SUPPORT_SIGNAL",
          period: "2021-Q1",
          value: 1,
          direction: "positive",
          source_title: "Replay Pilot Synthetic Historical Input",
          evidence_window: "Policy support remained relevant for services recovery."
        }
      ]
    }
  }
];

ensureDir(path.join(ROOT, "data/replay/input"));

for (const item of inputs) {
  fs.writeFileSync(path.join(ROOT, item.file), JSON.stringify(item.data, null, 2));
}

console.log({
  script: "generate-replay-inputs-v0.2",
  inputs_created: inputs.length,
});

console.table(
  inputs.map((x) => ({
    file: x.file,
    case_id: x.data.case_id,
    records: x.data.records.length,
  }))
);
