import express from "express";
import dataController from "../controllers/data.controller.js";

const dataRouter = express.Router();

dataRouter.get(
  "/getLatestMetricsByUser",
  dataController.getLatestMetricsByUser
);

dataRouter.get(
  "/getFormattedMetricHistory/:metricType",
  dataController.getMetricHistory
);

export default dataRouter;
