#!/usr/bin/env node

/**
 * Module dependencies.
 */

import debug from "debug";
import http from "http";
import app from "../app";
import connectDB from "../config/db";
import dotenv from "dotenv";

// connect to .env
dotenv.config();

// Connect to MongoDB
connectDB().then(() => {
  /**
   * Get port from environment and store in Express.
   */

  const port: number | string | false = normalizePort(
    process.env.PORT || "4000"
  );
  app.set("port", port);

  /**
   * Create HTTP server.
   */

  const server = http.createServer(app);

  /**
   * Listen on provided port, on all network interfaces.
   */

  server.listen(port);
  server.on("error", onError);
  server.on("listening", onListening);

  /**
   * Normalize a port into a number, string, or false.
   */

  function normalizePort(val: string): number | string | false {
    const port: number = parseInt(val, 10);

    console.log("port: " + port);

    if (isNaN(port)) {
      // named pipe
      return val;
    }

    if (port >= 0) {
      // port number
      return port;
    }

    return false;
  }

  /**
   * Event listener for HTTP server "error" event.
   */

  function onError(error: NodeJS.ErrnoException): void {
    if (error.syscall !== "listen") {
      throw error;
    }

    const bind: string =
      typeof port === "string" ? "Pipe " + port : "Port " + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case "EACCES":
        console.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case "EADDRINUSE":
        console.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  /**
   * Event listener for HTTP server "listening" event.
   */

  function onListening(): void {
    const addr = server.address();

    if (addr === null) {
      console.error("Server is not listening on any address.");
      return;
    }

    const bind: string =
      typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    debug(`Listening on ${bind}`);
  }
});
