import express from "express";
import {
  signin,
  signup,
  signout,
  getMe,
} from "../controllers/authController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", signout);
router.get("/me", protectRoute, getMe);

export default router;
