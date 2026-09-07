import app from "../backend/app";
import serverless from "serverless-http";

const handler = serverless(app);

export default function apiHandler(req: any, res: any) {
  return handler(req as any, res as any);
}