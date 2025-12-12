import { webhookDB } from "../config/db.config.js";
import jwt from "jsonwebtoken";
import { formatSync } from "../utils/device-helper.js";
import { getImageUrl } from "../utils/data-helper.js";

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
        .collection("metric_types")
        .find({})
        .toArray();

      if (!MetricsData || !MetricsData.length > 0) {
        return res.status(404).json({
          status: "error",
          message: "Latest metrics not found",
          code: "NOT_FOUND",
        });
      }
      const categories = {
        sleep_summary: "Sleep Summary",
        pysical_summary: "Physical Summary",
        body_summary: "Body Summary",
      };

      const categoryMap = {
        1: "body_summary",
        2: "pysical_summary",
        3: "sleep_summary",
      };

      let output = Object.fromEntries(
        Object.entries(categories).map(([key, name]) => [
          key,
          { metric_name: name, metric_count: 0, data: [] },
        ])
      );
      output.total_metric_count = 0;

      await Promise.all(
        latestMetrics.map(async (metric) => {
          if (metric.metric_source === "summary") return;
          const metricInfo = MetricsData.find(
            (item) => item.metric_type === metric.metric_type
          );
          const categoryKey =
            categoryMap[metricInfo.metric_category] || "unknown";
          const metricIcon = await getImageUrl(
            metricInfo.metric_code || "default"
          );
          output[categoryKey].metric_count++;
          output.total_metric_count++;
          output[categoryKey].data.push({
            metric_icon: `${process.env.BASE_URL}/images/data/${metricIcon}`,
            metric_type: metric.metric_type || 0,
            metric_code: metricInfo.metric_code || "unknown",
            metric_name: metricInfo.metric_name || "unknown",
            metric_category: categoryKey,
            metric_category_name: categories[categoryKey],
            metric_value: metric.metric_value,
            metric_unit: metric.metric_unit,
            metric_source: metric.metric_source,
            metric_source_type: metric.source_type,
            metric_time: formatSync(metric.date),
            created_at: formatSync(metric.createdAt),
          });
        })
      );
      return res.status(200).json({
        status: "success",
        message: "Latest metrics fetched successfully",
        data: output,
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
  getAllMetricsByUser: async (req, res) => {
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
          {
            $match: {
              // user_id: "692d4ae8f6a15ddb999f67dd",
              user_id: userId,
              metric_source: { $ne: "summary" },
            },
          },
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

      const allMetrics = await webhookDB
        .collection("metric_types")
        .find({})
        .toArray();

      const latestTypes = new Set(latestMetrics.map((m) => m.metric_type));

      const missingMetrics = allMetrics.filter(
        (metric) => !latestTypes.has(metric.metric_type)
      );

      const categories = {
        sleep_summary: "Sleep Summary",
        pysical_summary: "Physical Summary",
        body_summary: "Body Summary",
      };

      const categoryMap = {
        1: "body_summary",
        2: "pysical_summary",
        3: "sleep_summary",
      };

      let output = Object.fromEntries(
        Object.entries(categories).map(([key, name]) => [
          key,
          { category_name: name, metric_count: 0, data: [] },
        ])
      );
      output.total_metrics_count = 0;

      for (const metric of missingMetrics) {
        const categoryKey = categoryMap[metric.metric_category];
        if (!categoryKey) continue;
        const metricIcon = await getImageUrl(metric.metric_code || "default");
        output[categoryKey].metric_count++;
        output.total_metrics_count++;
        output[categoryKey].data.push({
          metric_icon: `${process.env.BASE_URL}/images/data/${metricIcon}`,
          metric_type: metric.metric_type,
          metric_code: metric.metric_code,
          metric_name: metric.metric_name,
          metric_category: categoryKey,
        });
      }

      return res.status(200).json({
        status: "success",
        message: "All metrics fetched successfully",
        data: output,
      });
    } catch (error) {
      console.error("Error fetching all metrics:", error);
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
        .collection("metric_types")
        .find({})
        .toArray();

      const formatted = await Promise.all(
        records.map(async (item) => {
          const { day, lastSync } = formatSync(item.date);
          const { day: day2, lastSync: lastSync2 } = formatSync(item.createdAt);
          const metricCode =
            metricData.find((i) => i.metric_type === item.metric_type)
              ?.metricCode || "defalut";
          const metricIcon = await getImageUrl(metricCode);
          return {
            metric_icon: `${process.env.BASE_URL}/images/data/${metricIcon}`,
            metric_type: item.metric_type,
            metric_code:
              metricData.find((i) => i.metric_type === item.metric_type)
                ?.metric_code || "",
            metric_name:
              metricData.find((i) => i.metric_type === item.metric_type)
                ?.metric_name || "",
            metric_category:
              metricData.find((i) => i.metric_type === item.metric_type)
                ?.metric_category || "",
            metric_value: item.metric_value,
            metric_unit: item.metric_unit,
            metric_source: item.metric_source,
            metric_sorce_type: item.source_type,
            day: day,
            last_sync: lastSync,
            last_created: item.createdAt,
          };
        })
      );

      return res.status(200).json({
        status: "success",
        message: "Data fetched successfully",
        count: formatted.length,
        data: formatted,
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(error.status || 500).json({
        status: "error",
        message: error.message || "Internal Server Error",
        code: error.code || error.name || "INTERNAL_SERVER_ERROR",
        details: error.details || error,
      });
    }
  },
};
