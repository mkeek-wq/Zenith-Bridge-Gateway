import { getDb, adminUsersTable } from "@workspace/db";
import { eq } from "@workspace/db";
import bcrypt from "bcryptjs";

export async function validateAdminCredentials(
  username: string,
  password: string
) {
  const { db } = getDb();

  const [user] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.username, username));

  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return user;
}
