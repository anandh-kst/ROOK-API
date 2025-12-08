import express from "express";
import  deviceController  from "../controllers/device.controller.js";

const deviceRouter = express.Router();

deviceRouter.get("/connect",deviceController.getDevices);
deviceRouter.get("/connected",deviceController.getConnectedDevices);
deviceRouter.get("/disconnect",deviceController.disconnectDevice);

export default deviceRouter;
