import { useChatStore } from "../store/useChatStore";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-full w-full">
      {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
    </div>
  );
};
export default HomePage;
