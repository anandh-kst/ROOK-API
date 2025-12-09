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

export const formatSync = (date) => {
  const now = moment();
  const t = moment(date);

  const isToday = t.isSame(now, "day");
  const isYesterday = t.isSame(now.clone().subtract(1, "day"), "day");

  let day;
  if (isToday) day = "today";
  else if (isYesterday) day = "yesterday";
  else if (now.diff(t, "days") < 7) day = t.format("ddd");  // Mon, Tue...
  else day = t.format("DD MMM YYYY");

  return {
    day,                     // today / yesterday / Mon / 08 Dec 2025
    lastSync: t.fromNow(),   // ALWAYS relative time
  };
};


