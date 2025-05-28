"use client";

import {
  Button,
  Card,
  Center,
  Divider,
  Group,
  PasswordInput,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useBackend } from "../contexts/BackendContext";
import { notifications } from "@mantine/notifications";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { selectedBackend } = useBackend();

  const form = useForm<RegisterForm>({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validate: {
      name: (value) =>
        value.length < 2 ? "Name must be at least 2 characters" : null,
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        value.length < 8 ? "Password must be at least 8 characters" : null,
      confirmPassword: (value, values) =>
        value !== values.password ? "Passwords did not match" : null,
    },
  });

  const handleSubmit = async (values: RegisterForm) => {
    if (!selectedBackend) {
      notifications.show({
        title: "Error",
        message: "Please select a backend server first",
        color: "red",
      });
      router.push("/");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("password", values.password);

      const response = await fetch(
        `${selectedBackend.baseUrl}/api/auth/register`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      login(data.token, data.user);
      router.push("/dash");
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to register",
        color: "red",
      });
    }
  };

  return (
    <Center mih="100dvh">
      <Card withBorder className="w-full max-w-[400px]">
        <Text size="xl" fw={700} mb="md">
          Register
        </Text>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Name"
            placeholder="Your name"
            required
            {...form.getInputProps("name")}
          />
          <TextInput
            label="Email"
            placeholder="your@email.com"
            required
            mt="md"
            {...form.getInputProps("email")}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            {...form.getInputProps("password")}
          />
          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
            required
            mt="md"
            {...form.getInputProps("confirmPassword")}
          />
          <Button type="submit" fullWidth mt="xl" color="teal">
            Register
          </Button>
        </form>
        <Divider my="md" />
        <Group justify="center">
          <Text size="sm" c="dimmed">
            Already have an account?{" "}
            <Button
              variant="subtle"
              size="sm"
              onClick={() => router.push("/login")}
              color="teal"
            >
              Login
            </Button>
          </Text>
        </Group>
      </Card>
    </Center>
  );
}
