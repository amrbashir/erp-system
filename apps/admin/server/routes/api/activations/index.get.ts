import { defineEventHandler } from "nitro/h3";

import { listActivations } from "../../../lib/activations.js";
import { useDB } from "../../../utils/db.js";

export default defineEventHandler(async () => {
	const db = useDB();
	return listActivations(db);
});
