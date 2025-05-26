"use client";
import {
  Anchor,
  Card,
  Divider,
  Flex,
  Group,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import {
  IconChevronRight,
  IconPhoto,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";

function DashRootPage() {
  return (
    <div>
      <Flex direction="column" gap="md">
        <div>
          <Title order={1}>Bulk process images</Title>
          <Text c="dimmed">
            Upload a list of images to add the date at the bottom right corner
          </Text>
        </div>
        <div>
          <Dropzone
            onDrop={(files) => console.log("accepted files", files)}
            onReject={(files) => console.log("rejected files", files)}
            maxSize={5 * 1024 ** 2}
            accept={IMAGE_MIME_TYPE}
            bg="gray.1"
            className="cursor-pointer"
          >
            <Group
              justify="center"
              gap="xl"
              mih={220}
              style={{ pointerEvents: "none" }}
            >
              <Dropzone.Accept>
                <IconUpload
                  size={52}
                  color="var(--mantine-color-blue-6)"
                  stroke={1.5}
                />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX
                  size={52}
                  color="var(--mantine-color-red-6)"
                  stroke={1.5}
                />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconPhoto
                  size={52}
                  color="var(--mantine-color-dimmed)"
                  stroke={1.5}
                />
              </Dropzone.Idle>

              <div>
                <Text size="xl" inline>
                  Drag images here or click to select files
                </Text>
                <Text size="sm" c="dimmed" inline mt={7}>
                  Attach as many files as you like, each file should not exceed
                  5mb
                </Text>
              </div>
            </Group>
          </Dropzone>
        </div>
      </Flex>
      <Divider my="md" mx="-md" />
      <Card withBorder>
        {false && (
          <>
            <Card.Section my="md">
              <Divider />
            </Card.Section>
            <Text c="dimmed">No files uploaded yet</Text>
          </>
        )}
        <Card.Section>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Created at</Table.Th>
                <Table.Th>Images uploaded</Table.Th>
                <Table.Th>Finished processing</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>2025-05-25 10:00:00</Table.Td>
                <Table.Td>10</Table.Td>
                <Table.Td>Processing...</Table.Td>
                <Table.Td>
                  <Anchor component={Link} href="/dash/results/123" size="sm" c="blue">
                    <Group gap={4} align="center">
                      Results
                      <IconChevronRight size={14} />
                    </Group>
                  </Anchor>
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Card.Section>
      </Card>
    </div>
  );
}

export default DashRootPage;
