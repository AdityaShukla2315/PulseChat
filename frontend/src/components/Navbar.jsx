import { useAuthStore } from "../store/useAuthStore";

const Navbar = () => {
  const { authUser } = useAuthStore();

  if (!authUser) return null;

  return (
    <header className="bg-base-100 border-b border-base-300 w-full h-6 fixed top-0 left-0 right-0 z-40">
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center justify-end h-full">
          {/* Empty for now, we'll add the user menu in ChatHeader */}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
