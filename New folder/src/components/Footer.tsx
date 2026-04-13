export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-gray-500 text-sm">
          © {currentYear} Resident Management System. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <a href="#" className="text-gray-500 hover:text-brand-dark text-sm font-medium transition-colors">Privacy Policy</a>
          <a href="#" className="text-gray-500 hover:text-brand-dark text-sm font-medium transition-colors">Terms of Service</a>
          <a href="#" className="text-gray-500 hover:text-brand-dark text-sm font-medium transition-colors">Help Center</a>
        </div>
      </div>
    </footer>
  );
}
