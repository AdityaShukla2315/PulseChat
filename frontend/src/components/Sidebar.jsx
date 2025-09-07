import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, MessageSquare, ChevronDown, Settings, User, LogOut } from "lucide-react";
import DevBotWidget from "./DevBotWidget";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { authUser, logout, onlineUsers, updateAuthUser } = useAuthStore();
  const navigate = useNavigate();

  // Listen for profile updates
  useEffect(() => {
    // This will make the component re-render when authUser changes
  }, [authUser]);

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Get users when component mounts, but do not auto-select any user
    getUsers();
    // Do not setSelectedUser here
  }, [getUsers]);


  // Filter users by search and online status
  let filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users.filter((user) => 
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Sort so online users always come first
  filteredUsers = filteredUsers.sort((a, b) => {
    const aOnline = onlineUsers.includes(a._id);
    const bOnline = onlineUsers.includes(b._id);
    if (aOnline === bOnline) return a.fullName.localeCompare(b.fullName);
    return bOnline - aOnline;
  });

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <div className="w-80 h-screen bg-base-200 border-r border-base-300 flex flex-col fixed top-0 left-0">
      {/* Header with branding and user menu */}
      <div className="flex-shrink-0 p-0 border-b border-base-300 bg-base-200">
        <div className="flex items-center justify-between p-2">
          {/* Branding */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              PulseChat
            </h1>
          </Link>

          {/* DevBot Widget */}
          <DevBotWidget />

          {/* User menu */}
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-base-300/50 rounded-full transition-colors"
            >
              <div className="avatar">
                <div className="size-8 rounded-full">
                  <img src={authUser?.profilePic || "/avatar.png"} alt={authUser?.fullName} />
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-base-content/70 transition-transform ${isUserMenuOpen ? 'transform rotate-180' : ''}`} />
            </button>
          
            {/* Dropdown menu */}
            {isUserMenuOpen && (
              <div 
                className="absolute right-0 mt-1 w-48 bg-base-100 rounded-lg shadow-lg border border-base-300 z-50 overflow-hidden"
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <div className="p-1">
                  <Link
                    to={`/profile/${authUser?.username || 'me'}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-md hover:bg-base-200 w-full text-left"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-md hover:bg-base-200 w-full text-left"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-md hover:bg-error/10 text-error w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search and filter section */}
      <div className="flex flex-col flex-shrink-0 p-4 border-b border-base-300 bg-base-200">
        
        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search contacts..."
            className="input input-bordered w-full pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg
            className="absolute left-3 top-3 h-4 w-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Online filter */}
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="toggle toggle-sm toggle-primary"
            />
            <span>Show online only</span>
          </label>
          <span className="badge badge-ghost">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'contact' : 'contacts'}
          </span>
        </div>
      </div>

      {/* Contacts List - Scrollable area */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user._id}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
                ${selectedUser?._id === user._id ? 'bg-primary/20' : user.unread ? 'bg-yellow-100 dark:bg-yellow-900/40 border-l-4 border-yellow-400' : 'hover:bg-base-300/50'}`}
              onClick={() => {
                setSelectedUser(user);
                navigate("/");
              }}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-base-200 flex-shrink-0">
                  <img 
                    src={user.profilePic || "/avatar.png"} 
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // If image fails to load, show fallback with initial
                      e.target.style.display = 'none';
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div 
                    className="w-full h-full flex items-center justify-center bg-primary/10 text-primary"
                    style={{ display: user.profilePic ? 'none' : 'flex' }}
                  >
                    {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                </div>
                {onlineUsers.includes(user._id) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-base-200"></div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate flex items-center gap-2">
                    {user.fullName}
                    {user.isBot && (
                      <span className="badge badge-primary badge-xs">AI</span>
                    )}
                  </p>
                  {user.lastMessageTime && (
                    <span className={`ml-2 text-xs ${user.unread ? 'text-primary font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                      {new Date(user.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`truncate text-sm ${user.unread ? 'font-semibold text-base-content' : 'text-gray-500 dark:text-gray-400'}`}>
                    {user.lastMessage ? (user.lastMessage.length > 32 ? user.lastMessage.slice(0, 32) + '…' : user.lastMessage) : ''}
                  </span>
                </div>
                {/* Optionally, keep username hidden for layout consistency */}
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate" style={{ display: 'none' }}>{user.username}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500">
            <Users className="w-10 h-10 mb-2 opacity-50" />
            <p>{showOnlineOnly ? 'No online users' : 'No contacts found'}</p>
            {searchQuery && <p className="text-sm mt-1">Try a different search term</p>}
          </div>
        )}
      </div>


    </div>
  );
};

export default Sidebar;
