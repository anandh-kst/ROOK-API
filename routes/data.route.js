import express from "express";
import dataController from "../controllers/data.controller.js";

const dataRouter = express.Router();

dataRouter.get("/getLatestMetricsByUser", dataController.getLatestMetricsByUser);

export default dataRouter;