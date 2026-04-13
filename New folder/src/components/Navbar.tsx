import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, ChevronDown } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-brand-dark rounded-sm flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <path d="M3 21h18" />
            <path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" />
            <path d="M5 21V10.85" />
            <path d="M19 21V10.85" />
            <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
          </svg>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-lg text-brand-dark tracking-tight">Resident</span>
          <span className="font-bold text-lg text-brand-dark tracking-tight -mt-1">Management</span>
          <span className="font-bold text-lg text-brand-dark tracking-tight -mt-1">System</span>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-brand-dark text-white hover:bg-brand-dark/90 hover:text-white border-none rounded-md px-4 py-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>English</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>English</DropdownMenuItem>
            <DropdownMenuItem>Spanish</DropdownMenuItem>
            <DropdownMenuItem>French</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
