"use client";

import {
  Badge,
  Button,
  Card,
  Divider,
  Drawer,
  Flex,
  Group,
  SimpleGrid,
  Text,
  Loader,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { WebhookForm } from "../../components/WebhookForm";
import { notifications } from "@mantine/notifications";
import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { useBackend } from "@/app/contexts/BackendContext";
import { fetcherWithAuth } from "@/utils/fetchers";
import useSWR from "swr";

interface Webhook {
  id: number;
  label: string;
  url: string;
  method: string;
  requestConfig?: Record<string, unknown>;
  createdAt: string;
  ownerId: number;
  _count: {
    webhookEvents: number;
  };
}

function WebhooksPage() {
  const [opened, { open, close }] = useDisclosure(false);
  const { token } = useAuth();
  const { selectedBackend } = useBackend();

  const {
    data: webhooks,
    error,
    isLoading,
    mutate,
  } = useSWR<Webhook[]>(
    selectedBackend ? `${selectedBackend.baseUrl}/api/webhook` : null,
    (url: string) => fetcherWithAuth(url, token as string)
  );

  const handleWebhookCreated = (webhook: Webhook) => {
    notifications.show({
      title: "Success",
      message: `Webhook created for ${webhook.url}`,
      color: "green",
    });
    close();
    mutate(); // Refresh webhooks list
  };

  return (
    <div>
      <Flex direction="column" gap="md">
        <div>
          <Text fw={500}>Webhooks</Text>
          <Text c="dimmed">
            You can use webhooks to send requests to your backend when a process
            is completed.
          </Text>
        </div>
        <div>
          <Button color="black" onClick={open}>
            Add Webhook
          </Button>
        </div>
      </Flex>
      <Divider mx="-md" my="md" />

      {isLoading && (
        <Group align="center" gap="sm">
          <Loader size="sm" />
          <Text>Loading webhooks...</Text>
        </Group>
      )}

      {error && (
        <Text c="red">Error loading webhooks. Please try again later.</Text>
      )}

      {!isLoading && !error && webhooks && webhooks.length === 0 && (
        <Text c="dimmed">No webhooks found. Create your first webhook!</Text>
      )}

      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
        {webhooks?.map((webhook) => (
          <Card key={webhook.id} withBorder>
            <Text fw={500}>{webhook.label}</Text>
            <Group c="dimmed" gap="xs" wrap="nowrap">
              <Badge color="gray" radius="xs" variant="light">
                {webhook.method}
              </Badge>
              <Text>{webhook.url}</Text>
            </Group>
            <Text c="dimmed">
              Created at {new Date(webhook.createdAt).toLocaleString()}
            </Text>
            <Text c="dimmed">
              Webhook events: {webhook._count.webhookEvents}
            </Text>
            <Group justify="end" align="center" mt="sm">
              <Button
                component={Link}
                href={`/dash/webhooks/${webhook.id}`}
                color="black"
                variant="light"
                rightSection={<IconChevronRight size={14} />}
              >
                Details
              </Button>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      <Drawer opened={opened} onClose={close} title="Add Webhook">
        <WebhookForm
          onCreated={handleWebhookCreated}
          onCancel={close}
          action="create"
        />
      </Drawer>
    </div>
  );
}

export default WebhooksPage;
