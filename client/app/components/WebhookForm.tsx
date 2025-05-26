import { Button, Select, TextInput, Textarea } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useAuth } from "@/app/contexts/AuthContext";
import { useBackend } from "@/app/contexts/BackendContext";
import { z } from "zod";
import axios from "axios";
import { tryCatch } from "@/utils/try-catch";

const webhookSchema = z.object({
  label: z.string().min(1, "Label is required"),
  url: z.string().url("Invalid URL"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  requestConfig: z
    .string()
    .optional()
    .refine(
      (val: string | undefined) => {
        if (!val) return true;
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Invalid JSON" }
    ),
});

type WebhookFormValues = z.infer<typeof webhookSchema>;

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

interface WebhookFormProps {
  onCreated: (webhook: Webhook) => void;
  onCancel: () => void;
}

export function WebhookForm({ onCreated, onCancel }: WebhookFormProps) {
  const { token } = useAuth();
  const { selectedBackend } = useBackend();

  const form = useForm<WebhookFormValues>({
    initialValues: {
      label: "",
      url: "",
      method: "POST",
      requestConfig: "",
    },
    validate: zodResolver(webhookSchema),
  });

  const handleSubmit = async (values: WebhookFormValues) => {
    if (!selectedBackend || !token) {
      notifications.show({
        title: "Error",
        message: "Please select a backend server first",
        color: "red",
      });
      return;
    }

    const result = await tryCatch(
      axios.post<Webhook>(
        `${selectedBackend.baseUrl}/api/webhook`,
        {
          ...values,
          requestConfig: values.requestConfig ? JSON.parse(values.requestConfig) : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
    );

    if (result.error) {
      console.error(result.error);
      notifications.show({
        title: "Error",
        message: result.error instanceof Error ? result.error.message : "Failed to create webhook",
        color: "red",
      });
      return;
    }

    onCreated(result.data.data);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        label="Label"
        placeholder="My Webhook"
        required
        {...form.getInputProps("label")}
      />
      <TextInput
        label="URL"
        placeholder="https://your-webhook-url.com"
        required
        mt="md"
        {...form.getInputProps("url")}
      />
      <Select
        label="Method"
        placeholder="Select method"
        data={["GET", "POST", "PUT", "PATCH", "DELETE"]}
        required
        mt="md"
        {...form.getInputProps("method")}
      />
      <Textarea
        label="Request Config (JSON)"
        placeholder='{"headers": {"Authorization": "Bearer token"}}'
        mt="md"
        {...form.getInputProps("requestConfig")}
      />
      <Button type="submit" fullWidth mt="xl">
        Create Webhook
      </Button>
      <Button variant="subtle" fullWidth mt="sm" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  );
} 