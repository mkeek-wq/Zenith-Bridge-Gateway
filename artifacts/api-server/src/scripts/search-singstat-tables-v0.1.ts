const terms = [
  "precision engineering",
  "machinery equipment",
  "machinery",
  "equipment",
  "capital expenditure",
  "fixed assets",
  "automation",
  "manufacturing by industry",
];

async function searchTerm(term: string) {
  const url =
    `https://tablebuilder.singstat.gov.sg/api/table/tabledata?search=${encodeURIComponent(term)}`;

  const response = await fetch(url);

  if (!response.ok) {
    console.log(`Search failed for "${term}": ${response.status}`);
    return;
  }

  const json = await response.json();

  console.log("\n==================================================");
  console.log(`SEARCH: ${term}`);
  console.log("==================================================");
  console.log(JSON.stringify(json).slice(0, 3000));
}

async function main() {
  for (const term of terms) {
    await searchTerm(term);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
