import { Router, type IRouter } from "express";
import { db, contactSubmissionsTable } from "@workspace/db";
import { SubmitContactBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const parsed = SubmitContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { name, email, company, subject, message } = parsed.data;

  await db.insert(contactSubmissionsTable).values({
    name,
    email,
    company: company ?? null,
    subject: subject ?? null,
    message,
  });

  res.json({ success: true, message: "Thank you for your message. We will be in touch shortly." });
});

export default router;
