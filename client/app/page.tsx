"use client";
import { backends } from "@/backends.config";
import { Card, Center, Divider, Text } from "@mantine/core";
import { useRouter } from "next/navigation";
import ServerStatus from "./components/ServerStatus";
import { useAuth } from "./contexts/AuthContext";
import { Backend, useBackend } from "./contexts/BackendContext";

export default function Home() {
  const { user } = useAuth();
  const { setSelectedBackend } = useBackend();
  const router = useRouter();

  if (user) {
    router.push("/dash");
  }

  return (
    <Center mih="100dvh">
      <Card withBorder className="w-full max-w-[500px]">
        {backends.map((backend) => (
          <div
            key={backend.name}
            onClick={() => {
              if (backend.baseUrl) {
                setSelectedBackend(backend as Backend);
                router.push("/login");
              }
            }}
            className={backend.baseUrl ? "cursor-pointer" : "cursor-not-allowed"}
          >
            <Text>{backend.name}</Text>
            <ServerStatus baseUrl={backend.baseUrl} />
            <Card.Section my="md">
              <Divider />
            </Card.Section>
          </div>
        ))}
        <Text>Choose a backend for the same experience</Text>
      </Card>
    </Center>
  );
}
