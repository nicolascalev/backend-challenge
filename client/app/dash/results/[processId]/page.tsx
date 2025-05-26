import SingleProcessClient from "./client";

async function SingleProcessPage({
  params,
}: {
  params: Promise<{ processId: string }>;
}) {
  const { processId } = await params;
  return <SingleProcessClient processId={processId} />;
}

export default SingleProcessPage;
