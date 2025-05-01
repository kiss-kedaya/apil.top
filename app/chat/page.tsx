import { constructMetadata } from "@/lib/utils";
import ChatRoom from "@/components/chat/chat-room";

export const metadata = constructMetadata({
  title: "聊天室",
  description: "一个临时的、点对点的、安全的聊天室",
});

export default async function Page() {
  return <ChatRoom />;
}
