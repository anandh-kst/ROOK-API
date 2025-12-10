import { webhookDB } from "../config/db.config.js";
import jwt from "jsonwebtoken";
import { formatSync } from "../utils/device-helper.js";

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
          // { $match: { user_id: "692d4ae8f6a15ddb999f67dd" } },
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
      const MetricsData = await webhookDB
        .collection("metricTypes")
        .find({})
        .toArray();
      const formatedOutput = latestMetrics.map((metric) => {
        return {
          metricType: metric.metric_type,
          metricCode:
            MetricsData.find((item) => item.metricType === metric.metric_type)
              ?.metricCode || "",
          metricName:
            MetricsData.find((item) => item.metricType === metric.metric_type)
              ?.metricName || "",
          metricValue: metric.metric_value,
          metricUnit: metric.metric_unit,
          metricSource: metric.metric_source,
          metricSorceType: metric.source_type,
          metricTime: formatSync(metric.date),
          createdAt: formatSync(metric.createdAt),
        };
      });

      return res.status(200).json({
        status: "success",
        message: "Latest metrics fetched successfully",
        data: formatedOutput,
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

  getMetricHistory: async (req, res) => {
    try {
      const { metricType } = req.params;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          status: "error",
          message: "Token is required",
          code: "FIELD_REQUIRED",
        });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded?.id) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        });
      }

      const userId = decoded.id;

      const records = await webhookDB
        .collection("observations")
        .aggregate([
          {
            $match: {
              // user_id: "6932dbc153d838896d987f44",
              user_id: userId,
              metric_type: Number(metricType),
            },
          },
          {
            $addFields: {
              dayKey: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                },
              },
            },
          },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: {
                dayKey: "$dayKey",
                device: "$metric_source",
              },
              latestRecord: { $first: "$$ROOT" },
            },
          },
          {
            $replaceRoot: {
              newRoot: "$latestRecord",
            },
          },
          { $sort: { createdAt: -1 } },
        ])
        .toArray();

      const metricData = await webhookDB
        .collection("metricTypes")
        .find({})
        .toArray();

      const formatted = records.map((item) => {
        const { day, lastSync } = formatSync(item.createdAt);
        return {
          metricType: item.metric_type,
          metricCode:
            metricData.find((i) => i.metricType === item.metric_type)
              ?.metricCode || "",
          metricName:
            metricData.find((i) => i.metricType === item.metric_type)
              ?.metricName || "",
          metricValue: item.metric_value,
          metricUnit: item.metric_unit,
          metricSource: item.metric_source,
          metricSorceType: item.source_type,
          day: day,
          lastSync: lastSync,
        };
      });

      return res.status(200).json({
        status: "success",
        message: "Data fetched successfully",
        count: formatted.length,
        data: formatted,
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  },
};
