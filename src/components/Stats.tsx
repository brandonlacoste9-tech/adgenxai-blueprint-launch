const stats = [
  {
    value: "10M+",
    label: "Ads Generated",
  },
  {
    value: "250%",
    label: "Average ROI Increase",
  },
  {
    value: "5,000+",
    label: "Happy Customers",
  },
  {
    value: "98%",
    label: "Customer Satisfaction",
  },
];

const Stats = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.25)] transition-all hover:-translate-y-1">
              <div className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-lg text-foreground/80">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
