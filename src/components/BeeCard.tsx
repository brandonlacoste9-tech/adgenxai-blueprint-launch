import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface BeeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

const BeeCard = ({ title, description, icon: Icon }: BeeCardProps) => {
  return (
    <Card className="group hover:-translate-y-2 transition-all duration-300 bg-card/60 backdrop-blur-xl border-white/10 shadow-[0_6px_16px_rgba(0,0,0,0.6)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
      <CardContent className="pt-6 pb-6 px-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal/20 to-cyan/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <Icon className="w-6 h-6 text-teal" />
          </div>
          <h3 className="text-xl font-semibold text-pink">{title}</h3>
        </div>
        <p className="text-foreground/70 leading-relaxed text-sm">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default BeeCard;
