export default function WelcomeFooter() {
  const currentYear = new Date().getFullYear();

  const links = ['Privacy Policy', 'Terms of Service', 'Help Center'];

  return (
    <footer className="bg-white border-t border-blue-100 py-6 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 flex-wrap">
        <p className="text-gray-400 text-xs">
          © {currentYear} Resident Management System. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link}
              href="#"
              className="text-gray-400 hover:text-blue-600 text-xs font-medium transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
