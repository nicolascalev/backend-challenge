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
      <div className="w-full max-w-[500px] flex flex-col gap-4">
        <Text fw={500}>Backend agnostic image processing</Text>
        <Card withBorder>
          {backends.map((backend) => (
            <div
              key={backend.name}
              onClick={() => {
                if (backend.baseUrl) {
                  setSelectedBackend(backend as Backend);
                  router.push("/login");
                }
              }}
              className={
                backend.baseUrl ? "cursor-pointer" : "cursor-not-allowed"
              }
            >
              <Text>{backend.name}</Text>
              <ServerStatus baseUrl={backend.baseUrl} />
              {backends.indexOf(backend) !== backends.length - 1 && (
                <Card.Section my="md">
                  <Divider />
                </Card.Section>
              )}
            </div>
          ))}
        </Card>
      </div>
    </Center>
  );
}
