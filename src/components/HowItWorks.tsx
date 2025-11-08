import { Upload, Wand2, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Input Your Requirements",
    description: "Tell us about your product, target audience, and campaign goals. Upload your brand assets or let AI create them.",
  },
  {
    number: "02",
    icon: Wand2,
    title: "AI Generates Ads",
    description: "Our advanced AI creates multiple ad variations optimized for performance across all your chosen platforms.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Launch & Optimize",
    description: "Deploy your campaigns with one click. Our AI continuously monitors and optimizes for maximum ROI.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground">
            Get started in three simple steps and watch your campaigns soar
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection lines */}
            <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-30"></div>

            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <div className="text-center">
                    {/* Step number */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 mb-6 relative z-10 bg-background">
                      <span className="text-2xl font-bold text-primary">{step.number}</span>
                    </div>

                    {/* Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Icon className="w-10 h-10 text-primary" />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-semibold mb-4 text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
