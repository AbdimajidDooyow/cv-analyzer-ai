import app from "../backend/app";

export default function apiHandler(req: any, res: any) {
  return app(req as any, res as any);
}