import { webhookDB } from "../config/db.config.js";
import jwt from "jsonwebtoken";
import { formatSyncTime } from "../utils/device-helper.js";

export default {
  getLatestMetricsByUser: async (req, res) => {
    try {
      if (
        req.headers.authorization?.split(" ")[0] !== "Bearer" ||
        !req.headers.authorization?.split(" ")[1]
      ) {
        return res.status(401).json({
          status: "error",
          message: "token is required",
          code: "FIELD_REQUIRED",
          details: {
            Authorization: "Bearer <token>",
          },
        });
      }
      const token = req.headers.authorization?.split(" ")[1];
      const { id: userId } = jwt.verify(token, process.env.JWT_SECRET);

      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized",
          code: "UNAUTHORIZED",
          details: {
            Authorization: "Bearer <token>",
          },
        });
      }
      const latestMetrics = await webhookDB
        .collection("observations")
        .aggregate([
          { $match: { user_id: userId } },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: "$metric_type",
              latestRecord: { $first: "$$ROOT" },
            },
          },
          {
            $replaceRoot: { newRoot: "$latestRecord" },
          },
        ])
        .toArray();

      return res.status(200).json({
        status: "success",
        message: "Latest metrics fetched successfully",
        data: latestMetrics,
      });
    } catch (error) {
      console.error("Error fetching latest metrics:", error);
      return res.status(error.status || 500).json({
        status: "error",
        message: error.message || "Internal Server Error",
        code: error.code || error.name || "INTERNAL_SERVER_ERROR",
        details: error.details || error,
      });
    }
  },

  getFormattedMetricHistory: async (req, res) => {
    try {
      const { userId, metricType } = req.params;
      if(!req.headers.authorization?.split(" ")[0] === "Bearer" || !req.headers.authorization?.split(" ")[1]){
        
      }
      const records = await webhookDB
        .collection("observations")
        .find({
          user_id: userId,
          metric_type: Number(metricType),
        })
        .sort({ createdAt: -1 })
        .toArray();

      const formatted = records.map((item) => {
        return {
          metric_type: item.metric_type,
          metric_value: item.metric_value,
          metric_unit: item.metric_unit,
          data_source: `Synced from ${item.metric_source}`,
          sync_time: formatSyncTime(item.createdAt),
        };
      });

      return res.status(200).json({
        success: true,
        count: formatted.length,
        data: formatted,
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
};
