import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();

router.use(authenticate);

router.get("/bank-info", paymentController.getBankInfo);

router.post(
  "/:orderId/proof",
  authorize("CUSTOMER"),
  upload.single("proof"),
  paymentController.uploadPaymentProof,
);

export default router;
