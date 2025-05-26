import SingleWebhookPageClient from "./client";

async function SingleWebhookPage({ params }: { params: { webhookId: string } }) {
  const { webhookId } = await params;
  return <SingleWebhookPageClient webhookId={webhookId} />;
}

export default SingleWebhookPage;
