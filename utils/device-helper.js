import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import { webhookDB } from "../config/db.config.js";
import moment from "moment";

dayjs.extend(relativeTime);

export const getDeviceLastSyncTime = async (userId, deviceName) => {
  try {
    const lastLog = await webhookDB.collection("observations").findOne(
      {
        user_id: userId,
        metric_source: deviceName,
      },
      { sort: { createdAt: -1 } }
    );
    if (!lastLog) return `Never synced`;
    const lastTime = dayjs(lastLog.createdAt);
    const now = dayjs();
    const diffInHours = now.diff(lastTime, "hour");
    const diffInDays = now.diff(lastTime, "day");
    const diffInMinutes = now.diff(lastTime, "minute");
    if (diffInMinutes < 1) {
      return "Synced just now";
    }
    if (diffInMinutes < 60) {
      return `Synced ${diffInMinutes} minutes ago`;
    }
    if (diffInHours < 24) {
      return `Synced ${diffInHours} hours ago`;
    }
    if (diffInDays < 7) {
      return `Synced ${diffInDays} days ago`;
    }
    return lastTime.format("ddd, DD/MM/YYYY");
  } catch (error) {
    console.error("Error in getDeviceLastSyncTime:", error);
    return "Sync Error";
  }
};

export const formatSyncTime = (date) => {
  const now = moment();
  const input = moment(date);

  const diffHours = now.diff(input, "hours");
  const diffDays = now.diff(input, "days");

  if (diffHours < 24) {
    return input.fromNow(); //  "2 minutes ago"
  } else if (diffDays === 1) {
    return "Yesterday"; // "Yesterday"
  } else {
    return input.format("MMM DD, YYYY"); // "Dec 02, 2025"
  }
};
