import { MessageSquare } from "lucide-react";

const PulseChatLogo = ({ title = "Welcome", subtitle = "Sign in to your account" }) => {
  return (
    <div className="text-center mb-8">
      <div className="flex flex-col items-center gap-2 group">
        {/* Logo with pulse animation */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75"></div>
          <div 
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center 
            shadow-lg group-hover:shadow-primary/20 transition-all duration-300 relative z-10"
          >
            <MessageSquare className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
        </div>
        
        {/* Text */}
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mt-4">
          PULSECHAT
        </h1>
        <p className="text-lg font-medium text-base-content/80">{title}</p>
        <p className="text-sm text-base-content/60 max-w-xs">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default PulseChatLogo;
