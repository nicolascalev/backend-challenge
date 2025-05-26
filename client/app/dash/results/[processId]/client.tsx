"use client";
import { useAuth } from "@/app/contexts/AuthContext";
import { useBackend } from "@/app/contexts/BackendContext";
import { fetcherWithAuth } from "@/utils/fetchers";
import React from "react";
import useSWR from "swr";
import { Group, Loader, Text, Image, SimpleGrid } from "@mantine/core";

function SingleProcessClient({ processId }: { processId: string }) {
  const { token } = useAuth();
  const { selectedBackend } = useBackend();
  const process = useSWR(
    selectedBackend
      ? `${selectedBackend.baseUrl}/api/process/${processId}`
      : null,
    (url) => fetcherWithAuth(url, token as string)
  );

  return (
    <div>
      <Text fw="500" mb="md">
        Processed images
      </Text>
      {process.isLoading && (
        <Group align="center" gap="sm">
          <Loader size="sm" />
          <Text>Loading...</Text>
        </Group>
      )}
      {process.error && <Text>Error loading process</Text>}
      {process.data && (
        <>
          <SimpleGrid cols={{ base: 2, sm: 4 }} mb="md">
            <div>
              <Text fw="500">Created At</Text>
              <Text c="dimmed">
                {new Date(process.data.createdAt).toLocaleString()}
              </Text>
            </div>
            <div>
              <Text fw="500">Finished At</Text>
              <Text c="dimmed">
                {process.data.finishedProcessingAt
                  ? new Date(process.data.finishedProcessingAt).toLocaleString()
                  : "N/A"}
              </Text>
            </div>
            <div>
              <Text fw="500">Uploaded images</Text>
              <Text c="dimmed">{process.data.imageAmount}</Text>
            </div>
            <div>
              <Text fw="500">Status</Text>
              <Text c="dimmed">{process.data.status}</Text>
            </div>
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {process.data.imageUrls.map((imageUrl: string, index: number) => (
              <Image
                key={index}
                src={`${selectedBackend?.baseUrl}${imageUrl}`}
                height={300}
                fit="contain"
                alt={`Processed image ${index + 1}`}
              />
            ))}
          </SimpleGrid>
        </>
      )}
    </div>
  );
}

export default SingleProcessClient;
