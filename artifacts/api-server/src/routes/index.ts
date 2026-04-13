import { Router, type IRouter } from "express";
import healthRouter from "./health";
import articlesRouter from "./articles";
import adminRouter from "./admin";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(articlesRouter);
router.use(adminRouter);
router.use(contactRouter);

export default router;
