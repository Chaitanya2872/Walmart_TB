import express from "express";
import mqtt from "mqtt";
import axios from "axios";

/* -------------------- HTTP KEEP-ALIVE SERVER -------------------- */
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("MQTT → ThingsBoard worker is running");
});

app.listen(PORT, () => {
  console.log(`🌐 Health server running on port ${PORT}`);
});

/* -------------------- MQTT CONFIG -------------------- */
const TB_URL =
  "https://demo.thingsboard.io/api/v1/WPyLQlqsqT8KDX0XnnZs/telemetry";

const client = mqtt.connect({
  host: "6fdddaf19d614da29c86428142cbe7a2.s1.eu.hivemq.cloud",
  port: 8883,
  protocol: "mqtts",
  username: "ruthvik",
  password: "Iotiq369."
});

console.log("🚀 MQTT → ThingsBoard service starting");

/* -------------------- MQTT EVENTS -------------------- */
client.on("connect", () => {
  console.log("✅ Connected to HiveMQ");
  client.subscribe([
    "intel-topic",
    "intel-twogood-topic",
    "intel-minimeals-topic"
  ]);
});

client.on("message", async (topic, payload) => {
  try {
    const data = JSON.parse(payload.toString());
    let telemetry = {};

    // -------- INTEL MAIN COUNTER --------
    if (topic === "intel-topic") {
      telemetry = {
        intel_occupancy: data.occupancy,
        intel_avg_dwell: data.avg_dwell,
        intel_max_dwell: data.max_dwell,
        intel_incount: data.incount,
        intel_estimated_wait: data.estimate_wait_time,
        intel_waiting_status: data.waiting_time_min
      };
    }

    // -------- TWO GOOD COUNTER --------
    if (topic === "intel-twogood-topic") {
      telemetry = {
        twogood_occupancy: data.two_good_occupancy,
        twogood_avg_dwell: data.two_good_avg_dwell,
        twogood_max_dwell: data.two_good_max_dwell,
        twogood_incount: data.two_good_incount,
        twogood_waiting_time: data.two_good_manual_time
      };
    }

    // -------- MINI MEALS COUNTER --------
    if (topic === "intel-minimeals-topic") {
      telemetry = {
        minimeals_occupancy: data.mini_meals_occupancy,
        minimeals_avg_dwell: data.mini_meals_avg_dwell,
        minimeals_max_dwell: data.mini_meals_max_dwell,
        minimeals_incount: data.mini_meals_incount,
        minimeals_waiting_time: data.waiting_time_min
      };
    }

    if (Object.keys(telemetry).length > 0) {
      await axios.post(TB_URL, telemetry, {
        headers: { "Content-Type": "application/json" }
      });

      console.log("📤 Sent flattened telemetry:", telemetry);
    }
  } catch (err) {
    console.error("❌ Error processing message:", err.message);
  }
});

/* -------------------- ERROR HANDLING -------------------- */
client.on("error", (err) => {
  console.error("❌ MQTT Error:", err.message);
});
