"use client";
import { Group, Text } from "@mantine/core";
import { useEffect, useState } from "react";

function ServerStatus({ baseUrl }: { baseUrl?: string }) {
  const [status, setStatus] = useState<
    "loading" | "available" | "not-running" | "not-configured"
  >("loading");

  useEffect(() => {
    if (!baseUrl) {
      setStatus("not-configured");
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/ping`);
        const data = await response.text();
        setStatus(data === "pong" ? "available" : "not-running");
      } catch (err) {
        console.log(err);
        setStatus("not-running");
      }
    };

    checkStatus();
  }, [baseUrl]);

  return (
    <Group gap="xs" align="center">
      <div
        className={`w-2 h-2 rounded-full ${
          status === "available"
            ? "bg-teal-500"
            : status === "loading"
            ? "bg-gray-300"
            : "bg-red-500"
        }`}
      />
      <Text c="dimmed">
        {status === "loading" && "Checking..."}
        {status === "available" && "Available"}
        {status === "not-running" && "Not running"}
        {status === "not-configured" && "Not configured"}
      </Text>
    </Group>
  );
}

export default ServerStatus;
