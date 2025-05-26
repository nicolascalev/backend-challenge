"use client";
import { backends } from "@/backends.config";
import { Card, Center, Divider, Text } from "@mantine/core";
import Link from "next/link";

export default function Home() {
  return (
    <Center mih="100dvh">
      <Card withBorder className="w-full max-w-[500px]">
        {backends.map((backend) => (
          <Link href="/dash" key={backend.name}>
            <Text>{backend.name}</Text>
            <Text c="dimmed">
              {/* TODO: Ping the url with an http request and add a status like "Not running" */}
              {backend.baseUrl ? "Available" : "Not configured"}
            </Text>
            <Card.Section my="md">
              <Divider />
            </Card.Section>
          </Link>
        ))}
        <Text>Choose a backend for the same experience</Text>
      </Card>
    </Center>
  );
}
