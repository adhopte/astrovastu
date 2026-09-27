import { createApp } from "./app.js";
import { config } from "./config.js";

createApp().listen(config.port, () => {
  console.log(`AstroVastu API listening on http://localhost:${config.port} (${config.env})`);
});
