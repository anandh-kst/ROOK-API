import axios from "axios";
import { devicesData } from "../constants/devicesData.js";
import { rookAuthHeader } from "../utils/auth-helper.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export default {
  getDevices: async (req, res) => {
    try {
      const redirect_url = req.query.redirect_url || "https://kstinfotech.com";
      const token = req.headers.authorization?.split(" ")[1];
      if (req.headers.authorization?.split(" ")[0] !== "Bearer" || !token)
        return res.status(401).json({
          status: "error",
          message: "token is required",
          code: "FIELD_REQUIRED",
          details: {
            Authorization: "Bearer <token>",
          },
        });
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      if (!id) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized",
          code: "UNAUTHORIZED",
          details: {
            Authorization: "Bearer <token>",
          },
        });
      }
      const promises = devicesData.map(async (device) => {
        const url = `https://api.rook-connect.review/api/v1/user_id/${id}/data_source/${device.deviceName}/authorizer?redirect_url=${redirect_url}`;
        try {
          const response = await axios.get(url, { headers: rookAuthHeader() });
          if (!response.data.authorized) {
            return {
              device_name: device.deviceName,
              device_image: device.imageUrl,
              device_description: device.description,
              authorization_url: response.data.authorization_url,
            };
          }
        } catch (error) {
          console.log(
            `Error for ${device.deviceName}`,
            error.response?.data || error
          );
        }
        return null;
      });
      const results = (await Promise.all(promises)).filter(Boolean);
      return res.status(200).json({
        status: "success",
        message: "Devices fetched successfully",
        data: results,
      });
    } catch (error) {
      console.log("Error in getDevices:", error?.response?.data || error);
      return res.status(error.status || 500).json({
        status: "error",
        message: error.message || "Something went wrong",
        code: error.code || error.name || "SERVER_ERROR",
        details: error.details || error,
      });
    }
  },
  getConnectedDevices: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (req.headers.authorization?.split(" ")[0] !== "Bearer" || !token)
        return res.status(401).json({
          status: "error",
          message: "token is required",
          code: "FIELD_REQUIRED",
          details: {
            Authorization: "Bearer <token>",
          },
        });
      console.log(token);
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      console.log(id);
      if (!id) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized",
          code: "UNAUTHORIZED",
          details: {
            Authorization: "Bearer <token>",
          },
        });
      }
      const url = `https://api.rook-connect.review/api/v2/user_id/${id}/data_sources/authorized`;
      const response = await axios.get(url, { headers: rookAuthHeader() });
      const rookDevices = response?.data?.data_sources || [];
      const finalResult = rookDevices
        .filter((d) => d.authorized)
        .map((d) => {
          const match = devicesData.find(
            (x) => x.deviceName.toLowerCase() === d.data_source.toLowerCase()
          );
          if (!match) return null;
          return {
            device_name: match.deviceName,
            device_image: match.imageUrl,
            device_description: match.description,
            disconnect_api: `http://localhost:5000/api/devices/disconnect?user_id=${id}&device_name=${match.deviceName}`,
          };
        })
        .filter(Boolean);

      return res.status(200).json({
        status: "success",
        message: "Devices fetched successfully",
        data: finalResult,
      });
    } catch (error) {
      console.log(
        "Error in getConnectedDevices:",
        error?.response?.data || error
      );
      return res.status(error.status || 500).json({
        status: "error",
        message: error.message || "Internal Server Error",
        code: error.code || error.name || "SERVER_ERROR",
        details: error.details || error,
      });
    }
  },
  disconnectDevice: async (req, res) => {
    try {
      const { device_name } = req.query;
      const token = req.headers.authorization?.split(" ")[1];
      if (!device_name)
        return res.status(400).json({
          status: "error",
          message: "user_id and device_name are required",
          code: "FIELD_REQUIRED",
          details: {
            user_id: "<user_id>",
            device_name: "<device_name>",
          },
        });
      if (req.headers.authorization?.split(" ")[0] !== "Bearer" || !token)
        return res.status(401).json({
          status: "error",
          message: "token is required",
          code: "FIELD_REQUIRED",
          details: {
            Authorization: "Bearer <token>",
          },
        });
      console.log(token);
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      console.log(id);

      if (!id) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized",
          code: "UNAUTHORIZED",
          details: {
            Authorization: "Bearer <token>",
          },
        });
      }
      const url = `https://api.rook-connect.review/api/v1/user_id/${id}/data_sources/revoke_auth`;
      const response = await axios.post(
        url,
        { data_source: device_name },
        { headers: rookAuthHeader() }
      );

      if (response.status === 204)
        return res.status(200).json({
          status: "error",
          message: "No such device connected",
          code: "NO_CONTENT",
          details: null,
        });

      return res.status(200).json({
        status: "success",
        message: "Device disconnected successfully",
      });
    } catch (error) {
      console.log("Error in disconnectDevice:", error);
      return res.status(error?.response?.status || error.status || 500).json({
        status: "error",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong",
        code: error?.code || error?.name || "SERVER_ERROR",
        details: error?.response?.data || null,
      });
    }
  },
};
