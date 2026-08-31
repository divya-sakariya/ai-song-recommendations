import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

// Reused across hot-reloads in dev and across serverless invocations so we
// don't open a new connection per request.
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

export function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local and set it.");
  }

  if (!global._mongooseConn) {
    global._mongooseConn = mongoose.connect(MONGODB_URI);
  }

  return global._mongooseConn;
}
