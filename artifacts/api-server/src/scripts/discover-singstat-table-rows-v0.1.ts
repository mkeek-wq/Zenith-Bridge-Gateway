const tableId = "M354851";
const url = `https://tablebuilder.singstat.gov.sg/api/table/tabledata/${tableId}`;

async function main() {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`SingStat request failed: ${response.status}`);
  }

  const json = await response.json();
  const rows = json?.Data?.row ?? json?.data?.row ?? json?.row ?? [];

  console.log({
    tableId,
    row_count: rows.length,
  });

  rows.forEach((row: any, index: number) => {
    const text =
      row?.rowText ||
      row?.row_text ||
      row?.text ||
      row?.name ||
      row?.level ||
      JSON.stringify(row).slice(0, 120);

    console.log(`${String(index + 1).padStart(3, "0")} | ${text}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
