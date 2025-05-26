"use client";
import { useDisclosure } from "@mantine/hooks";
import {
  AppShell,
  Burger,
  Group,
  Avatar,
  Button,
  Text,
  Flex,
  Anchor,
} from "@mantine/core";
import { useAuth } from "../contexts/AuthContext";
import { useBackend } from "../contexts/BackendContext";
import Link from "next/link";

export default function BasicAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [opened, { toggle }] = useDisclosure();
  const { logout } = useAuth();
  const { selectedBackend } = useBackend();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Avatar radius="xl">BC</Avatar>
            <Text fw={500}>{selectedBackend?.name}</Text>
          </Group>
          <Button
            variant="subtle"
            onClick={logout}
            visibleFrom="sm"
            color="red"
          >
            Logout
          </Button>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <Flex direction="column" gap="md">
          <Anchor
            component={Link}
            fw={500}
            href="/dash"
            underline="never"
            c="black"
          >
            Processes
          </Anchor>
          <Anchor
            component={Link}
            fw={500}
            href="/dash/webhooks"
            underline="never"
            c="black"
          >
            Webhooks
          </Anchor>
          <Button variant="light" onClick={logout} hiddenFrom="sm" color="red">
            Logout
          </Button>
        </Flex>
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
