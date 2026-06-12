import { Router } from "express";
import auth from "../../middleware/auth";
import { IssueController } from "./issue.controller";

const router = Router();

// Any authenticated user (contributor or maintainer) can create issues
router.post("/", auth(), IssueController.createIssue);

export const IssueRoutes = router;
