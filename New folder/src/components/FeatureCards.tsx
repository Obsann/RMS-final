import { Card, CardContent } from "@/components/ui/card";
import { Users, ClipboardList, Home } from "lucide-react";
import { motion } from "motion/react";

const features = [
  {
    title: "Resident Management",
    description: "Manage residents, dependents, and digital IDs efficiently.",
    icon: Users,
  },
  {
    title: "Task Tracking",
    description: "Track maintenance tasks and employee assignments in real-time.",
    icon: ClipboardList,
  },
  {
    title: "Request System",
    description: "Handle maintenance requests and complaints seamlessly.",
    icon: Home,
  },
];

export default function FeatureCards() {
  return (
    <div className="bg-brand-light py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
              <CardContent className="p-8 flex items-start gap-6">
                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-brand-dark/5 transition-colors">
                  <feature.icon className="w-8 h-8 text-brand-dark" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-brand-dark mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
