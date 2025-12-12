import express from "express";
import dataController from "../controllers/data.controller.js";

const dataRouter = express.Router();

dataRouter.get(
  "/getLatestMetricsByUser",
  dataController.getLatestMetricsByUser
);

dataRouter.get(
  "/getMetricHistory/:metricType",
  dataController.getMetricHistory
);

dataRouter.get(
  "/getAllMetricsByUser",
  dataController.getAllMetricsByUser
);

export default dataRouter;
