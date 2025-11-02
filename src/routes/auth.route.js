import express from "express";
import { register,login,logout,profile,updateProfile,priceThroughAi } from "../controller/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(protect, logout);
router.route("/profile").get(protect, profile);
router.route("/updateProfile").put(protect, updateProfile);
router.route("/priceThroughAi").post(protect, priceThroughAi);
// router.route("/Calendar").get(protect, Calendar);

export default router;