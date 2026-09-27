// Local preview keeps the same API contract as the hosted Worker.
import worker from "./dist/server/index.js";
const records = new Map();
export default {
  root: "dist",
  server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
  plugins: [{ name: "local-save-preview", configureServer(server) {
    server.middlewares.use("/api/saves", async (req, res) => {
      const code = req.url.slice(1).toUpperCase();
      const send = (status, data) => { res.statusCode = status; res.setHeader("content-type", "application/json"); res.end(JSON.stringify(data)); };
      let payload = {};
      if (req.method !== "GET") {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        try { payload = JSON.parse(Buffer.concat(chunks).toString()); } catch { return send(400, { error: "잘못된 기록이다." }); }
      }
      if (req.method === "POST") {
        let issued;
        do { issued = "HE" + String(Math.floor(Math.random() * 10000)).padStart(4, "0"); } while (records.has(issued));
        records.set(issued, { ...payload.state, personalCode: issued });
        return send(200, { code: issued });
      }
      if (!/^HE\d{4}$/.test(code)) return send(400, { error: "코드 형식이 올바르지 않습니다." });
      if (req.method === "GET") return records.has(code) ? send(200, { state: records.get(code) }) : send(404, { error: "해당 코드를 찾지 못했습니다." });
      if (req.method === "PUT") { records.set(code, payload.state); return send(200, { saved: true }); }
      send(405, { error: "잘못된 요청이다." });
    });
    // Preview the actual embedded production assets so preview cannot mask a
    // stale Worker. Only the save API above uses temporary preview records.
    server.middlewares.use(async (req, res, next) => {
      try {
        const response = await worker.fetch(new Request(new URL(req.url, "http://localhost")), {});
        res.statusCode = response.status;
        response.headers.forEach((value, name) => res.setHeader(name, value));
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch (error) { next(error); }
    });
  }}],
};
