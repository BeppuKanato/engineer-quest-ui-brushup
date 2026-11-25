import { MissionChallengePage } from "@/design/MissionChallengeDraft";

export default async function Page({ params }: { params: Promise<{ missionId: string }> }) {
  const { missionId } = await params;
  return <MissionChallengePage missionId={missionId} />;
}
