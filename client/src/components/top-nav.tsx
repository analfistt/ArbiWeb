import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, Bell, Settings, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function TopNav() {
  const { user, logout } = useAuth();

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard">
          <div className="flex items-center space-x-2 cursor-pointer">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-xl">ArbiTradeX</span>
          </div>
        </Link>

        {/* Right side icons */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <Button variant="ghost" size="icon" data-testid="button-notifications">
            <Bell className="h-5 w-5" />
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" data-testid="button-settings">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-9 w-9 rounded-full" 
                data-testid="button-user-menu"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user ? getInitials(user.email) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Account</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="menu-profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="menu-settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={logout}
                className="text-destructive focus:text-destructive"
                data-testid="menu-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
