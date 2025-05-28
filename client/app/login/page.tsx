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

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { selectedBackend } = useBackend();

  const form = useForm<LoginForm>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        value.length < 8 ? "Password must be at least 8 characters" : null,
    },
  });

  const handleSubmit = async (values: LoginForm) => {
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
      const response = await fetch(
        `${selectedBackend.baseUrl}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();
      login(data.token, data.user);
      router.push("/dash");
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Invalid credentials",
        color: "red",
      });
    }
  };

  return (
    <Center mih="100dvh">
      <Card withBorder className="w-full max-w-[400px]">
        <Text size="xl" fw={700} mb="md">
          Login
        </Text>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Email"
            placeholder="your@email.com"
            required
            {...form.getInputProps("email")}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            {...form.getInputProps("password")}
          />
          <Button type="submit" fullWidth mt="xl" color="teal">
            Login
          </Button>
        </form>
        <Divider my="md" />
        <Group justify="center">
          <Text size="sm" c="dimmed">
            Don&apos;t have an account?{" "}
            <Button
              variant="subtle"
              size="sm"
              onClick={() => router.push("/register")}
              color="teal"
            >
              Register
            </Button>
          </Text>
        </Group>
      </Card>
    </Center>
  );
}
