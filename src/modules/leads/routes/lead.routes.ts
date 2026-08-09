import { Router } from "express";
import { create } from "../controllers/lead.controller";

// Sem authMiddleware de propósito — é o endpoint público que a landing page
// (pedmesa-site) usa pra captar interessados, antes de qualquer login existir.
const leadRoutes = Router();

leadRoutes.post("/", create);

export default leadRoutes;
