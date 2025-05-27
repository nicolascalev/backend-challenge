"use client";
import {
  Button,
  Card,
  Divider,
  Flex,
  Group,
  Loader,
  Table,
  Text,
} from "@mantine/core";
import { Dropzone, FileRejection, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import {
  IconChevronRight,
  IconPhoto,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { useBackend } from "../contexts/BackendContext";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { tryCatch } from "@/utils/try-catch";
import { showNotification } from "@mantine/notifications";
import { fetcherWithAuth } from "@/utils/fetchers";
import useSWR from "swr";

interface ProcessResult {
  id: string;
  status: string;
  outputUrl: string;
  createdAt: string;
  imageAmount: number;
}

function DashRootPage() {
  const { selectedBackend } = useBackend();
  const { token } = useAuth();
  const [acceptedFiles, setAcceptedFiles] = useState<File[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<FileRejection[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processHistory = useSWR(
    selectedBackend ? `${selectedBackend.baseUrl}/api/process` : null,
    (url) => fetcherWithAuth(url, token as string)
  );

  async function processBatch() {
    if (!selectedBackend || !token) return;

    setIsProcessing(true);
    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append("images", file);
    });

    const result = await tryCatch(
      axios.post(`${selectedBackend.baseUrl}/api/batch`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
    );

    if (result.error) {
      console.error("Error processing batch:", result.error);
      setIsProcessing(false);
      showNotification({
        title: "Error",
        message: "Error processing batch",
        color: "red",
      });
      return;
    }

    console.log(result.data);
    showNotification({
      title: "Processing batch",
      message: "Processing batch of images",
      color: "blue",
    });

    processHistory.mutate();

    // Clear the accepted files after successful processing
    setAcceptedFiles([]);
    setIsProcessing(false);
  }

  return (
    <div>
      <Flex direction="column" gap="md">
        <div>
          <Text fw={500}>Bulk process images</Text>
          <Text c="dimmed">
            Upload a list of images to add the date at the bottom right corner
          </Text>
        </div>
        <div>
          <Dropzone
            onDrop={(files) => setAcceptedFiles(files)}
            onReject={(files) => setRejectedFiles(files)}
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
                <Text inline>Drag images here or click to select files</Text>
                <Text size="sm" c="dimmed" inline mt={7}>
                  Attach as many files as you like, each file should not exceed
                  5mb
                </Text>
              </div>
            </Group>
          </Dropzone>
        </div>
        {acceptedFiles.length > 0 && (
          <div>
            <Text inline>Accepted files: {acceptedFiles.length}</Text>
            <Button
              color="black"
              mt="sm"
              onClick={() => processBatch()}
              loading={isProcessing}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Process batch"}
            </Button>
          </div>
        )}
        {rejectedFiles.length > 0 && (
          <div>
            <Text inline>Rejected files: {rejectedFiles.length}</Text>
          </div>
        )}
      </Flex>
      <Divider my="md" mx="-md" />
      <Card>
        {processHistory.error && (
          <Group justify="center" align="center" gap="sm">
            <Text c="red">Error loading process history</Text>
          </Group>
        )}
        {processHistory.isLoading && (
          <Group justify="center" align="center" gap="sm">
            <Loader size="sm" />
            <Text>Loading...</Text>
          </Group>
        )}
        {!processHistory.isLoading && processHistory.data?.length === 0 && (
          <Text c="dimmed">No files uploaded yet</Text>
        )}
        {!processHistory.isLoading && processHistory.data?.length > 0 && (
          <Card.Section>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Created at</Table.Th>
                  <Table.Th>Images uploaded</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {processHistory.data?.map((result: ProcessResult) => (
                  <Table.Tr key={result.id}>
                    <Table.Td>
                      {new Date(result.createdAt).toLocaleString()}
                    </Table.Td>
                    <Table.Td>{result.imageAmount}</Table.Td>
                    <Table.Td>{result.status}</Table.Td>
                    <Table.Td>
                      <Button
                        component={Link}
                        href={`/dash/results/${result.id}`}
                        size="xs"
                        color="black"
                        variant="subtle"
                        rightSection={<IconChevronRight size={14} />}
                      >
                        Results
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card.Section>
        )}
      </Card>
    </div>
  );
}

export default DashRootPage;
