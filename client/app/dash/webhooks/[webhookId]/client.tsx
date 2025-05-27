"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { useBackend } from "@/app/contexts/BackendContext";
import { fetcherWithAuth } from "@/utils/fetchers";
import { tryCatch } from "@/utils/try-catch";
import {
  Accordion,
  ActionIcon,
  Badge,
  Button,
  Card,
  Drawer,
  Group,
  Loader,
  Menu,
  SimpleGrid,
  Text,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconChevronRight, IconEdit, IconTrash } from "@tabler/icons-react";
import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { WebhookForm } from "@/app/components/WebhookForm";

interface WebhookEvent {
  id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any;
  responseStatus: string;
  response: string;
  createdAt: string;
  webhookId: number;
  processId: string;
}

function SingleWebhookPageClient({ webhookId }: { webhookId: string }) {
  const router = useRouter();
  const { token } = useAuth();
  const { selectedBackend } = useBackend();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const {
    data: webhook,
    error,
    isLoading,
    mutate,
  } = useSWR(
    selectedBackend
      ? `${selectedBackend.baseUrl}/api/webhook/${webhookId}/events`
      : null,
    (url) => fetcherWithAuth(url, token as string)
  );

  if (isLoading) {
    return (
      <Group align="center" gap="sm">
        <Loader size="sm" />
        <Text>Loading webhook...</Text>
      </Group>
    );
  }

  if (error) {
    return <Text c="red">Error loading webhook</Text>;
  }

  if (!webhook) return null;

  return (
    <div>
      <Group mb="md" gap="xs">
        <Text fw={500}>{webhook.label}</Text>
        <ActionIcon 
          variant="default" 
          color="black"
          onClick={() => setIsEditDrawerOpen(true)}
        >
          <IconEdit size={14} />
        </ActionIcon>
        <Menu>
          <Menu.Target>
            <ActionIcon variant="light" color="red" loading={isDeleting}>
              <IconTrash size={14} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Delete webhook</Menu.Label>
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={async () => {
                setIsDeleting(true);
                const { error } = await tryCatch(
                  axios.delete(
                    `${selectedBackend?.baseUrl}/api/webhook/${webhookId}`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  )
                );

                if (error) {
                  showNotification({
                    title: "Error",
                    message: "Failed to delete webhook",
                    color: "red",
                  });
                } else {
                  showNotification({
                    title: "Success",
                    message: "Webhook deleted successfully",
                    color: "green",
                  });
                  router.push("/dash/webhooks");
                }
                setIsDeleting(false);
              }}
            >
              Confirm delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
        <div>
          <Text fw={500}>Created at</Text>
          <Text c="dimmed">{new Date(webhook.createdAt).toLocaleString()}</Text>
        </div>
        <div>
          <Text fw={500}>Endpoint</Text>
          <Group gap="xs">
            <Badge color="gray" variant="light" radius={"xs"}>
              {webhook.method}
            </Badge>
            <Text c="dimmed">{webhook.url}</Text>
          </Group>
        </div>
      </SimpleGrid>
      <div className="my-6">
        <Text fw={500}>Webhook request configuration</Text>
        <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto my-3 text-xs">
          {JSON.stringify(webhook.requestConfig, null, 2)}
        </pre>
      </div>
      <Card withBorder>
        {webhook?.webhookEvents?.length === 0 ? (
          <Text c="dimmed">No events found for this webhook</Text>
        ) : (
          <Card.Section>
            <Accordion>
              {webhook?.webhookEvents?.map((event: WebhookEvent) => (
                <Accordion.Item key={event.id} value={event.id.toString()}>
                  <Accordion.Control>
                    <Group gap="xs">
                      <StatusCodeBadge statusCode={event.responseStatus} />
                      <Text>{new Date(event.createdAt).toLocaleString()}</Text>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Group gap="xs">
                      <Text>Process ID: {event.processId}</Text>
                      <Button
                        component={Link}
                        href={`/dash/results/${event.processId}`}
                        variant="subtle"
                        color="black"
                        rightSection={<IconChevronRight size={14} />}
                      >
                        Process details
                      </Button>
                    </Group>
                    <Text>Status: {event.responseStatus}</Text>
                    <Text>Request:</Text>
                    <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto my-3 text-xs">
                      {JSON.stringify(event.request, null, 2)}
                    </pre>
                    <Text>Response:</Text>
                    <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto my-3 text-xs">
                      {JSON.stringify(event.response, null, 2)}
                    </pre>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </Card.Section>
        )}
      </Card>
      <Drawer
        opened={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        title="Edit Webhook"
      >
        <WebhookForm
          action="edit"
          defaultValues={{
            id: webhook.id,
            label: webhook.label,
            url: webhook.url,
            method: webhook.method,
            requestConfig: webhook.requestConfig,
          }}
          onUpdated={() => {
            showNotification({
              title: "Success",
              message: "Webhook updated successfully",
              color: "green",
            });
            mutate();
            setIsEditDrawerOpen(false);
          }}
          onCancel={() => setIsEditDrawerOpen(false)}
        />
      </Drawer>
    </div>
  );
}

export default SingleWebhookPageClient;

function StatusCodeBadge({ statusCode }: { statusCode: string }) {
  return (
    <Badge
      color={statusCode.toString().startsWith("2") ? "green" : "red"}
      variant="light"
      radius="xs"
    >
      {statusCode}
    </Badge>
  );
}
