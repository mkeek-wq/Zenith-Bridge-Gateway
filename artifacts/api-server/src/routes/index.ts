import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import articlesRouter from "./articles.js";
import adminRouter from "./admin.js";
import contactRouter from "./contact.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/articles", articlesRouter);
router.use(adminRouter);
router.use(contactRouter);

export default router;
