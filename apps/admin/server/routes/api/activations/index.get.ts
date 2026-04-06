import { defineEventHandler } from "nitro/h3";
import { useDB } from "../../../utils/db.js";
import { listActivations } from "../../../lib/activations.js";

export default defineEventHandler(async () => {
	const db = useDB();
	return listActivations(db);
});
