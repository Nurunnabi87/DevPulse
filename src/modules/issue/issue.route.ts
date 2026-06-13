import { Router } from "express";
import auth from "../../middleware/auth";
import { IssueController } from "./issue.controller";

const router = Router();

// Public reads
router.get("/", IssueController.getAllIssues);
router.get("/:id", IssueController.getSingleIssue);

// Any authenticated user (contributor or maintainer) can create issues
router.post("/", auth(), IssueController.createIssue);

export const IssueRoutes = router;
