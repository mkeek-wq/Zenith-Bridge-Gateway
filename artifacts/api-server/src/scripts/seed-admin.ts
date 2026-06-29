import bcrypt from "bcryptjs";
import { eq } from "@workspace/db";
import { getDb, adminUsersTable } from "@workspace/db";

async function seed() {
  const { db } = getDb();

  const existing = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.username, "admin"));

  if (existing.length > 0) {
    console.log("Admin already exists");
    return;
  }

  const passwordHash = await bcrypt.hash("admin", 10);

  await db.insert(adminUsersTable).values({
    username: "admin",
    passwordHash,
  });

  console.log("✔ Admin created");
}

seed().catch(console.error);
