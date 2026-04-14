import { Users, ClipboardList, Home } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

const FEATURES = [
  {
    icon: Users,
    title: 'Resident Management',
    desc: 'Manage residents, dependants, digital IDs, and household records in one place.',
    anim: 'welcome-anim-3',
  },
  {
    icon: ClipboardList,
    title: 'Task & Job Tracking',
    desc: 'Track administrative tasks and employee assignments in real-time across departments.',
    anim: 'welcome-anim-4',
  },
  {
    icon: Home,
    title: 'Request & Complaint System',
    desc: 'Handle resident requests, complaints, and certificate applications seamlessly.',
    anim: 'welcome-anim-5',
  },
];

export default function WelcomeFeatures() {
  return (
    <section className="bg-white py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-extrabold text-blue-900 mb-3" style={{ fontSize: 'clamp(22px,3.5vw,34px)' }}>
            Everything in One Platform
          </h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Built for modern residential communities that demand efficiency and transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, anim }) => (
            <div key={title} className={`${anim} welcome-card-hover`}>
              <Card className="border border-blue-50 shadow-md hover:shadow-xl transition-shadow cursor-pointer group h-full">
                <CardContent className="p-7 flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors flex items-center justify-center shadow-sm">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900 text-base mb-1.5">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
